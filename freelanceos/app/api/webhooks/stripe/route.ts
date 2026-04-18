import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { stripe } from '@/lib/stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // ── Idempotency guard ────────────────────────────────────────────────
  // Stripe retries on non-2xx / timeouts for up to 3 days. Record the
  // event.id first; if the INSERT fails with a unique violation the event
  // has already been processed and we return 200 immediately without
  // re-running any side-effects.
  const { error: insertErr } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: event.id, event_type: event.type })

  if (insertErr) {
    // Postgres unique_violation = 23505
    if ((insertErr as any).code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Anything else is unexpected — report and 500 so Stripe retries.
    console.error('Failed to record webhook event:', insertErr)
    Sentry.captureException(insertErr, {
      tags: { scope: 'stripe-webhook', stage: 'idempotency-insert' },
      extra: { event_id: event.id, event_type: event.type },
    })
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    )
  }

  try {
    switch (event.type) {
      // ── Checkout completed: activate subscription ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id ?? session.metadata?.user_id

        if (!userId) {
          console.error('No user ID in checkout session')
          Sentry.captureMessage('Stripe checkout missing user_id', {
            level: 'error',
            tags: { scope: 'stripe-webhook' },
            extra: { event_id: event.id, session_id: session.id },
          })
          break
        }

        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_status: 'active',
            plan_type: 'pro',
          })
          .eq('id', userId)

        break
      }

      // ── Subscription updated (upgrade, downgrade, payment issue) ──
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'canceled',
          unpaid: 'past_due',
          trialing: 'active',
        }

        await supabase
          .from('profiles')
          .update({
            plan_status: statusMap[subscription.status] ?? subscription.status,
            stripe_subscription_id: subscription.id,
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      // ── Subscription deleted (canceled and period ended) ──
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabase
          .from('profiles')
          .update({
            plan_status: 'canceled',
            plan_type: 'free',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', customerId)

        break
      }

      // ── Invoice payment failed ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('profiles')
          .update({ plan_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    Sentry.captureException(err, {
      tags: { scope: 'stripe-webhook', stage: 'handler' },
      extra: { event_id: event.id, event_type: event.type },
    })
    // Roll back the idempotency row so Stripe's retry can re-run the
    // handler — otherwise we'd be stuck with a half-applied event.
    await supabase.from('stripe_webhook_events').delete().eq('id', event.id)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
