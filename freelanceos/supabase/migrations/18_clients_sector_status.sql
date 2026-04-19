-- ─────────────────────────────────────────────────────────────
-- 18 · Clients: sector + status
--
-- Adds two nullable/defaulted fields so the new /clients list UI
-- can show a sector tagline under the client name and a lifecycle
-- status pill (active / prospect / inactive).
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────

-- 1. Add sector (free text, nullable)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS sector TEXT;

-- 2. Add status with a CHECK constraint + default
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- 3. Drop any pre-existing check (re-run safety) and add it fresh
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_status_check
  CHECK (status IN ('active', 'prospect', 'inactive'));

-- 4. Helpful index for filtering by status (cheap, small cardinality)
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- 5. Backfill: any row created before this migration defaults to 'active'
UPDATE public.clients SET status = 'active' WHERE status IS NULL;
