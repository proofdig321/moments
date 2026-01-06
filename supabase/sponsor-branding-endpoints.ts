    // Sponsor assets endpoint
    if (path.includes('/sponsors/') && path.includes('/assets') && method === 'GET') {
      const sponsorId = path.split('/sponsors/')[1].split('/assets')[0]
      const { data: assets } = await supabase
        .from('sponsor_assets')
        .select('*')
        .eq('sponsor_id', sponsorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      return new Response(JSON.stringify({ assets: assets || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upload sponsor asset
    if (path.includes('/sponsors/') && path.includes('/assets') && method === 'POST') {
      const sponsorId = path.split('/sponsors/')[1].split('/assets')[0]
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('sponsor_assets')
        .insert({
          sponsor_id: sponsorId,
          asset_type: body.asset_type,
          asset_url: body.asset_url,
          dimensions: body.dimensions,
          file_size: body.file_size
        })
        .select()
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify({ asset: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Enhanced sponsors with branding
    if (path.includes('/sponsors') && method === 'GET') {
      const { data: sponsors } = await supabase
        .from('sponsors')
        .select(`
          *,
          sponsor_assets(*)
        `)
        .eq('active', true)
        .order('tier DESC, name')
      
      return new Response(JSON.stringify({ sponsors: sponsors || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }