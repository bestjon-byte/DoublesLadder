-- ============================================================================
-- COACHING MANAGEMENT SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This schema supports:
-- - Admin-configurable recurring coaching schedules
-- - Session attendance tracking (self-registration + admin marking)
-- - Payment tracking and billing
-- - Historical data import capability
--
-- NOTE: Access control was removed in v1.1.0 - all authenticated users can access coaching
-- ============================================================================

-- ============================================================================
-- TABLE: coaching_schedules
-- Stores recurring schedule patterns defined by admins
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('Adults', 'Beginners')),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  session_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(session_type, day_of_week, session_time, is_active) -- Prevent duplicate active schedules
);

-- Index for finding active schedules
CREATE INDEX IF NOT EXISTS idx_coaching_schedules_active ON coaching_schedules(is_active, day_of_week) WHERE is_active = true;

COMMENT ON TABLE coaching_schedules IS 'Recurring coaching schedule patterns (e.g., Adults every Wednesday at 6pm)';
COMMENT ON COLUMN coaching_schedules.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

-- ============================================================================
-- TABLE: coaching_sessions
-- Individual session instances (generated from schedules or created manually)
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES coaching_schedules(id) ON DELETE SET NULL, -- NULL if manually created
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('Adults', 'Beginners')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  cancellation_reason TEXT,
  UNIQUE(session_date, session_time, session_type) -- Prevent duplicate sessions
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_date ON coaching_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_schedule ON coaching_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status ON coaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_type_date ON coaching_sessions(session_type, session_date);

COMMENT ON TABLE coaching_sessions IS 'Individual coaching session instances';
COMMENT ON COLUMN coaching_sessions.schedule_id IS 'Reference to recurring schedule (NULL if one-off session)';

-- ============================================================================
-- TABLE: coaching_access (DEPRECATED - REMOVED IN v1.1.0)
-- ============================================================================
-- This table was removed in migration v1.1.0-coaching
-- Coaching features are now open to all authenticated users
-- See: migrations/remove_coaching_access_control.sql

-- ============================================================================
-- TABLE: coaching_attendance
-- Tracks who attended which sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Who recorded the attendance
  self_registered BOOLEAN DEFAULT false, -- true if player marked themselves, false if admin marked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(session_id, player_id) -- Each player can only attend a session once
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coaching_attendance_session ON coaching_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_coaching_attendance_player ON coaching_attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_coaching_attendance_player_date ON coaching_attendance(player_id, created_at DESC);

COMMENT ON TABLE coaching_attendance IS 'Records of player attendance at coaching sessions';
COMMENT ON COLUMN coaching_attendance.marked_by IS 'User who marked attendance (could be player themselves or admin)';

