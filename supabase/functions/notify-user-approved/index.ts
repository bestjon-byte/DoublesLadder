// Supabase Edge Function: Notify User of Account Approval
// Sends email to user when admin approves their account

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'coaching@cawoodtennisclub.co.uk'
const APP_URL = 'https://cawood-tennis.vercel.app'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApprovedUserData {
  user_id: string
  email: string
  name: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { user_id, email, name }: ApprovedUserData = await req.json()

    if (!user_id || !email || !name) {
      throw new Error('Missing required user data')
    }

    // Prepare email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved - Cawood Tennis</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #2c5282; margin-top: 0;">Cawood Tennis Club</h2>
    <h3 style="color: #1a365d; margin-bottom: 20px;">Welcome! Your Account Has Been Approved</h3>

    <p>Hi ${name},</p>

    <p>Great news! Your Cawood Tennis Club account has been approved by our administrator.</p>

    <div style="background-color: #fff; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #48bb78; font-weight: bold;">✓ Account Status: APPROVED</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0;"><strong>Approved:</strong> ${new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
    </div>

    <div style="background-color: #e6f3ff; border: 2px solid #3182ce; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h4 style="color: #1a365d; margin-top: 0;">What You Can Do Now</h4>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>View and manage the tennis ladder</li>
        <li>Schedule and play matches</li>
        <li>Book coaching sessions</li>
        <li>Track your ranking and statistics</li>
        <li>Access the club trophy cabinet</li>
      </ul>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}" style="display: inline-block; background-color: #48bb78; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Log In to Your Account
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        If you have any questions, please reply to this email or contact the club administrator.
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        We look forward to seeing you on the courts!
      </p>
    </div>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    <p>Best regards,<br>Cawood Tennis Club</p>
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
        to: [email],
        reply_to: FROM_EMAIL,
        subject: 'Your Cawood Tennis Club Account Has Been Approved!',
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      throw new Error(`Resend API error: ${errorData}`)
    }

    const responseData = await resendResponse.json()

    return new Response(JSON.stringify({
      success: true,
      message: 'User approval notification sent successfully',
      emailId: responseData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
