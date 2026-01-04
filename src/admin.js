import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireRole } from './auth.js';
import { broadcastMoment, scheduleNextBroadcasts } from './broadcast.js';

const router = express.Router();

// Protect all admin routes: require at least moderator role
router.use(requireRole(['moderator', 'content_admin', 'superadmin']));

// Simple sanitizers
const sanitizeString = (s, max=2000) => {
  if (s === null || s === undefined) return s;
  let t = String(s).trim();
  if (t.length > max) t = t.slice(0, max);
  return t;
};

const sanitizeArrayOfStrings = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(a => sanitizeString(a, 500)).filter(Boolean);
};

// Get all moments with pagination and filters
router.get('/moments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, region, category } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('moments')
      .select(`
        *,
        sponsors(display_name),
        broadcasts(recipient_count, success_count, failure_count, status)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (region) query = query.eq('region', region);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ moments: data || [], page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new moment
router.post('/moments', async (req, res) => {
  try {
    const {
      title,
      content,
      region,
      category,
      language = 'eng',
      sponsor_id,
      is_sponsored = false,
      pwa_link,
      media_urls = [],
      scheduled_at,
      created_by = 'admin'
    } = req.body;

    if (!title || !content || !region || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const status = scheduled_at ? 'scheduled' : 'draft';
    // Normalize media_urls: accept comma-separated string or array
    let normalizedMedia = [];
    if (Array.isArray(media_urls)) {
      normalizedMedia = media_urls.map(u => (u || '').toString().trim()).filter(Boolean);
    } else if (typeof media_urls === 'string') {
      normalizedMedia = media_urls.split(',').map(u => u.trim()).filter(Boolean);
    }

    const { data, error } = await supabase
      .from('moments')
      .insert({
        title,
        content,
        region,
        category,
        language,
        sponsor_id,
        is_sponsored,
        pwa_link,
        media_urls: normalizedMedia,
        scheduled_at,
        status,
        created_by
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ moment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update moment
router.put('/moments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating broadcasted moments
    const { data: existing } = await supabase
      .from('moments')
      .select('status')
      .eq('id', id)
      .single();

    if (existing?.status === 'broadcasted') {
      return res.status(400).json({ error: 'Cannot update broadcasted moments' });
    }

    const { data, error } = await supabase
      .from('moments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ moment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete moment
router.delete('/moments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('moments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Broadcast moment immediately
router.post('/moments/:id/broadcast', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await broadcastMoment(id);

    res.json({
      success: true,
      broadcast: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sponsors
router.get('/sponsors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;

    res.json({ sponsors: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sponsor
router.post('/sponsors', async (req, res) => {
  try {
    const { name, display_name, contact_email } = req.body;

    if (!name || !display_name) {
      return res.status(400).json({ error: 'Name and display name required' });
    }

    const { data, error } = await supabase
      .from('sponsors')
      .insert({ name, display_name, contact_email })
      .select()
      .single();

    if (error) throw error;

    res.json({ sponsor: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get broadcast analytics
router.get('/analytics', async (req, res) => {
  try {
    const { data: moments } = await supabase
      .from('moments')
      .select('status')
      .not('status', 'eq', 'draft');

    const { data: broadcasts } = await supabase
      .from('broadcasts')
      .select('recipient_count, success_count, failure_count');

    const { data: subscribers } = await supabase
      .from('subscriptions')
      .select('opted_in');

    const totalMoments = moments?.length || 0;
    const totalBroadcasts = broadcasts?.length || 0;
    const totalRecipients = broadcasts?.reduce((sum, b) => sum + (b.recipient_count || 0), 0) || 0;
    const totalSuccess = broadcasts?.reduce((sum, b) => sum + (b.success_count || 0), 0) || 0;
    const activeSubscribers = subscribers?.filter(s => s.opted_in).length || 0;

    res.json({
      totalMoments,
      totalBroadcasts,
      totalRecipients,
      totalSuccess,
      activeSubscribers,
      successRate: totalRecipients > 0 ? (totalSuccess / totalRecipients * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get flagged content for moderation
router.get('/moderation', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    
    let query = supabase
      .from('messages')
      .select(`
        *,
        advisories(*),
        flags(*)
      `)
      .eq('processed', true)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (error) throw error;

    // Filter messages based on criteria
    let flaggedMessages = data || [];
    
    if (filter === 'flagged') {
      flaggedMessages = flaggedMessages.filter(msg => 
        msg.advisories?.some(adv => adv.confidence > 0.7) || msg.flags?.length > 0
      );
    } else if (filter === 'escalated') {
      flaggedMessages = flaggedMessages.filter(msg => 
        msg.advisories?.some(adv => adv.escalation_suggested)
      );
    }

    res.json({ flaggedMessages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sponsor
router.put('/sponsors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('sponsors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ sponsor: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete sponsor
router.delete('/sponsors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get broadcasts
router.get('/broadcasts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select(`
        *,
        moments(title, region, category)
      `)
      .order('broadcast_started_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ broadcasts: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscribers
router.get('/subscribers', async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    
    let query = supabase
      .from('subscriptions')
      .select('*')
      .order('last_activity', { ascending: false });

    if (filter === 'active') query = query.eq('opted_in', true);
    if (filter === 'inactive') query = query.eq('opted_in', false);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ subscribers: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;
    res.json({ settings: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update system setting
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data, error } = await supabase
      .from('system_settings')
      .update({ 
        setting_value: value, 
        updated_by: 'admin', 
        updated_at: new Date().toISOString() 
      })
      .eq('setting_key', key)
      .select()
      .single();

    if (error) throw error;
    res.json({ setting: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process scheduled broadcasts (called by cron or manually)
router.post('/process-scheduled', async (req, res) => {
  try {
    await scheduleNextBroadcasts();
    res.json({ success: true, message: 'Scheduled broadcasts processed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Campaign management ---
// List campaigns with filters
router.get('/campaigns', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sponsor_id } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (sponsor_id) query = query.eq('sponsor_id', sponsor_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ campaigns: data || [], page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create campaign (content_admin+)
router.post('/campaigns', requireRole(['content_admin','superadmin']), async (req, res) => {
  try {
    const {
      title,
      content,
      sponsor_id,
      budget = 0,
      target_regions = [],
      target_categories = [],
      media_urls = [],
      scheduled_at
    } = req.body;

    // sanitize inputs
    const cleanTitle = sanitizeString(title, 250);
    const cleanContent = sanitizeString(content, 5000);
    const cleanSponsor = sponsor_id ? sanitizeString(sponsor_id, 100) : null;
    const cleanBudget = Number(budget) || 0;
    const cleanRegions = sanitizeArrayOfStrings(target_regions);
    const cleanCategories = sanitizeArrayOfStrings(target_categories);
    const cleanMedia = sanitizeArrayOfStrings(media_urls);
    const cleanScheduled = scheduled_at ? sanitizeString(scheduled_at, 64) : null;

    if (!cleanTitle || !cleanContent) return res.status(400).json({ error: 'title and content required' });

    const created_by = req.user?.id || null;

    const { data, error } = await supabase
      .from('campaigns')
      .insert({ title: cleanTitle, content: cleanContent, sponsor_id: cleanSponsor, budget: cleanBudget, target_regions: cleanRegions, target_categories: cleanCategories, media_urls: cleanMedia, scheduled_at: cleanScheduled, created_by, status: cleanScheduled ? 'scheduled' : 'pending_review' })
      .select()
      .single();

    if (error) throw error;
    res.json({ campaign: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign (content_admin+)
router.put('/campaigns/:id', requireRole(['content_admin','superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const raw = req.body;
    const updates = {};
    if (raw.title) updates.title = sanitizeString(raw.title, 250);
    if (raw.content) updates.content = sanitizeString(raw.content, 5000);
    if (raw.sponsor_id) updates.sponsor_id = sanitizeString(raw.sponsor_id, 100);
    if (raw.budget) updates.budget = Number(raw.budget) || 0;
    if (raw.target_regions) updates.target_regions = sanitizeArrayOfStrings(raw.target_regions);
    if (raw.target_categories) updates.target_categories = sanitizeArrayOfStrings(raw.target_categories);
    if (raw.media_urls) updates.media_urls = sanitizeArrayOfStrings(raw.media_urls);
    if (raw.scheduled_at) updates.scheduled_at = sanitizeString(raw.scheduled_at, 64);

    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ campaign: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve campaign (superadmin only)
router.post('/campaigns/:id/approve', requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ campaign: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish campaign => create moment and optionally broadcast (superadmin only)
router.post('/campaigns/:id/publish', requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    // Get campaign
    const { data: campaign, error: getErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (getErr || !campaign) throw new Error('Campaign not found');

    // Create a moment from campaign
    const momentRecord = {
      title: campaign.title,
      content: campaign.content,
      region: campaign.target_regions && campaign.target_regions.length ? campaign.target_regions[0] : 'National',
      category: campaign.target_categories && campaign.target_categories.length ? campaign.target_categories[0] : 'Sponsored',
      language: 'eng',
      sponsor_id: campaign.sponsor_id,
      is_sponsored: true,
      media_urls: campaign.media_urls,
      pwa_link: null,
      scheduled_at: null,
      status: 'broadcasted',
      created_by: campaign.created_by
    };

    const { data: moment, error: insertErr } = await supabase
      .from('moments')
      .insert(momentRecord)
      .select()
      .single();
    if (insertErr) throw insertErr;

    // Mark campaign as published
    await supabase.from('campaigns').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id);

    // Trigger broadcast asynchronously
    try {
      // lazy import to avoid cycles
      const { broadcastMoment } = await import('./broadcast.js');
      broadcastMoment(moment.id).catch(err => console.error('Campaign broadcast error:', err.message));
    } catch (err) {
      console.error('Failed to trigger broadcast:', err.message);
    }

    res.json({ success: true, moment_id: moment.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Admin role management (superadmin only) ---
// List all role mappings
router.get('/roles', requireRole(['superadmin']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ roles: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a role mapping
router.post('/roles', requireRole(['superadmin']), async (req, res) => {
  try {
    const user_id = sanitizeString(req.body.user_id, 100);
    const role = sanitizeString(req.body.role, 32);
    if (!user_id || !role) return res.status(400).json({ error: 'user_id and role required' });
    const allowed = ['superadmin', 'content_admin', 'moderator', 'viewer'];
    if (!allowed.includes(role)) return res.status(400).json({ error: 'invalid role' });

    // Upsert mapping
    const { data, error } = await supabase
      .from('admin_roles')
      .upsert({ user_id, role }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ mapping: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a role mapping by id
router.delete('/roles/:id', requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('admin_roles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;