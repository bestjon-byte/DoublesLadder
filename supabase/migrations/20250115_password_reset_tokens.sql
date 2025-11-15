-- Password Reset Tokens Table
-- Stores secure tokens for custom password reset flow via Resend

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own tokens
CREATE POLICY "Users can view own reset tokens" ON password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all tokens (for edge functions)
CREATE POLICY "Service role can manage all tokens" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Function to generate password reset token
CREATE OR REPLACE FUNCTION generate_password_reset_token(p_email TEXT)
RETURNS TABLE(token UUID, expires_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_user_id UUID;
  v_token UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- If user doesn't exist, still return success (security: don't reveal if email exists)
  -- But don't create a token
  IF v_user_id IS NULL THEN
    -- Return a fake token that won't work
    RETURN QUERY SELECT gen_random_uuid(), NOW() + INTERVAL '1 hour';
    RETURN;
  END IF;

  -- Invalidate any existing tokens for this user
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE user_id = v_user_id AND used_at IS NULL;

  -- Create new token
  v_expires_at := NOW() + INTERVAL '1 hour';

  INSERT INTO password_reset_tokens (user_id, token, email, expires_at)
  VALUES (v_user_id, gen_random_uuid(), p_email, v_expires_at)
  RETURNING password_reset_tokens.token, password_reset_tokens.expires_at INTO v_token, v_expires_at;

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use password reset token
CREATE OR REPLACE FUNCTION validate_password_reset_token(p_token UUID)
RETURNS TABLE(valid BOOLEAN, user_id UUID, email TEXT) AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- Find token
  SELECT * INTO v_token_record
  FROM password_reset_tokens
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  -- Check if token is valid
  IF v_token_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Mark token as used
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE token = p_token;

  RETURN QUERY SELECT TRUE, v_token_record.user_id, v_token_record.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days'
  RETURNING COUNT(*) INTO v_deleted_count;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update password using a validated token
-- This runs with SECURITY DEFINER to allow updating auth.users
CREATE OR REPLACE FUNCTION update_password_with_token(p_user_id UUID, p_new_password TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update the user's password in auth.users
  -- This requires SECURITY DEFINER and appropriate grants
  UPDATE auth.users
  SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Check if update was successful
  IF FOUND THEN
    v_result := json_build_object('success', true, 'message', 'Password updated successfully');
  ELSE
    v_result := json_build_object('success', false, 'message', 'User not found');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for custom email flow via Resend';
COMMENT ON FUNCTION generate_password_reset_token IS 'Creates a new password reset token for a user email';
COMMENT ON FUNCTION validate_password_reset_token IS 'Validates and marks a reset token as used';
COMMENT ON FUNCTION cleanup_expired_reset_tokens IS 'Removes expired tokens older than 7 days';
COMMENT ON FUNCTION update_password_with_token IS 'Updates user password after token validation';
