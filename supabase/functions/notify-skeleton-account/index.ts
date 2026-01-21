// Supabase Edge Function: Notify Admin of New Skeleton Account
// Sends email notification when a coach registers a new person at a session

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

interface NotificationRequest {
  profile_id: string
  name: string
  session_id: string
  session_type: string
  session_date: string
  created_by_name: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { profile_id, name, session_id, session_type, session_date, created_by_name }: NotificationRequest = await req.json()

    if (!profile_id || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get admin users to send notification
    const { data: admins, error: adminError } = await supabaseClient
      .from('profiles')
      .select('email, name')
      .eq('role', 'admin')
      .not('email', 'is', null)

    if (adminError) {
      console.error('Error fetching admins:', adminError)
      return new Response(JSON.stringify({ error: 'Failed to fetch admin emails' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!admins || admins.length === 0) {
      console.log('No admin emails found')
      return new Response(JSON.stringify({ success: true, message: 'No admins to notify' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Format date
    const formattedDate = session_date
      ? new Date(session_date).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : 'Unknown date'

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Attendee Registered - Cawood Tennis</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fff7ed; border-radius: 10px; padding: 30px; margin-bottom: 20px; border: 2px solid #fb923c;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #fb923c; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
        New Attendee
      </div>
    </div>

    <h2 style="color: #9a3412; margin-top: 0; text-align: center;">New Person Registered at Coaching</h2>

    <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fed7aa;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Name:</td>
          <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #1f2937;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Session:</td>
          <td style="padding: 8px 0; color: #1f2937;">${session_type || 'Coaching'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0; color: #1f2937;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666; font-weight: bold;">Added by:</td>
          <td style="padding: 8px 0; color: #1f2937;">${created_by_name || 'Coach'}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #fcd34d;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Action Required:</strong> Please complete this person's profile with their contact details so they can be properly registered for future sessions.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}?tab=coaching&admin=true"
         style="display: inline-block; background-color: #fb923c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Complete Profile in App
      </a>
    </div>

    <p style="text-align: center; font-size: 14px; color: #666; margin-top: 20px;">
      You'll find them in the "New Attendees to Register" section of Coaching Management.
    </p>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    <p>Cawood Tennis Club<br>Automated Notification</p>
  </div>
</body>
</html>
    `.trim()

    // Send email to all admins
    const adminEmails = admins.map(a => a.email).filter(Boolean)

    if (adminEmails.length > 0 && RESEND_API_KEY) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: adminEmails,
          subject: `New Attendee: ${name} registered at coaching`,
          html: emailHtml,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.text()
        console.error('Resend API error:', errorData)
        // Don't fail the whole request if email fails
      } else {
        console.log(`Email sent to ${adminEmails.length} admin(s)`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Notification sent to ${adminEmails.length} admin(s)`,
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
