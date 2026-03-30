import { NextRequest, NextResponse } from 'next/server'
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

  try {
    switch (event.type) {
      // ── Checkout completed: activate subscription ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id ?? session.metadata?.user_id

        if (!userId) {
          console.error('No user ID in checkout session')
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
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
