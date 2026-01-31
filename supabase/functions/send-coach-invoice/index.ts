// Supabase Edge Function: Send Coach Invoice
// Sends invoice emails from coach to club via Resend API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'coaching@cawoodtennisclub.co.uk' // Verified custom domain
const CLUB_EMAIL = 'cawoodtennis@gmail.com' // Club email to receive invoices

// Club details (static)
const CLUB_DETAILS = {
  name: 'Cawood tennis club',
  address_line1: 'Maypole Gardens',
  address_line2: 'Wistowgate',
  town: 'Cawood',
  postcode: 'YO8 3TG',
}

interface InvoiceRequest {
  invoice_id: string
  sessions_count: number
  rate_per_session: number
  total_amount: number
  invoice_number: number
  invoice_date: string
  coach_settings: {
    coach_name: string
    coach_address_line1: string
    coach_address_line2: string
    coach_town: string
    coach_postcode: string
    bank_account_number: string
    bank_sort_code: string
  }
  notes?: string
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

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is a coach
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'coach') {
      return new Response(JSON.stringify({ error: 'Coach access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const invoiceData: InvoiceRequest = await req.json()

    if (!invoiceData.invoice_id || !invoiceData.sessions_count || !invoiceData.total_amount) {
      return new Response(JSON.stringify({ error: 'Missing required invoice data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { coach_settings } = invoiceData

    // Format dates
    const invoiceDate = new Date(invoiceData.invoice_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })

    // Build invoice HTML matching the Excel format
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice for Tennis Coaching</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .invoice-container { border: 1px solid #ddd; padding: 30px; }
    h1 { text-decoration: underline; margin-bottom: 30px; }
    .header-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .address-block { width: 45%; }
    .address-block p { margin: 3px 0; }
    .address-label { font-weight: bold; margin-bottom: 5px; }
    .bank-details { margin: 20px 0; }
    .bank-details p { margin: 5px 0; }
    .invoice-info { display: flex; justify-content: space-between; margin: 25px 0; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px dotted #999; padding: 10px; text-align: left; }
    th { background-color: #e6f0ff; }
    .total-row { font-weight: bold; font-size: 16px; }
    .total-amount { color: #c00; }
    .footer { margin-top: 30px; font-style: italic; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <h1>Invoice for Tennis Coaching</h1>

    <div class="header-section">
      <div class="address-block">
        <p class="address-label">Address:</p>
        <p>${coach_settings.coach_name}</p>
        <p>${coach_settings.coach_address_line1}</p>
        <p>${coach_settings.coach_address_line2}</p>
        <p>${coach_settings.coach_town}</p>
        <p>${coach_settings.coach_postcode}</p>
      </div>
      <div class="address-block" style="text-align: right;">
        <p class="address-label">Contact:</p>
        <p>${CLUB_DETAILS.name}</p>
        <p>${CLUB_DETAILS.address_line1}</p>
        <p>${CLUB_DETAILS.address_line2}</p>
        <p>${CLUB_DETAILS.town}</p>
        <p>${CLUB_DETAILS.postcode}</p>
      </div>
    </div>

    <div class="bank-details">
      <p><strong>Account Number:</strong> ${coach_settings.bank_account_number}</p>
      <p><strong>Sort Code:</strong> ${coach_settings.bank_sort_code}</p>
    </div>

    <div class="invoice-info">
      <span>INVOICE No: ${String(invoiceData.invoice_number).padStart(2, '0')}</span>
      <span>DATE: ${invoiceDate}</span>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Venue</th>
          <th>SESSION</th>
          <th>Hours</th>
          <th>Hourly Rate</th>
          <th>Amount Due</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoiceDate}</td>
          <td>Cawood tennis club</td>
          <td>${invoiceData.sessions_count} session coaching</td>
          <td>${invoiceData.sessions_count}</td>
          <td>&pound;${invoiceData.rate_per_session.toFixed(0)}</td>
          <td>&pound;${invoiceData.total_amount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <table>
      <tr class="total-row">
        <td colspan="3"><strong>TOTAL AMOUNT DUE</strong></td>
        <td style="text-align: center;">${invoiceData.sessions_count} Hours</td>
        <td colspan="2" class="total-amount" style="text-align: right;"><strong>&pound;${invoiceData.total_amount.toFixed(2)}</strong></td>
      </tr>
    </table>

    <div class="footer">
      <p>Please pay within 7 days</p>
      <p>Payment by DIRECT BANK TRANSFER only into bank account detailed above</p>
    </div>

    ${invoiceData.notes ? `<p style="margin-top: 20px;"><strong>Notes:</strong> ${invoiceData.notes}</p>` : ''}
  </div>

  <p style="margin-top: 20px; font-size: 12px; color: #666;">
    This invoice was generated automatically by the Cawood Tennis Club app.
  </p>
</body>
</html>
    `.trim()

    // Send email via Resend to the club
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [CLUB_EMAIL],
        reply_to: FROM_EMAIL,
        subject: `Tennis Coaching Invoice #${String(invoiceData.invoice_number).padStart(2, '0')} - ${coach_settings.coach_name}`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${errorData}`)
    }

    const resendResult = await resendResponse.json()
    console.log('Email sent successfully:', resendResult)

    return new Response(JSON.stringify({
      success: true,
      message: 'Invoice sent successfully',
      email_id: resendResult.id,
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
