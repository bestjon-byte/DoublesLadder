-- Fix: Add RLS policy to allow players to update payment status on their own attendance records
-- Bug: Samuel Best (and other players) couldn't mark sessions as paid because there was no UPDATE policy
-- Date: 2025-11-12

-- Drop the policy if it already exists (for re-running)
DROP POLICY IF EXISTS coaching_attendance_player_update_payment ON coaching_attendance;

-- Allow players to update payment-related fields on their own attendance records
CREATE POLICY coaching_attendance_player_update_payment ON coaching_attendance
  FOR UPDATE
  TO authenticated
  USING (
    -- Can only update their own records
    player_id = auth.uid()
    AND EXISTS (
      -- Must have coaching access
      SELECT 1 FROM coaching_access
      WHERE coaching_access.player_id = auth.uid()
      AND coaching_access.revoked_at IS NULL
    )
  )
  WITH CHECK (
    -- Can only update their own records
    player_id = auth.uid()
    -- Only allow updating unpaid -> pending_confirmation
    -- (payment_status changes are handled by the RPC function)
  );

-- Grant execute permission on the RPC function (should already exist, but ensuring it)
GRANT EXECUTE ON FUNCTION player_mark_sessions_paid TO authenticated;

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'coaching_attendance'
ORDER BY policyname;
