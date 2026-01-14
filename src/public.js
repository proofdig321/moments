import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get published moments for public PWA
router.get('/moments', async (req, res) => {
  try {
    const { region, category, source } = req.query;
    
    let query = supabase
      .from('moments')
      .select(`
        id,
        title,
        content,
        region,
        category,
        is_sponsored,
        broadcasted_at,
        content_source,
        media_urls,
        sponsors(display_name, logo_url)
      `)
      .eq('status', 'broadcasted')
      .order('broadcasted_at', { ascending: false })
      .limit(50);

    if (region) query = query.eq('region', region);
    if (category) query = query.eq('category', category);
    if (source) query = query.eq('content_source', source);

    const { data: moments, error } = await query;
    if (error) throw error;

    // Get comments for each moment
    const momentsWithComments = await Promise.all(
      (moments || []).map(async (moment) => {
        const { data: comments } = await supabase
          .from('moment_comments')
          .select('*')
          .eq('moment_id', moment.id)
          .eq('approved', true)
          .order('created_at', { ascending: false })
          .limit(10);
        
        return {
          ...moment,
          comments: comments || []
        };
      })
    );

    res.json({ moments: momentsWithComments });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load moments' });
  }
});

// Public stats endpoint (unified with admin)
router.get('/stats', async (req, res) => {
  try {
    // Use unified analytics view
    const { data, error } = await supabase
      .from('unified_analytics')
      .select('*')
      .single();

    if (error) throw error;

    const stats = {
      totalMoments: data?.total_moments || 0,
      activeSubscribers: data?.active_subscribers || 0,
      totalBroadcasts: data?.total_broadcasts || 0,
      lastUpdated: data?.last_updated || new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Public stats error:', error);
    res.json({
      totalMoments: 0,
      activeSubscribers: 0,
      totalBroadcasts: 0,
      lastUpdated: new Date().toISOString()
    });
  }
});

// Get comments for a specific moment
router.get('/comments/:momentId', async (req, res) => {
  try {
    const { momentId } = req.params;
    
    const { data: comments, error } = await supabase
      .from('moment_comments')
      .select('*')
      .eq('moment_id', momentId)
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ comments: comments || [] });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load comments' });
  }
});

// Privacy-first analytics endpoint
router.post('/analytics', async (req, res) => {
  try {
    const { sessionId, events, sessionDuration } = req.body;
    
    // Store aggregated analytics (no personal data)
    const analyticsData = {
      session_id: sessionId,
      event_count: events.length,
      session_duration: sessionDuration,
      page_views: events.filter(e => e.type === 'page_view').length,
      user_actions: events.filter(e => e.type === 'user_action').length,
      timestamp: new Date().toISOString()
    };
    
    // Log to console for now (could store in analytics table)
    console.log('Analytics:', analyticsData);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Analytics processing failed' });
  }
});

export default router;