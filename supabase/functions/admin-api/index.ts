import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Analytics endpoint
    if (path.includes('/analytics') && method === 'GET') {
      const [moments, subscribers, broadcasts] = await Promise.all([
        supabase.from('moments').select('*', { count: 'exact' }),
        supabase.from('subscriptions').select('*', { count: 'exact' }).eq('opted_in', true),
        supabase.from('broadcasts').select('*', { count: 'exact' })
      ])

      return new Response(JSON.stringify({
        totalMoments: moments.count || 0,
        activeSubscribers: subscribers.count || 0,
        totalBroadcasts: broadcasts.count || 0,
        successRate: 95
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Moments endpoint
    if (path.includes('/moments') && method === 'GET') {
      const { data: moments } = await supabase
        .from('moments')
        .select('*, sponsors(*)')
        .order('created_at', { ascending: false })
        .limit(50)
      
      return new Response(JSON.stringify({ moments: moments || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create moment
    if (path.includes('/moments') && method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase
        .from('moments')
        .insert(body)
        .select()
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify({ moment: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Sponsors endpoint
    if (path.includes('/sponsors') && method === 'GET') {
      const { data: sponsors } = await supabase
        .from('sponsors')
        .select('*')
        .eq('active', true)
        .order('name')
      
      return new Response(JSON.stringify({ sponsors: sponsors || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create sponsor
    if (path.includes('/sponsors') && method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase
        .from('sponsors')
        .insert(body)
        .select()
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify({ sponsor: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Settings endpoint
    if (path.includes('/settings') && method === 'GET') {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key')
      
      return new Response(JSON.stringify({ settings: settings || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Campaigns endpoint
    if (path.includes('/campaigns') && method === 'GET') {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      return new Response(JSON.stringify({ campaigns: campaigns || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Broadcasts endpoint
    if (path.includes('/broadcasts') && method === 'GET') {
      const { data: broadcasts } = await supabase
        .from('broadcasts')
        .select('*, moments(title, region, category)')
        .order('broadcast_started_at', { ascending: false })
        .limit(50)
      
      return new Response(JSON.stringify({ broadcasts: broadcasts || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Subscribers endpoint
    if (path.includes('/subscribers') && method === 'GET') {
      const { data: subscribers } = await supabase
        .from('subscriptions')
        .select('*')
        .order('last_activity', { ascending: false })
      
      return new Response(JSON.stringify({ subscribers: subscribers || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Moderation endpoint
    if (path.includes('/moderation') && method === 'GET') {
      const { data: messages } = await supabase
        .from('messages')
        .select('*, advisories(*), flags(*)')
        .eq('processed', true)
        .order('created_at', { ascending: false })
        .limit(50)
      
      return new Response(JSON.stringify({ flaggedMessages: messages || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Default response
    return new Response(JSON.stringify({ 
      message: 'Admin API',
      path: path,
      method: method,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      path: new URL(req.url).pathname
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})