import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WhatsApp API helper function
async function sendWhatsAppMessage(to: string, message: string) {
  const token = Deno.env.get('WHATSAPP_TOKEN')
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID')
  
  if (!token || !phoneId) {
    console.error('WhatsApp credentials missing')
    return false
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    })

    if (response.ok) {
      console.log('WhatsApp message sent successfully to', to)
      return true
    } else {
      const error = await response.text()
      console.error('WhatsApp API error:', error)
      return false
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { broadcast_id, message, recipients, moment_id } = await req.json()
      
      console.log(`Starting broadcast ${broadcast_id} to ${recipients.length} recipients`)
      
      let successCount = 0
      let failureCount = 0
      
      // Update broadcast status to processing
      await supabase
        .from('broadcasts')
        .update({ status: 'processing' })
        .eq('id', broadcast_id)
      
      // Send messages with rate limiting (1 message per second to avoid WhatsApp limits)
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        
        try {
          const success = await sendWhatsAppMessage(recipient, message)
          if (success) {
            successCount++
          } else {
            failureCount++
          }
        } catch (error) {
          console.error(`Failed to send to ${recipient}:`, error)
          failureCount++
        }
        
        // Rate limiting: wait 1 second between messages
        if (i < recipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Update broadcast with final results
      await supabase
        .from('broadcasts')
        .update({
          status: 'completed',
          success_count: successCount,
          failure_count: failureCount,
          broadcast_completed_at: new Date().toISOString()
        })
        .eq('id', broadcast_id)
      
      console.log(`Broadcast ${broadcast_id} completed: ${successCount} success, ${failureCount} failed`)
      
      return new Response(JSON.stringify({ 
        success: true, 
        broadcast_id,
        success_count: successCount,
        failure_count: failureCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  } catch (error) {
    console.error('Broadcast webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})