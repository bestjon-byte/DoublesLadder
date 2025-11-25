// Supabase Edge Function: Notify Player of Payment Confirmation
// Sends thank you email to player when admin confirms their coaching payment

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

interface PaymentConfirmedData {
  player_id: string
  email: string
  name: string
  amount: number
  sessions_count: number
  reference?: string
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
    const { player_id, email, name, amount, sessions_count, reference }: PaymentConfirmedData = await req.json()

    if (!player_id || !email || !name || amount === undefined || sessions_count === undefined) {
      throw new Error('Missing required payment confirmation data')
    }

    // Prepare email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed - Cawood Tennis</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #2c5282; margin-top: 0;">Cawood Tennis Club</h2>
    <h3 style="color: #1a365d; margin-bottom: 20px;">Payment Confirmed - Thank You!</h3>

    <p>Hi ${name},</p>

    <p>Thank you for your payment! We're pleased to confirm that your coaching session payment has been received and processed.</p>

    <div style="background-color: #fff; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #48bb78; font-weight: bold;">✓ Payment Status: CONFIRMED</p>
      <p style="margin: 5px 0;"><strong>Amount Received:</strong> £${amount.toFixed(2)}</p>
      <p style="margin: 5px 0;"><strong>Sessions Paid:</strong> ${sessions_count}</p>
      ${reference ? `<p style="margin: 5px 0;"><strong>Reference:</strong> ${reference}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Confirmed:</strong> ${new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
    </div>

    <div style="background-color: #e6f3ff; border: 2px solid #3182ce; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h4 style="color: #1a365d; margin-top: 0;">Thank You for Your Support</h4>
      <p style="margin: 8px 0;">Your payment helps us continue to provide quality coaching sessions and maintain excellent facilities for all our members.</p>
      <p style="margin: 8px 0;">We really appreciate your prompt payment and continued support of Cawood Tennis Club.</p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${APP_URL}" style="display: inline-block; background-color: #48bb78; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        View Your Account
      </a>
    </div>

    <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        You can view your full payment history and upcoming sessions by logging into the app.
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        If you have any questions about this payment, please reply to this email or contact the club administrator.
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        We look forward to seeing you on the courts!
      </p>
    </div>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    <p>Best regards,<br>Cawood Tennis Club</p>
    <p style="margin-top: 10px; font-size: 11px;">Thank you for being a valued member of our tennis community!</p>
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
        subject: 'Payment Confirmed - Thank You! - Cawood Tennis Club',
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
      message: 'Payment confirmation email sent successfully',
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
