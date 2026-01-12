import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  if (req.method === 'POST') {
    const { campaignId } = await req.json()
    
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, campaign_budgets(*), campaign_metrics(*)')
      .eq('id', campaignId)
      .single()

    const optimizations = []
    const metrics = campaign?.campaign_metrics?.[0]
    const budget = campaign?.campaign_budgets?.[0]
    
    if (budget?.spent_amount > budget?.total_budget * 0.8) {
      optimizations.push({
        type: 'budget_alert',
        priority: 'high',
        message: 'Campaign approaching budget limit',
        action: 'Consider increasing budget or pausing'
      })
    }
    
    if (metrics?.engagement_rate < 2.0) {
      optimizations.push({
        type: 'content_optimization',
        priority: 'medium',
        message: 'Low engagement rate detected',
        action: 'A/B test different content variations'
      })
    }

    return new Response(JSON.stringify({
      campaignId,
      optimizations,
      summary: { totalRecommendations: optimizations.length }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('MCP Campaign Optimizer', { status: 200 })
})