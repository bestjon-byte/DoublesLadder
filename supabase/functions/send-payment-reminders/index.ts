// Supabase Edge Function: Send Payment Reminders
// Sends payment reminder emails via Resend API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'cawoodtennis@gmail.com'
const APP_URL = 'https://cawood-tennis.vercel.app' // Production domain

// Rate limiting: Resend allows 2 requests per second
// We'll use 600ms delay to stay safely under that limit (~1.6 emails/sec)
const EMAIL_SEND_DELAY_MS = 600

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface Payment {
  payment_id: string
  player_id: string
  player_name: string
  player_email: string
  amount_due: number
  billing_period_start: string
  billing_period_end: string
  total_sessions: number
  days_outstanding: number
  last_reminder_sent: string | null
}

interface ReminderRequest {
  filterType: 'all' | 'amount_threshold' | 'age_threshold'
  threshold?: number
  selectedPayments?: Payment[] // Optional: manually selected payments from UI
}

// CORS headers to include in all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  try {
    // Get Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify admin access
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
    const { filterType, threshold, selectedPayments }: ReminderRequest = await req.json()

    // Use selectedPayments if provided, otherwise query database
    let payments: Payment[]

    if (selectedPayments && selectedPayments.length > 0) {
      // Use manually selected payments from UI
      payments = selectedPayments
    } else {
      // Get payments matching filter criteria from database
      const { data, error: paymentsError } = await supabaseClient
        .rpc('get_payments_for_reminder', {
          p_filter_type: filterType,
          p_threshold: threshold || null,
        })

      if (paymentsError) {
        throw paymentsError
      }

      payments = data || []
    }

    if (!payments || payments.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No payments match the filter criteria',
        sent: 0,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ player: string; error: string }>,
    }

    // Send email to each player
    for (const payment of payments as Payment[]) {
      try {
        // Create payment record from unpaid sessions (if payment_id is temporary)
        let actualPaymentId = payment.payment_id

        // Create payment record from this player's unpaid sessions
        const { data: createdPaymentId, error: createError } = await supabaseClient
          .rpc('create_payment_from_unpaid_sessions', {
            p_player_id: payment.player_id,
          })

        if (createError) {
          throw new Error(`Failed to create payment record: ${createError.message}`)
        }

        if (!createdPaymentId) {
          throw new Error('No unpaid sessions found for player')
        }

        actualPaymentId = createdPaymentId

        // Generate token for this payment
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('generate_payment_reminder_token', {
            p_payment_id: actualPaymentId,
            p_player_id: payment.player_id, // Add player_id for session-based system
          })

        if (tokenError || !tokenData || tokenData.length === 0) {
          throw new Error(`Failed to generate token: ${tokenError?.message || 'Unknown error'}`)
        }

        const token = tokenData[0].token
        const confirmationUrl = `${APP_URL}/?token=${token}`
        const loginUrl = `${APP_URL}/`

        // Format dates
        const periodStart = new Date(payment.billing_period_start).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const periodEnd = new Date(payment.billing_period_end).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })

        // Prepare email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - Cawood Tennis</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #2c5282; margin-top: 0;">Cawood Tennis Club</h2>
    <h3 style="color: #1a365d; margin-bottom: 20px;">Payment Reminder - Coaching Sessions</h3>

    <p>Hi ${payment.player_name},</p>

    <p>You have an outstanding payment for coaching sessions:</p>

    <div style="background-color: #fff; border-left: 4px solid #ed8936; padding: 15px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Amount Due:</strong> £${payment.amount_due.toFixed(2)}</p>
      <p style="margin: 5px 0;"><strong>Sessions:</strong> ${payment.total_sessions}</p>
      <p style="margin: 5px 0;"><strong>Period:</strong> ${periodStart} - ${periodEnd}</p>
    </div>

    <div style="background-color: #e6f3ff; border: 2px solid #3182ce; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h4 style="color: #1a365d; margin-top: 0;">Payment Details</h4>
      <p style="margin: 8px 0;"><strong>Bank Transfer to:</strong> Cawood Tennis Club</p>
      <p style="margin: 8px 0;"><strong>Sort Code:</strong> 05-07-62</p>
      <p style="margin: 8px 0;"><strong>Account No:</strong> 25134464</p>
      <p style="margin: 8px 0;"><strong>Reference:</strong> ${payment.player_name} Coaching</p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      <p style="margin-bottom: 15px;"><strong>Once you've paid, click the button below to confirm:</strong></p>
      <a href="${confirmationUrl}"
         style="display: inline-block; background-color: #48bb78; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
        I've Made the Payment
      </a>
      <p style="margin-top: 15px; font-size: 14px; color: #666;">
        Or <a href="${loginUrl}" style="color: #3182ce;">log into the app</a> to mark your payment
      </p>
    </div>

    <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px;">
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        If you've already paid, please disregard this reminder.
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        Questions? Reply to this email.
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
            to: [payment.player_email],
            reply_to: FROM_EMAIL,
            subject: 'Cawood Tennis - Payment Reminder for Coaching Sessions',
            html: emailHtml,
          }),
        })

        if (!resendResponse.ok) {
          const errorData = await resendResponse.text()
          throw new Error(`Resend API error: ${errorData}`)
        }

        // Record reminder sent
        const filterCriteria = threshold
          ? `${filterType}:${threshold}`
          : filterType

        await supabaseClient.rpc('record_reminder_sent', {
          p_payment_id: actualPaymentId,
          p_sent_by: user.id,
          p_filter_criteria: filterCriteria,
          p_email_status: 'sent',
        })

        results.sent++

      } catch (error) {
        console.error(`Error sending to ${payment.player_name}:`, error)
        results.failed++
        results.errors.push({
          player: payment.player_name,
          error: error.message,
        })

        // Record failed reminder (only if we have a payment_id)
        try {
          const filterCriteria = threshold
            ? `${filterType}:${threshold}`
            : filterType

          // Only record if we have a valid payment ID to reference
          if (actualPaymentId && actualPaymentId !== payment.payment_id) {
            await supabaseClient.rpc('record_reminder_sent', {
              p_payment_id: actualPaymentId,
              p_sent_by: user.id,
              p_filter_criteria: filterCriteria,
              p_email_status: 'failed',
              p_error_message: error.message,
            })
          }
        } catch (recordError) {
          console.error('Failed to record error:', recordError)
        }
      }

      // Rate limiting: Add delay between email sends to respect Resend's 2 req/sec limit
      // Skip delay after the last email
      if (payments.indexOf(payment) < payments.length - 1) {
        await delay(EMAIL_SEND_DELAY_MS)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${results.sent} reminder(s), ${results.failed} failed`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
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
