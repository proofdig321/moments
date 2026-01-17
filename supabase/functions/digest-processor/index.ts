import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('📰 Digest processor running...')
    console.log('Env check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey,
      hasWhatsApp: !!Deno.env.get('WHATSAPP_TOKEN')
    })
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: pending, error: queryError } = await supabase
    .from('pending_moments')
    .select('*')
    .eq('sent', false)
    .lte('scheduled_for', new Date().toISOString())
    .limit(1000)
  
  console.log('Query result:', { count: pending?.length || 0, error: queryError })
  
  if (queryError) {
    throw new Error(`Database query failed: ${queryError.message}`)
  }
  
  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const grouped: { [key: string]: any[] } = {}
  pending.forEach(item => {
    if (!grouped[item.phone_number]) grouped[item.phone_number] = []
    grouped[item.phone_number].push(item)
  })
  
  let sent = 0
  
  for (const [phone, moments] of Object.entries(grouped)) {
    // Remove + prefix if present for WhatsApp API
    const cleanPhone = phone.replace(/^\+/, '')
    console.log(`Sending digest to ${cleanPhone} with ${moments.length} moments`)
    
    const message = `📰 Your Daily Moments (${moments.length})\n\n` +
      moments.map((m, i) => `${i + 1}. ${m.moment_title}\n   ${m.moment_content.substring(0, 80)}...`).join('\n\n') +
      `\n\n🌐 moments.unamifoundation.org/moments`
    
    const success = await sendWhatsAppMessage(cleanPhone, message)
    console.log(`WhatsApp send result for ${cleanPhone}:`, success)
    
    if (success) {
      const ids = moments.map(m => m.id)
      const { error: updateError } = await supabase.from('pending_moments').update({ sent: true, sent_at: new Date().toISOString() }).in('id', ids)
      if (updateError) {
        console.error('Update error:', updateError)
      } else {
        console.log(`Marked ${ids.length} moments as sent`)
      }
      sent++
    }
  }
  
    return new Response(JSON.stringify({ processed: sent, total: pending.length }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('❌ Digest processor error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function sendWhatsAppMessage(to: string, message: string) {
  const token = Deno.env.get('WHATSAPP_TOKEN')
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID')
  
  console.log('WhatsApp credentials check:', { hasToken: !!token, hasPhoneId: !!phoneId })
  
  if (!token || !phoneId) {
    console.error('Missing WhatsApp credentials')
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
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('WhatsApp API error:', response.status, errorText)
      return false
    }
    
    console.log('WhatsApp message sent successfully')
    return true
  } catch (error) {
    console.error('WhatsApp send exception:', error)
    return false
  }
}
