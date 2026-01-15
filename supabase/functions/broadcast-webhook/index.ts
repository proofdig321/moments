import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

// WhatsApp API helper function with retry logic
async function sendWhatsAppMessage(to: string, message: string, attempt = 1): Promise<boolean> {
  const token = Deno.env.get('WHATSAPP_TOKEN')
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID')
  const maxRetries = 3

  if (!token || !phoneId) {
    console.error('❌ WhatsApp credentials missing')
    return false
  }

  // Normalize phone number
  const normalizedPhone = to.replace(/\D/g, '')
  const fullPhone = normalizedPhone.startsWith('1') ? normalizedPhone : normalizedPhone

  try {
    console.log(`📱 WhatsApp send attempt ${attempt}/${maxRetries} to ${normalizedPhone}`)
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: message }
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ WhatsApp message sent to ${normalizedPhone}: ${result.messages?.[0]?.id || 'unknown'}`)
      return true
    } else {
      const error = await response.text()
      console.error(`⚠️ WhatsApp API error (${response.status}): ${error}`)

      // Retry on server errors
      if (response.status >= 500 && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        return sendWhatsAppMessage(to, message, attempt + 1)
      }
      return false
    }
  } catch (error) {
    console.error(`❌ WhatsApp send exception (attempt ${attempt}): ${error.message}`)

    // Retry on network errors
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      return sendWhatsAppMessage(to, message, attempt + 1)
    }
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      console.warn(`⚠️ Invalid method: ${req.method}`)
      return new Response(JSON.stringify({ error: 'Only POST method allowed' }), {
        status: 405,
        headers: corsHeaders
      })
    }

    // Parse and validate request
    let requestData
    try {
      const text = await req.text()
      requestData = JSON.parse(text)
    } catch (parseError) {
      console.error(`❌ JSON parse error: ${parseError.message}`)
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    const { broadcast_id, message, recipients, moment_id } = requestData

    // Validate required fields
    if (!broadcast_id || !message || !Array.isArray(recipients) || recipients.length === 0) {
      console.error(`❌ Missing required fields: broadcast_id=${!!broadcast_id}, message=${!!message}, recipients=${Array.isArray(recipients) ? recipients.length : 0}`)
      return new Response(JSON.stringify({
        error: 'Missing required fields: broadcast_id, message, recipients (non-empty array)'
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    console.log(`📢 Starting broadcast ${broadcast_id}`)
    console.log(`   - Message length: ${message.length} chars`)
    console.log(`   - Recipients: ${recipients.length}`)
    console.log(`   - Moment ID: ${moment_id || 'N/A'}`)

    let successCount = 0
    let failureCount = 0
    const failedRecipients = []

    // Update broadcast status to processing
    const { error: updateError } = await supabase
      .from('broadcasts')
      .update({
        status: 'processing',
        broadcast_started_at: new Date().toISOString()
      })
      .eq('id', broadcast_id)

    if (updateError) {
      console.error(`❌ Failed to update broadcast status: ${updateError.message}`)
    }

    // Send messages with rate limiting
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]

      try {
        const success = await sendWhatsAppMessage(recipient, message)
        if (success) {
          successCount++
        } else {
          failureCount++
          failedRecipients.push(recipient)
        }
      } catch (error) {
        console.error(`❌ Exception sending to ${recipient}: ${error.message}`)
        failureCount++
        failedRecipients.push(recipient)
      }

      // Rate limiting: 1 message per second to respect WhatsApp limits
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const duration = Date.now() - startTime

    // Update broadcast with final results
    const { error: finalError } = await supabase
      .from('broadcasts')
      .update({
        status: 'completed',
        success_count: successCount,
        failure_count: failureCount,
        broadcast_completed_at: new Date().toISOString()
      })
      .eq('id', broadcast_id)

    if (finalError) {
      console.error(`❌ Failed to finalize broadcast: ${finalError.message}`)
    }

    console.log(`✅ Broadcast ${broadcast_id} completed in ${duration}ms`)
    console.log(`   - Success: ${successCount}/${recipients.length}`)
    console.log(`   - Failed: ${failureCount}/${recipients.length}`)
    if (failedRecipients.length > 0 && failedRecipients.length <= 10) {
      console.log(`   - Failed recipients: ${failedRecipients.join(', ')}`)
    }

    return new Response(JSON.stringify({
      success: true,
      broadcast_id,
      success_count: successCount,
      failure_count: failureCount,
      total_recipients: recipients.length,
      duration_ms: duration,
      message: `Broadcast completed: ${successCount} sent, ${failureCount} failed`
    }), {
      status: 200,
      headers: corsHeaders
    })

  } catch (error) {
    console.error(`❌ Broadcast webhook fatal error: ${error.message}`)
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    })
  }
})