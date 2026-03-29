-- Backfill workspace_id on existing data that was missed
-- Links orphaned rows to their owner's workspace

UPDATE clients c
SET workspace_id = wm.workspace_id
FROM workspace_members wm
WHERE c.user_id = wm.user_id
  AND wm.role = 'owner'
  AND c.workspace_id IS NULL;

UPDATE projects p
SET workspace_id = wm.workspace_id
FROM workspace_members wm
WHERE p.user_id = wm.user_id
  AND wm.role = 'owner'
  AND p.workspace_id IS NULL;

UPDATE invoices i
SET workspace_id = wm.workspace_id
FROM workspace_members wm
WHERE i.user_id = wm.user_id
  AND wm.role = 'owner'
  AND i.workspace_id IS NULL;