-- ============================================================================
-- TABLE: coaching_payments
-- Payment tracking and billing records
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL, -- £4 per session
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who created the payment request
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  payment_deadline DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  marked_paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who marked as paid
  payment_reference TEXT, -- Bank transfer reference
  notes TEXT,
  CHECK (billing_period_end >= billing_period_start),
  CHECK (total_sessions >= 0),
  CHECK (amount_due >= 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coaching_payments_player ON coaching_payments(player_id);
CREATE INDEX IF NOT EXISTS idx_coaching_payments_status ON coaching_payments(status);
CREATE INDEX IF NOT EXISTS idx_coaching_payments_player_status ON coaching_payments(player_id, status);
CREATE INDEX IF NOT EXISTS idx_coaching_payments_period ON coaching_payments(billing_period_start, billing_period_end);

COMMENT ON TABLE coaching_payments IS 'Payment tracking for coaching sessions (£4 per session)';
COMMENT ON COLUMN coaching_payments.amount_due IS 'Total amount owed (£4 × total_sessions)';

-- ============================================================================
-- TABLE: coaching_payment_sessions
-- Links payments to the specific sessions being billed
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_payment_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES coaching_payments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(payment_id, session_id) -- Each session can only be in one payment record
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coaching_payment_sessions_payment ON coaching_payment_sessions(payment_id);
CREATE INDEX IF NOT EXISTS idx_coaching_payment_sessions_session ON coaching_payment_sessions(session_id);

COMMENT ON TABLE coaching_payment_sessions IS 'Junction table linking payments to specific sessions';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE coaching_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_payment_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: coaching_schedules
-- ============================================================================

-- Admins can do everything with schedules
CREATE POLICY coaching_schedules_admin_all ON coaching_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can view active schedules (updated in v1.1.0)
CREATE POLICY coaching_schedules_authenticated_select ON coaching_schedules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- RLS POLICIES: coaching_sessions
-- ============================================================================

-- Admins can do everything with sessions
CREATE POLICY coaching_sessions_admin_all ON coaching_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can view sessions (updated in v1.1.0)
CREATE POLICY coaching_sessions_authenticated_select ON coaching_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS POLICIES: coaching_access (REMOVED IN v1.1.0)
-- ============================================================================
-- These policies were removed when coaching_access table was dropped
-- See: migrations/remove_coaching_access_control.sql

-- ============================================================================
-- RLS POLICIES: coaching_attendance
-- ============================================================================

-- Admins can do everything with attendance
CREATE POLICY coaching_attendance_admin_all ON coaching_attendance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- All authenticated users can view attendance (updated in v1.1.0)
CREATE POLICY coaching_attendance_authenticated_select ON coaching_attendance
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can mark their own attendance (self-register) (updated in v1.1.0)
CREATE POLICY coaching_attendance_user_insert_own ON coaching_attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    AND marked_by = auth.uid()
    AND self_registered = true
  );

-- Users can delete their own attendance (unregister)
CREATE POLICY coaching_attendance_user_delete_own ON coaching_attendance
  FOR DELETE
  TO authenticated
  USING (
    player_id = auth.uid()
    AND self_registered = true
  );

-- ============================================================================
-- RLS POLICIES: coaching_payments
-- ============================================================================

-- Admins can do everything with payments
CREATE POLICY coaching_payments_admin_all ON coaching_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Players can view their own payments
CREATE POLICY coaching_payments_player_select_own ON coaching_payments
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: coaching_payment_sessions
-- ============================================================================

-- Admins can manage payment-session links
CREATE POLICY coaching_payment_sessions_admin_all ON coaching_payment_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Players can view payment-session links for their own payments
CREATE POLICY coaching_payment_sessions_player_select_own ON coaching_payment_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaching_payments
      WHERE coaching_payments.id = payment_id
      AND coaching_payments.player_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically generate sessions from active schedules
-- Run this weekly to create upcoming sessions
CREATE OR REPLACE FUNCTION generate_coaching_sessions(
  weeks_ahead INTEGER DEFAULT 4
)
RETURNS TABLE (
  session_id UUID,
  session_type VARCHAR,
  session_date DATE,
  session_time TIME
) AS $$
DECLARE
  schedule RECORD;
  target_date DATE;
  days_until_target INTEGER;
  week_offset INTEGER;
BEGIN
  -- Loop through active schedules
  FOR schedule IN
    SELECT * FROM coaching_schedules
    WHERE is_active = true
  LOOP
    -- Generate sessions for the next N weeks
    FOR week_offset IN 0..weeks_ahead-1 LOOP
      -- Calculate next occurrence of this day of week
      days_until_target := (schedule.day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 7) % 7;
      IF days_until_target = 0 AND week_offset = 0 AND CURRENT_TIME > schedule.session_time THEN
        days_until_target := 7; -- If today but time passed, schedule for next week
      END IF;
      target_date := CURRENT_DATE + days_until_target + (week_offset * 7);

      -- Only create if doesn't already exist
      INSERT INTO coaching_sessions (
        schedule_id,
        session_date,
        session_time,
        session_type,
        status,
        created_by
      )
      VALUES (
        schedule.id,
        target_date,
        schedule.session_time,
        schedule.session_type,
        'scheduled',
        schedule.created_by
      )
      ON CONFLICT (session_date, session_time, session_type) DO NOTHING
      RETURNING id, session_type, session_date, session_time
      INTO session_id, session_type, session_date, session_time;

      IF session_id IS NOT NULL THEN
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_coaching_sessions IS 'Auto-generates upcoming coaching sessions from active schedules';

