// Supabase Edge Function: Notify Admin of New User Signup
// Sends email to admin when a new user registers

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'coaching@cawoodtennisclub.co.uk'
const ADMIN_EMAIL = 'cawoodtennis@gmail.com' // Primary admin email
const APP_URL = 'https://cawood-tennis.vercel.app'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewUserData {
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
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse request body
    const { user_id, email, name }: NewUserData = await req.json()

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
  <title>New User Registration - Cawood Tennis</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #2c5282; margin-top: 0;">Cawood Tennis Club</h2>
    <h3 style="color: #1a365d; margin-bottom: 20px;">New User Registration</h3>

    <p>A new user has registered for Cawood Tennis Club:</p>

    <div style="background-color: #fff; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0;"><strong>Registration Time:</strong> ${new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
    </div>

    <div style="background-color: #e6f3ff; border: 2px solid #3182ce; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h4 style="color: #1a365d; margin-top: 0;">Action Required</h4>
      <p style="margin: 8px 0;">This user account requires approval before they can access the system.</p>
      <p style="margin: 8px 0;">Please review and approve this user through the admin panel.</p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}/admin" style="display: inline-block; background-color: #3182ce; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        Go to Admin Panel
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        This is an automated notification from the Cawood Tennis Club management system.
      </p>
    </div>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    <p>Cawood Tennis Club Management System</p>
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
        to: [ADMIN_EMAIL],
        reply_to: email, // Allow admin to reply directly to user
        subject: `New User Registration: ${name}`,
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
      message: 'Admin notification sent successfully',
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
