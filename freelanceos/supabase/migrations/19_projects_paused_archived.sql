-- ─────────────────────────────────────────────────────────────
-- 19 · Projects: extend status to paused + archived
--
-- The previous CHECK only allowed ('ongoing', 'done'). The new
-- /projects UI exposes 5 tabs (Tous / En cours / En pause /
-- Terminés / Archivés). We extend the constraint while keeping
-- existing data valid.
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────

-- 1. Drop the old check constraint (name may vary depending on
--    the original schema — we drop whatever matches).
DO $$
DECLARE
  conname text;
BEGIN
  SELECT tc.constraint_name
    INTO conname
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
   WHERE tc.table_schema = 'public'
     AND tc.table_name   = 'projects'
     AND tc.constraint_type = 'CHECK'
     AND cc.check_clause ILIKE '%status%'
   LIMIT 1;

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.projects DROP CONSTRAINT %I', conname);
  END IF;
END$$;

-- 2. Add the new, broader constraint
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('ongoing', 'paused', 'done', 'archived'));

-- 3. Index for tab filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
