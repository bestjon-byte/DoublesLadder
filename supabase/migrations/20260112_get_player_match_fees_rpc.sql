-- RPC function to get player match fees (bypasses RLS issues)
CREATE OR REPLACE FUNCTION get_player_match_fees(p_player_id UUID)
RETURNS TABLE (
  id UUID,
  player_id UUID,
  match_id UUID,
  season_id UUID,
  fee_amount DECIMAL(10,2),
  match_type TEXT,
  match_date DATE,
  payment_status TEXT,
  season_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id,
    mf.player_id,
    mf.match_id,
    mf.season_id,
    mf.fee_amount,
    mf.match_type,
    mf.match_date,
    mf.payment_status,
    s.name as season_name,
    mf.created_at,
    mf.updated_at
  FROM match_fees mf
  LEFT JOIN seasons s ON mf.season_id = s.id
  WHERE mf.player_id = p_player_id
  ORDER BY mf.match_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
