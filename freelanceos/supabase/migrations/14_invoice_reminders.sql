CREATE TABLE invoice_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  sequence_step INTEGER NOT NULL CHECK (sequence_step IN (1, 2, 3)),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_pending ON invoice_reminders(status, scheduled_at)
  WHERE status = 'pending';

ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON invoice_reminders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage reminders"
  ON invoice_reminders FOR ALL
  USING (true)
  WITH CHECK (true);
