'use server'

import { stripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function createCheckoutSession(priceId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // Fetch profile for email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Build session params
  const params: Record<string, any> = {
    mode: 'subscription' as const,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?billing=canceled`,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
  }

  // Reuse existing Stripe customer if we have one
  if (profile?.stripe_customer_id) {
    params.customer = profile.stripe_customer_id
  } else {
    params.customer_email = profile?.email ?? user.email
  }

  const session = await stripe.checkout.sessions.create(params)

  return { url: session.url }
}

export async function createBillingPortalSession() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw new Error('Aucun abonnement actif')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`,
  })

  return { url: session.url }
}