-- Function to calculate unpaid sessions for a player
CREATE OR REPLACE FUNCTION get_unpaid_coaching_sessions(
  p_player_id UUID,
  p_billing_period_start DATE DEFAULT NULL,
  p_billing_period_end DATE DEFAULT NULL
)
RETURNS TABLE (
  session_id UUID,
  session_date DATE,
  session_type VARCHAR,
  session_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.session_date,
    cs.session_type,
    cs.session_time
  FROM coaching_sessions cs
  INNER JOIN coaching_attendance ca ON ca.session_id = cs.id
  WHERE ca.player_id = p_player_id
    AND cs.status = 'completed'
    AND (p_billing_period_start IS NULL OR cs.session_date >= p_billing_period_start)
    AND (p_billing_period_end IS NULL OR cs.session_date <= p_billing_period_end)
    AND NOT EXISTS (
      -- Exclude sessions already in a payment record
      SELECT 1 FROM coaching_payment_sessions cps
      INNER JOIN coaching_payments cp ON cp.id = cps.payment_id
      WHERE cps.session_id = cs.id
      AND cp.status != 'cancelled'
    )
  ORDER BY cs.session_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unpaid_coaching_sessions IS 'Returns sessions attended by player that have not been billed';

-- Function to create a payment request for a player
CREATE OR REPLACE FUNCTION create_coaching_payment_request(
  p_player_id UUID,
  p_billing_period_start DATE,
  p_billing_period_end DATE,
  p_created_by UUID,
  p_payment_deadline DATE DEFAULT NULL,
  p_session_cost DECIMAL DEFAULT 4.00
)
RETURNS UUID AS $$
DECLARE
  v_payment_id UUID;
  v_session_count INTEGER;
  v_total_amount DECIMAL;
  v_session RECORD;
BEGIN
  -- Count unpaid sessions in period
  SELECT COUNT(*) INTO v_session_count
  FROM get_unpaid_coaching_sessions(p_player_id, p_billing_period_start, p_billing_period_end);

  IF v_session_count = 0 THEN
    RAISE EXCEPTION 'No unpaid sessions found for player in the specified period';
  END IF;

  -- Calculate total amount
  v_total_amount := v_session_count * p_session_cost;

  -- Create payment record
  INSERT INTO coaching_payments (
    player_id,
    billing_period_start,
    billing_period_end,
    total_sessions,
    amount_due,
    status,
    created_by,
    payment_deadline
  )
  VALUES (
    p_player_id,
    p_billing_period_start,
    p_billing_period_end,
    v_session_count,
    v_total_amount,
    'pending',
    p_created_by,
    COALESCE(p_payment_deadline, p_billing_period_end + INTERVAL '7 days')
  )
  RETURNING id INTO v_payment_id;

  -- Link sessions to payment
  FOR v_session IN
    SELECT session_id
    FROM get_unpaid_coaching_sessions(p_player_id, p_billing_period_start, p_billing_period_end)
  LOOP
    INSERT INTO coaching_payment_sessions (payment_id, session_id)
    VALUES (v_payment_id, v_session.session_id);
  END LOOP;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_coaching_payment_request IS 'Creates a payment request for unpaid sessions in a date range';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on schedules
CREATE OR REPLACE FUNCTION update_coaching_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coaching_schedules_updated_at
  BEFORE UPDATE ON coaching_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_coaching_schedule_timestamp();

-- Update updated_at timestamp on sessions
CREATE OR REPLACE FUNCTION update_coaching_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coaching_sessions_updated_at
  BEFORE UPDATE ON coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coaching_session_timestamp();

-- ============================================================================
-- INITIAL DATA / SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Uncomment to insert sample schedules for testing
-- INSERT INTO coaching_schedules (session_type, day_of_week, session_time, notes) VALUES
--   ('Adults', 3, '18:00:00', 'Wednesday evening adult coaching'),
--   ('Beginners', 2, '19:00:00', 'Tuesday evening beginner coaching');

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

-- Create a simple version tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Record this schema version
INSERT INTO schema_versions (version, description) VALUES
  ('1.0.0-coaching', 'Initial coaching management system schema');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
