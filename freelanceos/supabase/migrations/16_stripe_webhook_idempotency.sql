-- ────────────────────────────────────────────────────────────────────────────
-- Migration 16 — Stripe webhook idempotency
-- ────────────────────────────────────────────────────────────────────────────
-- Stripe retries webhooks aggressively (up to 3 days) when the endpoint
-- returns non-2xx or times out. Without idempotency, a retried
-- `checkout.session.completed` re-runs the profile update, which is
-- currently benign (UPDATE is idempotent) but dangerous as soon as we add
-- non-idempotent side-effects (credit grants, welcome emails, analytics).
--
-- We record every processed event.id in this table. The webhook handler
-- inserts first; duplicate PK raises a unique violation, which we catch
-- and treat as "already processed — return 200 immediately".
--
-- Service-role only: RLS is enabled with no user-facing policies so even
-- a leaked anon key cannot read/write here.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id           text PRIMARY KEY,
  event_type   text        NOT NULL,
  received_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Stripe event IDs we have already processed. Used for webhook idempotency.';

CREATE INDEX IF NOT EXISTS stripe_webhook_events_received_at_idx
  ON public.stripe_webhook_events (received_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only the service role (which bypasses RLS)
-- should touch this table.
