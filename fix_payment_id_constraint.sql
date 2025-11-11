-- ============================================
-- FIX: Remove foreign key constraint on payment_id
-- The session-based system doesn't use coaching_payments table
-- ============================================

-- Step 1: Drop the foreign key constraint
ALTER TABLE payment_reminder_tokens
DROP CONSTRAINT IF EXISTS payment_reminder_tokens_payment_id_fkey;

-- Step 2: Make payment_id nullable (it's not needed for session-based tracking)
ALTER TABLE payment_reminder_tokens
ALTER COLUMN payment_id DROP NOT NULL;

-- Step 3: Update the comment
COMMENT ON COLUMN payment_reminder_tokens.payment_id IS 'Legacy payment ID (nullable for session-based system)';
COMMENT ON COLUMN payment_reminder_tokens.player_id IS 'Player ID - primary identifier for session-based payments';

-- Verify the change
SELECT
    '✅ Foreign key constraint removed - tokens can now be created!' as status;

-- Show current table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payment_reminder_tokens'
ORDER BY ordinal_position;
