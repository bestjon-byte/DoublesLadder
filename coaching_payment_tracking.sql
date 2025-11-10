-- ============================================
-- COACH PAYMENT TRACKING SYSTEM
-- Tracks what the club owes the coach
-- ============================================

-- 1. COACH PAYMENT CONFIG TABLE
-- Stores configurable rates per session type
CREATE TABLE IF NOT EXISTS coach_payment_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_type VARCHAR(50) NOT NULL,
    rate_per_session DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE DEFAULT NULL, -- NULL means current rate
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_active_rate UNIQUE (session_type, effective_from)
);

-- 2. COACH PAYMENTS TABLE
-- Tracks all payments made TO the coach
CREATE TABLE IF NOT EXISTS coach_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (payment_type IN ('regular', 'advance', 'goodwill')),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    reference VARCHAR(255),
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADD FIELDS TO EXISTING coaching_sessions TABLE
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS coach_payment_status VARCHAR(20) DEFAULT 'to_pay' CHECK (coach_payment_status IN ('to_pay', 'no_payment', 'not_applicable')),
ADD COLUMN IF NOT EXISTS coach_payment_amount DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS coach_payment_notes TEXT;

-- 4. UPDATE session_type TO INCLUDE 'Juniors'
-- First, drop existing constraint if it exists
ALTER TABLE coaching_sessions
DROP CONSTRAINT IF EXISTS coaching_sessions_session_type_check;

-- Add new constraint with Juniors included
ALTER TABLE coaching_sessions
ADD CONSTRAINT coaching_sessions_session_type_check
CHECK (session_type IN ('Adults', 'Beginners', 'Juniors'));

-- Do the same for coaching_schedules
ALTER TABLE coaching_schedules
DROP CONSTRAINT IF EXISTS coaching_schedules_session_type_check;

ALTER TABLE coaching_schedules
ADD CONSTRAINT coaching_schedules_session_type_check
CHECK (session_type IN ('Adults', 'Beginners', 'Juniors'));

-- 5. INSERT DEFAULT RATES FOR EACH SESSION TYPE
INSERT INTO coach_payment_config (session_type, rate_per_session, effective_from, notes)
VALUES
    ('Adults', 20.00, CURRENT_DATE, 'Default rate for adult coaching sessions'),
    ('Beginners', 20.00, CURRENT_DATE, 'Default rate for beginners coaching sessions'),
    ('Juniors', 20.00, CURRENT_DATE, 'Default rate for junior coaching sessions')
ON CONFLICT (session_type, effective_from) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- FUNCTION: Get current rate for a session type
CREATE OR REPLACE FUNCTION get_coach_rate(p_session_type VARCHAR)
RETURNS DECIMAL AS $$
DECLARE
    v_rate DECIMAL;
