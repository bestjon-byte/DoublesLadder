// Supabase Edge Function: Send Password Reset Email
// Sends branded password reset emails via Resend API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'coaching@cawoodtennisclub.co.uk' // Verified custom domain
const APP_URL = 'https://cawood-tennis.vercel.app' // Production domain

// CORS headers to include in all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetRequest {
  email: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  try {
    // Get Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse request body
    const { email }: ResetRequest = await req.json()

    if (!email || !email.trim()) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Generate password reset token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .rpc('generate_password_reset_token', {
        p_email: normalizedEmail,
      })

    if (tokenError || !tokenData || tokenData.length === 0) {
      console.error('Token generation error:', tokenError)
      // Still return success to not reveal if email exists
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = tokenData[0].token
    const expiresAt = tokenData[0].expires_at

    // Check if user actually exists (for logging purposes only)
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('email', normalizedEmail)
      .single()

    // Only send email if user exists
    if (userData) {
      const resetUrl = `${APP_URL}/reset-password?token=${token}`

      // Calculate expiry time for display
      const expiryDate = new Date(expiresAt)
      const now = new Date()
      const minutesUntilExpiry = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60))

      // Prepare email HTML
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Cawood Tennis</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #2c5282; margin-top: 0;">Cawood Tennis Club</h2>
    <h3 style="color: #1a365d; margin-bottom: 20px;">Password Reset Request</h3>

    <p>Hi ${userData.name || 'there'},</p>

    <p>We received a request to reset your password for your Cawood Tennis Club account.</p>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>⏱️ This link expires in ${minutesUntilExpiry} minutes</strong></p>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">For your security, password reset links are only valid for 1 hour.</p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      <p style="margin-bottom: 15px;"><strong>Click the button below to reset your password:</strong></p>
      <a href="${resetUrl}"
         style="display: inline-block; background-color: #5D1F1F; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Reset My Password
      </a>
    </div>

    <div style="background-color: #e7f3ff; border: 1px solid #3182ce; border-radius: 8px; padding: 15px; margin: 25px 0;">
      <p style="margin: 5px 0; font-size: 14px;"><strong>🔗 Or copy this link:</strong></p>
      <p style="margin: 5px 0; font-size: 13px; word-break: break-all; color: #3182ce;">
        ${resetUrl}
      </p>
    </div>

    <div style="border-top: 2px solid #dc3545; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #dc3545; margin: 5px 0;">
        <strong>⚠️ Security Notice:</strong>
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        Never share this link with anyone. Cawood Tennis Club will never ask you for your password.
      </p>
    </div>

    <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        Questions or concerns? Reply to this email and we'll be happy to help.
      </p>
    </div>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    <p>Best regards,<br>Cawood Tennis Club</p>
    <p style="margin-top: 10px;">This is an automated email. Please do not reply to this message.</p>
  </div>
</body>
</html>
      `.trim()

      // Send email via Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [normalizedEmail],
          reply_to: FROM_EMAIL,
          subject: 'Password Reset Request - Cawood Tennis Club',
          html: emailHtml,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text()
        console.error('Resend API error:', errorData)
        throw new Error(`Resend API error: ${errorData}`)
      }

      const resendData = await resendResponse.json()
      console.log('Password reset email sent:', resendData.id)
    } else {
      console.log('No user found for email:', normalizedEmail, '(not sending email)')
    }

    // Always return success to not reveal if email exists
    return new Response(JSON.stringify({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function error:', error)

    // Return generic success message to not reveal system errors
    return new Response(JSON.stringify({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
