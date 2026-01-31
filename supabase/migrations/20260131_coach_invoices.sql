-- Coach Invoice System Migration
-- Creates tables for coach invoice requests and settings

-- ============================================
-- COACH INVOICES TABLE
-- Tracks invoice requests from coach to club
-- ============================================
CREATE TABLE IF NOT EXISTS coach_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number SERIAL UNIQUE,
  coach_id UUID NOT NULL REFERENCES profiles(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_count INTEGER NOT NULL,
  rate_per_session DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- status: 'pending', 'paid', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES profiles(id),
  payment_reference TEXT,
  -- Link to coach_payments record when paid
  linked_payment_id UUID REFERENCES coach_payments(id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_coach_invoices_status ON coach_invoices(status);
CREATE INDEX IF NOT EXISTS idx_coach_invoices_coach ON coach_invoices(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_invoices_date ON coach_invoices(invoice_date DESC);

-- ============================================
-- COACH SETTINGS TABLE
-- Stores coach rate and invoice details
-- ============================================
CREATE TABLE IF NOT EXISTS coach_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  rate_per_session DECIMAL(10,2) NOT NULL DEFAULT 20.00,
  -- Coach details for invoices
  coach_name TEXT DEFAULT 'Joseph Fletcher',
  coach_address_line1 TEXT DEFAULT 'Newland Grange',
  coach_address_line2 TEXT DEFAULT 'Newland',
  coach_town TEXT DEFAULT 'Selby',
  coach_postcode TEXT DEFAULT 'YO8 8PS',
  bank_account_number TEXT DEFAULT '72240459',
  bank_sort_code TEXT DEFAULT '40-47-65',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for coach lookup
CREATE INDEX IF NOT EXISTS idx_coach_settings_coach ON coach_settings(coach_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE coach_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_settings ENABLE ROW LEVEL SECURITY;

-- Coach Invoices Policies
-- Coaches can read their own invoices
CREATE POLICY "Coaches can read own invoices" ON coach_invoices
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coaches can create their own invoices
CREATE POLICY "Coaches can create own invoices" ON coach_invoices
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Admins can read all invoices
CREATE POLICY "Admins can read all invoices" ON coach_invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update any invoice (to mark as paid)
CREATE POLICY "Admins can update invoices" ON coach_invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Coach Settings Policies
-- Coaches can read their own settings
CREATE POLICY "Coaches can read own settings" ON coach_settings
  FOR SELECT
  USING (coach_id = auth.uid());

-- Coaches can update their own settings
CREATE POLICY "Coaches can update own settings" ON coach_settings
  FOR UPDATE
  USING (coach_id = auth.uid());

-- Coaches can insert their own settings
CREATE POLICY "Coaches can insert own settings" ON coach_settings
  FOR INSERT
  WITH CHECK (coach_id = auth.uid());

-- Admins can read all settings
CREATE POLICY "Admins can read all coach settings" ON coach_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- INITIALIZE DEFAULT SETTINGS FOR EXISTING COACHES
-- ============================================
INSERT INTO coach_settings (coach_id, rate_per_session, coach_name)
SELECT id, 20.00, name FROM profiles WHERE role = 'coach'
ON CONFLICT (coach_id) DO NOTHING;

-- ============================================
-- HELPER FUNCTION: Get or create coach settings
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_coach_settings(p_coach_id UUID)
RETURNS coach_settings AS $$
DECLARE
  result coach_settings;
BEGIN
  -- Try to get existing settings
  SELECT * INTO result FROM coach_settings WHERE coach_id = p_coach_id;

  -- If not found, create default settings
  IF result IS NULL THEN
    INSERT INTO coach_settings (coach_id, rate_per_session)
    VALUES (p_coach_id, 20.00)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Create coach invoice
-- ============================================
CREATE OR REPLACE FUNCTION create_coach_invoice(
  p_coach_id UUID,
  p_sessions_count INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS coach_invoices AS $$
DECLARE
  v_settings coach_settings;
  v_invoice coach_invoices;
BEGIN
  -- Get coach settings
  SELECT * INTO v_settings FROM coach_settings WHERE coach_id = p_coach_id;

  IF v_settings IS NULL THEN
    RAISE EXCEPTION 'Coach settings not found';
  END IF;

  -- Create invoice
  INSERT INTO coach_invoices (
    coach_id,
    sessions_count,
    rate_per_session,
    total_amount,
    notes
  ) VALUES (
    p_coach_id,
    p_sessions_count,
    v_settings.rate_per_session,
    p_sessions_count * v_settings.rate_per_session,
    p_notes
  ) RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Mark invoice as paid
-- ============================================
CREATE OR REPLACE FUNCTION mark_invoice_paid(
  p_invoice_id UUID,
  p_paid_by UUID,
  p_payment_reference TEXT DEFAULT NULL,
  p_linked_payment_id UUID DEFAULT NULL
)
RETURNS coach_invoices AS $$
DECLARE
  v_invoice coach_invoices;
BEGIN
  UPDATE coach_invoices
  SET
    status = 'paid',
    paid_at = NOW(),
    paid_by = p_paid_by,
    payment_reference = p_payment_reference,
    linked_payment_id = p_linked_payment_id
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get pending invoices (for admin)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_coach_invoices()
RETURNS TABLE (
  invoice_id UUID,
  invoice_number INTEGER,
  coach_id UUID,
  coach_name TEXT,
  invoice_date DATE,
  sessions_count INTEGER,
  rate_per_session DECIMAL,
  total_amount DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id as invoice_id,
    ci.invoice_number,
    ci.coach_id,
    COALESCE(cs.coach_name, p.name) as coach_name,
    ci.invoice_date,
    ci.sessions_count,
    ci.rate_per_session,
    ci.total_amount,
    ci.notes,
    ci.created_at
  FROM coach_invoices ci
  JOIN profiles p ON p.id = ci.coach_id
  LEFT JOIN coach_settings cs ON cs.coach_id = ci.coach_id
  WHERE ci.status = 'pending'
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get coach invoices (for coach view)
-- ============================================
CREATE OR REPLACE FUNCTION get_coach_invoices(p_coach_id UUID)
RETURNS TABLE (
  invoice_id UUID,
  invoice_number INTEGER,
  invoice_date DATE,
  sessions_count INTEGER,
  rate_per_session DECIMAL,
  total_amount DECIMAL,
  status VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id as invoice_id,
    ci.invoice_number,
    ci.invoice_date,
    ci.sessions_count,
    ci.rate_per_session,
    ci.total_amount,
    ci.status,
    ci.notes,
    ci.created_at,
    ci.paid_at,
    ci.payment_reference
  FROM coach_invoices ci
  WHERE ci.coach_id = p_coach_id
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
