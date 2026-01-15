import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('🚀 broadcast-webhook function initializing...')

// Validate environment variables at startup
const requiredEnvVars = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

// Create Supabase client once
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Validation helpers
function isValidPhoneNumber(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '')
  return normalized.length >= 10 && normalized.length <= 15
}

function isValidMessage(message: string): boolean {
  return message.length > 0 && message.length <= 4096
}

// Batch processing function
async function processBatchedBroadcast(broadcastId: string, message: string, recipients: string[], momentId?: string) {
  const BATCH_SIZE = 50
  const batches = []
  
  // Create batch records
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batchRecipients = recipients.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    
    const { data: batch, error } = await supabase
      .from('broadcast_batches')
      .insert({
        broadcast_id: broadcastId,
        batch_number: batchNumber,
        recipients: batchRecipients,
        status: 'pending'
      })
      .select()
      .single()
    
    if (!error && batch) {
      batches.push(batch)
    }
  }
  
  console.log(`✅ Created ${batches.length} batches for broadcast ${broadcastId}`)
  
  // Update broadcast status
  await supabase
    .from('broadcasts')
    .update({
      status: 'processing',
      broadcast_started_at: new Date().toISOString()
    })
    .eq('id', broadcastId)
  
  // Process batches sequentially for now (parallel processing in next step)
  let totalSuccess = 0
  let totalFailure = 0
  
  for (const batch of batches) {
    const result = await processBatch(batch, message)
    totalSuccess += result.success
    totalFailure += result.failure
  }
  
  // Update final broadcast results
  await supabase
    .from('broadcasts')
    .update({
      status: 'completed',
      success_count: totalSuccess,
      failure_count: totalFailure,
      broadcast_completed_at: new Date().toISOString()
    })
    .eq('id', broadcastId)
  
  return new Response(JSON.stringify({
    success: true,
    broadcast_id: broadcastId,
    batches_created: batches.length,
    success_count: totalSuccess,
    failure_count: totalFailure,
    total_recipients: recipients.length,
    message: `Batch broadcast completed: ${batches.length} batches, ${totalSuccess} sent, ${totalFailure} failed`
  }), {
    status: 200,
    headers: corsHeaders
  })
}

// Process single batch
async function processBatch(batch: any, message: string) {
  console.log(`📦 Processing batch ${batch.batch_number} with ${batch.recipients.length} recipients`)
  
  // Update batch status
  await supabase
    .from('broadcast_batches')
    .update({
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', batch.id)
  
  let successCount = 0
  let failureCount = 0
  
  // Send messages with faster rate (200ms delay instead of 1000ms)
  for (let i = 0; i < batch.recipients.length; i++) {
    const recipient = batch.recipients[i]
    
    try {
      const success = await sendWhatsAppMessage(recipient, message)
      if (success) {
        successCount++
      } else {
        failureCount++
      }
    } catch (error) {
      console.error(`❌ Batch ${batch.batch_number} - Failed to send to ${recipient}: ${error.message}`)
      failureCount++
    }
    
    // Faster rate limiting for batches: 5 messages per second
    if (i < batch.recipients.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  // Update batch results
  await supabase
    .from('broadcast_batches')
    .update({
      status: 'completed',
      success_count: successCount,
      failure_count: failureCount,
      completed_at: new Date().toISOString()
    })
    .eq('id', batch.id)
  
  console.log(`✅ Batch ${batch.batch_number} completed: ${successCount} success, ${failureCount} failed`)
  
  return { success: successCount, failure: failureCount }
}

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

  // Normalize phone number for South Africa (+27)
  let normalizedPhone = to.replace(/\D/g, '')
  if (normalizedPhone.startsWith('27')) {
    // Already has country code
  } else if (normalizedPhone.startsWith('0')) {
    // Remove leading 0 and add 27
    normalizedPhone = '27' + normalizedPhone.substring(1)
  } else if (normalizedPhone.length === 9) {
    // Add country code
    normalizedPhone = '27' + normalizedPhone
  }

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

      // Retry on server errors with exponential backoff
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return sendWhatsAppMessage(to, message, attempt + 1)
      }
      return false
    }
  } catch (error) {
    console.error(`❌ WhatsApp send exception (attempt ${attempt}): ${error.message}`)

    // Retry on network errors with exponential backoff
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return sendWhatsAppMessage(to, message, attempt + 1)
    }
    return false
  }
}

serve(async (req) => {
  console.log(`📨 Request received: ${req.method} ${new URL(req.url).pathname}`)
  
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight OK')
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
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

    // Validate message content
    if (!isValidMessage(message)) {
      return new Response(JSON.stringify({
        error: 'Message must be 1-4096 characters'
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Validate phone numbers
    const invalidNumbers = recipients.filter(phone => !isValidPhoneNumber(phone))
    if (invalidNumbers.length > 0) {
      return new Response(JSON.stringify({
        error: `Invalid phone numbers: ${invalidNumbers.slice(0, 5).join(', ')}${invalidNumbers.length > 5 ? '...' : ''}`
      }), {
        status: 400,
        headers: corsHeaders
      })
    }

    console.log(`📢 Starting broadcast ${broadcast_id}`)
    console.log(`   - Message length: ${message.length} chars`)
    console.log(`   - Recipients: ${recipients.length}`)
    console.log(`   - Moment ID: ${moment_id || 'N/A'}`)

    // Batch processing for large broadcasts (>50 recipients)
    const BATCH_SIZE = 50
    const USE_BATCHING = recipients.length > BATCH_SIZE

    if (USE_BATCHING) {
      console.log(`📦 Using batch processing: ${Math.ceil(recipients.length / BATCH_SIZE)} batches`)
      try {
        return await processBatchedBroadcast(broadcast_id, message, recipients, moment_id)
      } catch (batchError) {
        console.warn(`⚠️ Batch processing failed, falling back to sequential: ${batchError.message}`)
        // Fall through to sequential processing
      }
    }

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
    if (failedRecipients.length > 0) {
      if (failedRecipients.length <= 10) {
        console.log(`   - Failed recipients: ${failedRecipients.join(', ')}`)
      } else {
        console.log(`   - Failed recipients (first 10): ${failedRecipients.slice(0, 10).join(', ')}`)
        console.log(`   - Total failed: ${failedRecipients.length}`)
      }
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