BEGIN
    SELECT rate_per_session INTO v_rate
    FROM coach_payment_config
    WHERE session_type = p_session_type
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY effective_from DESC
    LIMIT 1;

    -- Default to £20 if no rate found
    RETURN COALESCE(v_rate, 20.00);
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Get coach payment summary
CREATE OR REPLACE FUNCTION get_coach_payment_summary()
RETURNS TABLE (
    total_paid DECIMAL,
    total_owed DECIMAL,
    balance DECIMAL,
    sessions_to_pay_count INTEGER,
    sessions_no_payment_count INTEGER,
    adults_owed DECIMAL,
    beginners_owed DECIMAL,
    juniors_owed DECIMAL,
    adults_sessions_count INTEGER,
    beginners_sessions_count INTEGER,
    juniors_sessions_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH payment_totals AS (
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM coach_payments
    ),
    session_totals AS (
        SELECT
            COALESCE(SUM(
                CASE
                    WHEN cs.coach_payment_amount IS NOT NULL THEN cs.coach_payment_amount
                    ELSE get_coach_rate(cs.session_type)
                END
            ) FILTER (WHERE cs.coach_payment_status = 'to_pay'), 0) as total_owed,

            COUNT(*) FILTER (WHERE cs.coach_payment_status = 'to_pay') as sessions_to_pay,
            COUNT(*) FILTER (WHERE cs.coach_payment_status = 'no_payment') as sessions_no_payment,

            -- Per session type breakdowns
            COALESCE(SUM(
                CASE
                    WHEN cs.coach_payment_amount IS NOT NULL THEN cs.coach_payment_amount
                    ELSE get_coach_rate(cs.session_type)
                END
            ) FILTER (WHERE cs.session_type = 'Adults' AND cs.coach_payment_status = 'to_pay'), 0) as adults_owed,

            COALESCE(SUM(
                CASE
                    WHEN cs.coach_payment_amount IS NOT NULL THEN cs.coach_payment_amount
                    ELSE get_coach_rate(cs.session_type)
                END
            ) FILTER (WHERE cs.session_type = 'Beginners' AND cs.coach_payment_status = 'to_pay'), 0) as beginners_owed,

            COALESCE(SUM(
                CASE
                    WHEN cs.coach_payment_amount IS NOT NULL THEN cs.coach_payment_amount
                    ELSE get_coach_rate(cs.session_type)
                END
            ) FILTER (WHERE cs.session_type = 'Juniors' AND cs.coach_payment_status = 'to_pay'), 0) as juniors_owed,

            COUNT(*) FILTER (WHERE cs.session_type = 'Adults' AND cs.coach_payment_status = 'to_pay') as adults_count,
            COUNT(*) FILTER (WHERE cs.session_type = 'Beginners' AND cs.coach_payment_status = 'to_pay') as beginners_count,
            COUNT(*) FILTER (WHERE cs.session_type = 'Juniors' AND cs.coach_payment_status = 'to_pay') as juniors_count
        FROM coaching_sessions cs
    )
    SELECT
        pt.total_paid,
        st.total_owed,
        pt.total_paid - st.total_owed as balance,
        st.sessions_to_pay::INTEGER,
        st.sessions_no_payment::INTEGER,
        st.adults_owed,
        st.beginners_owed,
        st.juniors_owed,
        st.adults_count::INTEGER,
        st.beginners_count::INTEGER,
        st.juniors_count::INTEGER
    FROM payment_totals pt, session_totals st;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Get sessions awaiting payment
CREATE OR REPLACE FUNCTION get_coach_sessions_to_pay()
RETURNS TABLE (
    session_id UUID,
    session_date DATE,
    session_time TIME,
    session_type VARCHAR,
    status VARCHAR,
    amount_owed DECIMAL,
    notes TEXT,
    cancellation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id as session_id,
        cs.session_date,
        cs.session_time,
        cs.session_type,
        cs.status,
        CASE
            WHEN cs.coach_payment_amount IS NOT NULL THEN cs.coach_payment_amount
            ELSE get_coach_rate(cs.session_type)
        END as amount_owed,
        cs.notes,
        cs.cancellation_reason
    FROM coaching_sessions cs
    WHERE cs.coach_payment_status = 'to_pay'
    ORDER BY cs.session_date DESC, cs.session_time DESC;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Record payment to coach
CREATE OR REPLACE FUNCTION record_coach_payment(
    p_payment_date DATE,
    p_amount DECIMAL,
    p_payment_type VARCHAR,
    p_payment_method VARCHAR,
    p_reference VARCHAR,
    p_notes TEXT,
    p_recorded_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    INSERT INTO coach_payments (
        payment_date,
        amount,
        payment_type,
        payment_method,
        reference,
        notes,
        recorded_by
    ) VALUES (
        p_payment_date,
        p_amount,
        p_payment_type,
        p_payment_method,
        p_reference,
        p_notes,
        p_recorded_by
    )
    RETURNING id INTO v_payment_id;

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Mark sessions as paid (for manual allocation if needed)
CREATE OR REPLACE FUNCTION mark_coach_sessions_paid(
    p_session_ids UUID[],
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    updated BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    UPDATE coaching_sessions
    SET
        coach_payment_status = 'to_pay', -- Actually marking as accounted for, but keeping as to_pay for history
        coach_payment_notes = COALESCE(p_notes, coach_payment_notes),
        updated_at = NOW()
    WHERE id = ANY(p_session_ids)
    RETURNING id, true;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Update coach payment rate
CREATE OR REPLACE FUNCTION update_coach_rate(
    p_session_type VARCHAR,
    p_new_rate DECIMAL,
    p_effective_from DATE,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_config_id UUID;
BEGIN
    -- End current rate if exists
    UPDATE coach_payment_config
    SET effective_to = p_effective_from - INTERVAL '1 day'
    WHERE session_type = p_session_type
    AND effective_to IS NULL;

    -- Insert new rate
    INSERT INTO coach_payment_config (
        session_type,
        rate_per_session,
        effective_from,
        notes
    ) VALUES (
        p_session_type,
        p_new_rate,
        p_effective_from,
        p_notes
    )
    RETURNING id INTO v_config_id;

    RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Get payment history
CREATE OR REPLACE FUNCTION get_coach_payment_history()
RETURNS TABLE (
    payment_id UUID,
    payment_date DATE,
    amount DECIMAL,
    payment_type VARCHAR,
    payment_method VARCHAR,
    reference VARCHAR,
    notes TEXT,
    recorded_by_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cp.id as payment_id,
        cp.payment_date,
        cp.amount,
        cp.payment_type,
        cp.payment_method,
        cp.reference,
        cp.notes,
        p.name as recorded_by_name,
        cp.created_at
    FROM coach_payments cp
    LEFT JOIN profiles p ON cp.recorded_by = p.id
    ORDER BY cp.payment_date DESC, cp.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE coach_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_payments ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to coach_payment_config"
    ON coach_payment_config
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin full access to coach_payments"
    ON coach_payments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Regular users cannot see coach payment data at all
-- (No policies = no access for non-admins)

-- ============================================
-- TRIGGER: Auto-set coach_payment_amount on session creation
-- ============================================

CREATE OR REPLACE FUNCTION set_default_coach_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- If coach_payment_amount not set, use current rate
    IF NEW.coach_payment_amount IS NULL THEN
        NEW.coach_payment_amount := get_coach_rate(NEW.session_type);
    END IF;

    -- If session is completed or cancelled with "to_pay", ensure payment status is set
    IF NEW.status IN ('completed', 'cancelled') AND NEW.coach_payment_status IS NULL THEN
        NEW.coach_payment_status := 'to_pay'; -- Default to paying coach
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_coach_payment_amount
    BEFORE INSERT OR UPDATE ON coaching_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_default_coach_payment_amount();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_coach_payment_config_type_date
    ON coach_payment_config(session_type, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_coach_payments_date
    ON coach_payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_payment_status
    ON coaching_sessions(coach_payment_status)
    WHERE coach_payment_status = 'to_pay';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON coach_payment_config TO authenticated;
GRANT ALL ON coach_payments TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE coach_payment_config IS 'Configurable payment rates for coaching sessions by type';
COMMENT ON TABLE coach_payments IS 'Track all payments made to the coach (club liability tracking)';
COMMENT ON COLUMN coaching_sessions.coach_payment_status IS 'Whether this session should be paid to coach: to_pay, no_payment, not_applicable';
COMMENT ON COLUMN coaching_sessions.coach_payment_amount IS 'Amount owed to coach for this session (overrides default rate if set)';
COMMENT ON FUNCTION get_coach_payment_summary() IS 'Returns overall summary: total paid, total owed, balance';
COMMENT ON FUNCTION get_coach_sessions_to_pay() IS 'Returns all sessions awaiting payment to coach';
COMMENT ON FUNCTION record_coach_payment(DATE, DECIMAL, VARCHAR, VARCHAR, VARCHAR, TEXT, UUID) IS 'Record a payment made to the coach';
