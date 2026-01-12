-- Migration: Add Match Fees Payment System
-- Date: 2026-01-12
-- Description: Extends payment tracking to include match fees (ladder, league, singles)

-- ============================================
-- 1. Add match fee columns to seasons table
-- ============================================
ALTER TABLE seasons
ADD COLUMN IF NOT EXISTS match_fee_ladder DECIMAL(10,2) DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS match_fee_league DECIMAL(10,2) DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS match_fee_singles DECIMAL(10,2) DEFAULT 2.00;

-- Update existing seasons with default values
UPDATE seasons
SET match_fee_ladder = 2.00,
    match_fee_league = 2.00,
    match_fee_singles = 2.00
WHERE match_fee_ladder IS NULL;

-- ============================================
-- 2. Create match_fees table
-- ============================================
CREATE TABLE IF NOT EXISTS match_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  fee_amount DECIMAL(10,2) NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('ladder', 'league', 'singles_championship')),
  match_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending_confirmation', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One fee per player per match day
  UNIQUE(player_id, match_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_match_fees_player_id ON match_fees(player_id);
CREATE INDEX IF NOT EXISTS idx_match_fees_match_id ON match_fees(match_id);
CREATE INDEX IF NOT EXISTS idx_match_fees_payment_status ON match_fees(payment_status);
CREATE INDEX IF NOT EXISTS idx_match_fees_season_id ON match_fees(season_id);

-- ============================================
-- 3. RLS Policies for match_fees
-- ============================================
ALTER TABLE match_fees ENABLE ROW LEVEL SECURITY;

-- Players can view their own fees
CREATE POLICY "Players can view own match fees" ON match_fees
  FOR SELECT USING (auth.uid() = player_id);

-- Admins can view all fees
CREATE POLICY "Admins can view all match fees" ON match_fees
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert fees
CREATE POLICY "Admins can insert match fees" ON match_fees
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update fees
CREATE POLICY "Admins can update match fees" ON match_fees
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- System/service role can manage fees (for triggers)
CREATE POLICY "Service role can manage match fees" ON match_fees
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 4. Function to create match fees when score submitted
-- ============================================
CREATE OR REPLACE FUNCTION create_match_fees_for_result()
RETURNS TRIGGER AS $$
DECLARE
  v_fixture RECORD;
  v_match RECORD;
  v_season RECORD;
  v_fee_amount DECIMAL(10,2);
  v_player_ids UUID[];
  v_player_id UUID;
BEGIN
  -- Get the fixture details
  SELECT * INTO v_fixture
  FROM match_fixtures
  WHERE id = NEW.fixture_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get the match details
  SELECT * INTO v_match
  FROM matches
  WHERE id = v_fixture.match_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get the season to determine fee amount
  SELECT * INTO v_season
  FROM seasons
  WHERE id = v_match.season_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Determine fee based on match type
  CASE v_fixture.match_type
    WHEN 'ladder' THEN v_fee_amount := COALESCE(v_season.match_fee_ladder, 2.00);
    WHEN 'league' THEN v_fee_amount := COALESCE(v_season.match_fee_league, 2.00);
    WHEN 'singles_championship' THEN v_fee_amount := COALESCE(v_season.match_fee_singles, 2.00);
    ELSE v_fee_amount := 2.00;
  END CASE;

  -- Skip if fee is 0
  IF v_fee_amount = 0 THEN
    RETURN NEW;
  END IF;

  -- Collect all non-null player IDs from the fixture
  v_player_ids := ARRAY[]::UUID[];

  IF v_fixture.player1_id IS NOT NULL THEN
    v_player_ids := array_append(v_player_ids, v_fixture.player1_id);
  END IF;
  IF v_fixture.player2_id IS NOT NULL THEN
    v_player_ids := array_append(v_player_ids, v_fixture.player2_id);
  END IF;
  IF v_fixture.player3_id IS NOT NULL THEN
    v_player_ids := array_append(v_player_ids, v_fixture.player3_id);
  END IF;
  IF v_fixture.player4_id IS NOT NULL THEN
    v_player_ids := array_append(v_player_ids, v_fixture.player4_id);
  END IF;

  -- Create fee record for each player (if not already exists for this match day)
  FOREACH v_player_id IN ARRAY v_player_ids
  LOOP
    INSERT INTO match_fees (
      player_id,
      match_id,
      season_id,
      fee_amount,
      match_type,
      match_date,
      payment_status
    )
    VALUES (
      v_player_id,
      v_match.id,
      v_match.season_id,
      v_fee_amount,
      v_fixture.match_type,
      v_match.match_date,
      'unpaid'
    )
    ON CONFLICT (player_id, match_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_match_fees ON match_results;
CREATE TRIGGER trigger_create_match_fees
  AFTER INSERT ON match_results
  FOR EACH ROW
  EXECUTE FUNCTION create_match_fees_for_result();

-- ============================================
-- 5. Updated payment summary function
-- ============================================
-- Drop existing function first (return type is changing significantly)
DROP FUNCTION IF EXISTS get_all_players_payment_summary();

CREATE OR REPLACE FUNCTION get_all_players_payment_summary()
RETURNS TABLE (
  player_id UUID,
  player_name TEXT,
  player_email TEXT,
  -- Coaching totals
  total_sessions BIGINT,
  unpaid_sessions BIGINT,
  pending_confirmation_sessions BIGINT,
  paid_sessions BIGINT,
  -- Match fee totals by type
  ladder_matches_unpaid BIGINT,
  ladder_matches_pending BIGINT,
  ladder_matches_paid BIGINT,
  league_matches_unpaid BIGINT,
  league_matches_pending BIGINT,
  league_matches_paid BIGINT,
  singles_matches_unpaid BIGINT,
  singles_matches_pending BIGINT,
  singles_matches_paid BIGINT,
  -- Amounts
  coaching_amount_owed DECIMAL(10,2),
  coaching_amount_pending DECIMAL(10,2),
  coaching_amount_paid DECIMAL(10,2),
  ladder_amount_owed DECIMAL(10,2),
  league_amount_owed DECIMAL(10,2),
  singles_amount_owed DECIMAL(10,2),
  match_amount_pending DECIMAL(10,2),
  match_amount_paid DECIMAL(10,2),
  -- Combined totals (for backwards compatibility)
  amount_owed DECIMAL(10,2),
  amount_pending_confirmation DECIMAL(10,2),
  amount_paid DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH coaching_stats AS (
    SELECT
      ca.player_id,
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE ca.payment_status = 'unpaid') as unpaid_sessions,
      COUNT(*) FILTER (WHERE ca.payment_status = 'pending_confirmation') as pending_sessions,
      COUNT(*) FILTER (WHERE ca.payment_status = 'paid') as paid_sessions,
      COALESCE(SUM(4.00) FILTER (WHERE ca.payment_status = 'unpaid'), 0) as amount_owed,
      COALESCE(SUM(4.00) FILTER (WHERE ca.payment_status = 'pending_confirmation'), 0) as amount_pending,
      COALESCE(SUM(4.00) FILTER (WHERE ca.payment_status = 'paid'), 0) as amount_paid
    FROM coaching_attendance ca
    JOIN coaching_sessions cs ON ca.session_id = cs.id
    WHERE cs.status = 'completed'
    GROUP BY ca.player_id
  ),
  match_stats AS (
    SELECT
      mf.player_id,
      -- Ladder
      COUNT(*) FILTER (WHERE mf.match_type = 'ladder' AND mf.payment_status = 'unpaid') as ladder_unpaid,
      COUNT(*) FILTER (WHERE mf.match_type = 'ladder' AND mf.payment_status = 'pending_confirmation') as ladder_pending,
      COUNT(*) FILTER (WHERE mf.match_type = 'ladder' AND mf.payment_status = 'paid') as ladder_paid,
      -- League
      COUNT(*) FILTER (WHERE mf.match_type = 'league' AND mf.payment_status = 'unpaid') as league_unpaid,
      COUNT(*) FILTER (WHERE mf.match_type = 'league' AND mf.payment_status = 'pending_confirmation') as league_pending,
      COUNT(*) FILTER (WHERE mf.match_type = 'league' AND mf.payment_status = 'paid') as league_paid,
      -- Singles
      COUNT(*) FILTER (WHERE mf.match_type = 'singles_championship' AND mf.payment_status = 'unpaid') as singles_unpaid,
      COUNT(*) FILTER (WHERE mf.match_type = 'singles_championship' AND mf.payment_status = 'pending_confirmation') as singles_pending,
      COUNT(*) FILTER (WHERE mf.match_type = 'singles_championship' AND mf.payment_status = 'paid') as singles_paid,
      -- Amounts by type (owed)
      COALESCE(SUM(mf.fee_amount) FILTER (WHERE mf.match_type = 'ladder' AND mf.payment_status = 'unpaid'), 0) as ladder_owed,
      COALESCE(SUM(mf.fee_amount) FILTER (WHERE mf.match_type = 'league' AND mf.payment_status = 'unpaid'), 0) as league_owed,
      COALESCE(SUM(mf.fee_amount) FILTER (WHERE mf.match_type = 'singles_championship' AND mf.payment_status = 'unpaid'), 0) as singles_owed,
      -- Total match amounts
      COALESCE(SUM(mf.fee_amount) FILTER (WHERE mf.payment_status = 'pending_confirmation'), 0) as match_pending,
      COALESCE(SUM(mf.fee_amount) FILTER (WHERE mf.payment_status = 'paid'), 0) as match_paid
    FROM match_fees mf
    GROUP BY mf.player_id
  )
  SELECT
    p.id as player_id,
    p.name as player_name,
    p.email as player_email,
    -- Coaching
    COALESCE(cs.total_sessions, 0)::BIGINT,
    COALESCE(cs.unpaid_sessions, 0)::BIGINT,
    COALESCE(cs.pending_sessions, 0)::BIGINT,
    COALESCE(cs.paid_sessions, 0)::BIGINT,
    -- Match counts by type
    COALESCE(ms.ladder_unpaid, 0)::BIGINT,
    COALESCE(ms.ladder_pending, 0)::BIGINT,
    COALESCE(ms.ladder_paid, 0)::BIGINT,
    COALESCE(ms.league_unpaid, 0)::BIGINT,
    COALESCE(ms.league_pending, 0)::BIGINT,
    COALESCE(ms.league_paid, 0)::BIGINT,
    COALESCE(ms.singles_unpaid, 0)::BIGINT,
    COALESCE(ms.singles_pending, 0)::BIGINT,
    COALESCE(ms.singles_paid, 0)::BIGINT,
    -- Coaching amounts
    COALESCE(cs.amount_owed, 0)::DECIMAL(10,2) as coaching_amount_owed,
    COALESCE(cs.amount_pending, 0)::DECIMAL(10,2) as coaching_amount_pending,
    COALESCE(cs.amount_paid, 0)::DECIMAL(10,2) as coaching_amount_paid,
    -- Match amounts by type
    COALESCE(ms.ladder_owed, 0)::DECIMAL(10,2) as ladder_amount_owed,
    COALESCE(ms.league_owed, 0)::DECIMAL(10,2) as league_amount_owed,
    COALESCE(ms.singles_owed, 0)::DECIMAL(10,2) as singles_amount_owed,
    COALESCE(ms.match_pending, 0)::DECIMAL(10,2) as match_amount_pending,
    COALESCE(ms.match_paid, 0)::DECIMAL(10,2) as match_amount_paid,
    -- Combined totals
    (COALESCE(cs.amount_owed, 0) + COALESCE(ms.ladder_owed, 0) + COALESCE(ms.league_owed, 0) + COALESCE(ms.singles_owed, 0))::DECIMAL(10,2) as amount_owed,
    (COALESCE(cs.amount_pending, 0) + COALESCE(ms.match_pending, 0))::DECIMAL(10,2) as amount_pending_confirmation,
    (COALESCE(cs.amount_paid, 0) + COALESCE(ms.match_paid, 0))::DECIMAL(10,2) as amount_paid
  FROM profiles p
  LEFT JOIN coaching_stats cs ON p.id = cs.player_id
  LEFT JOIN match_stats ms ON p.id = ms.player_id
  WHERE cs.player_id IS NOT NULL OR ms.player_id IS NOT NULL
  ORDER BY
    (COALESCE(cs.amount_owed, 0) + COALESCE(ms.ladder_owed, 0) + COALESCE(ms.league_owed, 0) + COALESCE(ms.singles_owed, 0)) DESC,
    p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Update validate_payment_token to include match fees
-- ============================================
-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS validate_payment_token(UUID);

CREATE OR REPLACE FUNCTION validate_payment_token(p_token UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  player_id UUID,
  sessions_updated INT,
  match_fees_updated INT
) AS $$
DECLARE
  v_token_record RECORD;
  v_sessions_count INT := 0;
  v_match_fees_count INT := 0;
BEGIN
  -- Find the token
  SELECT * INTO v_token_record
  FROM payment_reminder_tokens
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or expired token'::TEXT, NULL::UUID, 0, 0;
    RETURN;
  END IF;

  -- Mark coaching attendance as pending_confirmation
  WITH updated_sessions AS (
    UPDATE coaching_attendance
    SET payment_status = 'pending_confirmation',
        updated_at = NOW()
    WHERE player_id = v_token_record.player_id
      AND payment_status = 'unpaid'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_sessions_count FROM updated_sessions;

  -- Mark match fees as pending_confirmation
  WITH updated_fees AS (
    UPDATE match_fees
    SET payment_status = 'pending_confirmation',
        updated_at = NOW()
    WHERE player_id = v_token_record.player_id
      AND payment_status = 'unpaid'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_match_fees_count FROM updated_fees;

  -- Mark token as used
  UPDATE payment_reminder_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;

  RETURN QUERY SELECT
    true,
    'Payment confirmed - awaiting admin verification'::TEXT,
    v_token_record.player_id,
    v_sessions_count,
    v_match_fees_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Function to get player's unpaid items (for email)
-- ============================================
CREATE OR REPLACE FUNCTION get_player_unpaid_items(p_player_id UUID)
RETURNS TABLE (
  item_type TEXT,
  item_count BIGINT,
  amount DECIMAL(10,2),
  earliest_date DATE,
  latest_date DATE
) AS $$
BEGIN
  RETURN QUERY
  -- Coaching sessions
  SELECT
    'coaching'::TEXT as item_type,
    COUNT(*)::BIGINT as item_count,
    (COUNT(*) * 4.00)::DECIMAL(10,2) as amount,
    MIN(cs.session_date)::DATE as earliest_date,
    MAX(cs.session_date)::DATE as latest_date
  FROM coaching_attendance ca
  JOIN coaching_sessions cs ON ca.session_id = cs.id
  WHERE ca.player_id = p_player_id
    AND ca.payment_status = 'unpaid'
    AND cs.status = 'completed'
  HAVING COUNT(*) > 0

  UNION ALL

  -- Ladder matches
  SELECT
    'ladder'::TEXT as item_type,
    COUNT(*)::BIGINT as item_count,
    SUM(fee_amount)::DECIMAL(10,2) as amount,
    MIN(match_date)::DATE as earliest_date,
    MAX(match_date)::DATE as latest_date
  FROM match_fees
  WHERE player_id = p_player_id
    AND payment_status = 'unpaid'
    AND match_type = 'ladder'
  HAVING COUNT(*) > 0

  UNION ALL

  -- League matches
  SELECT
    'league'::TEXT as item_type,
    COUNT(*)::BIGINT as item_count,
    SUM(fee_amount)::DECIMAL(10,2) as amount,
    MIN(match_date)::DATE as earliest_date,
    MAX(match_date)::DATE as latest_date
  FROM match_fees
  WHERE player_id = p_player_id
    AND payment_status = 'unpaid'
    AND match_type = 'league'
  HAVING COUNT(*) > 0

  UNION ALL

  -- Singles championship
  SELECT
    'singles'::TEXT as item_type,
    COUNT(*)::BIGINT as item_count,
    SUM(fee_amount)::DECIMAL(10,2) as amount,
    MIN(match_date)::DATE as earliest_date,
    MAX(match_date)::DATE as latest_date
  FROM match_fees
  WHERE player_id = p_player_id
    AND payment_status = 'unpaid'
    AND match_type = 'singles_championship'
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Admin function to confirm payments (both coaching + match fees)
-- ============================================
CREATE OR REPLACE FUNCTION confirm_player_payments(p_player_id UUID)
RETURNS TABLE (
  sessions_confirmed INT,
  match_fees_confirmed INT
) AS $$
DECLARE
  v_sessions INT := 0;
  v_fees INT := 0;
BEGIN
  -- Confirm coaching sessions
  WITH updated AS (
    UPDATE coaching_attendance
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE player_id = p_player_id
      AND payment_status = 'pending_confirmation'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_sessions FROM updated;

  -- Confirm match fees
  WITH updated AS (
    UPDATE match_fees
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE player_id = p_player_id
      AND payment_status = 'pending_confirmation'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_fees FROM updated;

  RETURN QUERY SELECT v_sessions, v_fees;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
