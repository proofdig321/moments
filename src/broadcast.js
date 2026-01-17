import { supabase } from '../config/supabase.js';
import { sendWhatsAppMessage } from '../config/whatsapp.js';

// Authority-based broadcast filtering (Phase 5: Broadcast Integration)
async function getAuthorityContext(createdBy) {
  if (!createdBy) return null;
  
  try {
    const { data, error } = await supabase.rpc('lookup_authority', {
      p_user_identifier: createdBy
    });
    
    if (error) {
      console.warn(`Authority lookup failed for ${createdBy}:`, error.message);
      return null; // Fail-open
    }
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`Authority lookup exception for ${createdBy}:`, error.message);
    return null; // Fail-open
  }
}

// Apply authority-based subscriber filtering
function applyAuthorityFiltering(subscribers, authority, moment) {
  if (!authority) {
    // No authority - use default limits for safety
    return subscribers.slice(0, 100); // Default blast radius
  }
  
  let filteredSubscribers = subscribers;
  
  // Apply scope filtering
  if (authority.scope && authority.scope !== 'national') {
    // For non-national scope, ensure moment region matches authority scope
    if (moment.region && moment.region !== 'National') {
      // Authority scope validation happens at moment creation
      // Here we just apply the blast radius
    }
  }
  
  // Apply blast radius limit
  const blastRadius = authority.blast_radius || 100;
  if (filteredSubscribers.length > blastRadius) {
    filteredSubscribers = filteredSubscribers.slice(0, blastRadius);
    console.log(`Authority blast radius applied: ${filteredSubscribers.length}/${subscribers.length} subscribers`);
  }
  
  return filteredSubscribers;
}

// Enhanced broadcast system for community + admin content with authority controls
export async function broadcastMoment(momentId) {
  try {
    // Get moment details with sponsor info
    const { data: moment, error: momentError } = await supabase
      .from('moments')
      .select(`
        *,
        sponsors(display_name)
      `)
      .eq('id', momentId)
      .single();

    if (momentError || !moment) {
      throw new Error('Moment not found');
    }

    // Get authority context for the moment creator (Phase 5: Authority Integration)
    const authorityContext = await getAuthorityContext(moment.created_by);
    
    // Log authority enforcement
    if (authorityContext) {
      await supabase.rpc('log_authority_action', {
        p_authority_profile_id: authorityContext.id,
        p_action: 'enforced',
        p_actor_id: null,
        p_context: {
          moment_id: momentId,
          blast_radius: authorityContext.blast_radius,
          scope: authorityContext.scope
        }
      }).catch(err => console.warn('Authority audit log failed:', err.message));
    }

    // Get active subscribers
    let subscriberQuery = supabase
      .from('subscriptions')
      .select('phone_number, regions, categories')
      .eq('opted_in', true);

    // Filter by region if specified
    if (moment.region && moment.region !== 'National') {
      subscriberQuery = subscriberQuery.contains('regions', [moment.region]);
    }

    const { data: allSubscribers, error: subError } = await subscriberQuery;
    if (subError) throw subError;
    
    // Apply authority-based filtering (Phase 5: Authority Controls)
    const subscribers = applyAuthorityFiltering(allSubscribers || [], authorityContext, moment);

    // Create broadcast record with authority context
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcasts')
      .insert({
        moment_id: momentId,
        recipient_count: subscribers?.length || 0,
        status: 'in_progress',
        authority_context: authorityContext ? {
          authority_id: authorityContext.id,
          authority_level: authorityContext.authority_level,
          blast_radius: authorityContext.blast_radius,
          scope: authorityContext.scope,
          original_subscriber_count: allSubscribers?.length || 0
        } : null
      })
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    // Format message based on content source
    const message = moment.content_source === 'community' 
      ? formatCommunityMessage(moment)
      : formatAdminMessage(moment);
    
    let successCount = 0;
    let failureCount = 0;

    // Send to subscribers with rate limiting
    for (const subscriber of subscribers || []) {
      try {
        await sendWhatsAppMessage(subscriber.phone_number, message, moment.media_urls);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 15)); // Rate limit
      } catch (error) {
        console.error(`Failed to send to ${subscriber.phone_number}:`, error.message);
        failureCount++;
      }
    }

    // Update broadcast results
    await supabase
      .from('broadcasts')
      .update({
        success_count: successCount,
        failure_count: failureCount,
        status: 'completed',
        broadcast_completed_at: new Date().toISOString()
      })
      .eq('id', broadcast.id);

    // Update moment status
    await supabase
      .from('moments')
      .update({
        status: 'broadcasted',
        broadcasted_at: new Date().toISOString()
      })
      .eq('id', momentId);

    return {
      broadcast_id: broadcast.id,
      recipients: subscribers?.length || 0,
      success: successCount,
      failures: failureCount
    };

  } catch (error) {
    console.error('Broadcast error:', error.message);
    throw error;
  }
}

// Format community message with neutral language
function formatCommunityMessage(moment) {
  let message = `📢 Community Report — ${moment.region}\n`;
  message += `${moment.title}\n\n`;
  message += `Shared by community member for awareness.\n`;
  message += `🌐 Full details: moments.unamifoundation.org\n\n`;
  message += `📱 Reply STOP to unsubscribe`;
  return message;
}

// Format admin message with WhatsApp compliance
function formatAdminMessage(moment) {
  let message = '';
  
  // Avoid 'sponsored' - use 'partner content' instead
  if (moment.is_sponsored && moment.sponsors?.display_name) {
    message += `🌟 Partner Content — ${moment.region}\n`;
  } else {
    message += `📢 Official Update — ${moment.region}\n`;
  }
  
  message += `${moment.title}\n`;
  if (moment.content.length > 100) {
    message += `${moment.content.substring(0, 97)}...\n`;
  } else {
    message += `${moment.content}\n`;
  }
  
  message += `\n🏷️ ${moment.category}`;
  if (moment.region !== 'National') {
    message += ` • 📍 ${moment.region}`;
  }
  
  // WhatsApp compliant partner attribution
  if (moment.is_sponsored && moment.sponsors?.display_name) {
    message += `\n\nIn partnership with ${moment.sponsors.display_name}`;
  }
  
  if (moment.pwa_link) {
    message += `\n🌐 More: ${moment.pwa_link}`;
  }
  
  message += '\n\n📱 Reply STOP to unsubscribe';
  
  return message;
}

// Schedule and process pending broadcasts
export async function scheduleNextBroadcasts() {
  try {
    // Get moments scheduled for broadcast
    const { data: scheduledMoments, error } = await supabase
      .from('moments')
      .select('id, title, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10);

    if (error) throw error;

    let processedCount = 0;
    
    for (const moment of scheduledMoments || []) {
      try {
        console.log(`Broadcasting scheduled moment: ${moment.title}`);
        await broadcastMoment(moment.id);
        processedCount++;
      } catch (error) {
        console.error(`Failed to broadcast moment ${moment.id}:`, error.message);
        
        // Mark as failed
        await supabase
          .from('moments')
          .update({ status: 'failed' })
          .eq('id', moment.id);
      }
    }

    console.log(`Processed ${processedCount} scheduled broadcasts`);
    return { scheduled: processedCount };
    
  } catch (error) {
    console.error('Scheduler error:', error.message);
    return { scheduled: 0, error: error.message };
  }
}

// Get broadcast analytics
export async function getBroadcastAnalytics(timeframe = '7d') {
  try {
    const startDate = new Date();
    if (timeframe === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (timeframe === '90d') startDate.setDate(startDate.getDate() - 90);

    const { data: broadcasts, error } = await supabase
      .from('broadcasts')
      .select(`
        *,
        moments(title, region, category, is_sponsored)
      `)
      .gte('broadcast_started_at', startDate.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    const analytics = {
      totalBroadcasts: broadcasts?.length || 0,
      totalRecipients: broadcasts?.reduce((sum, b) => sum + (b.recipient_count || 0), 0) || 0,
      totalSuccess: broadcasts?.reduce((sum, b) => sum + (b.success_count || 0), 0) || 0,
      totalFailures: broadcasts?.reduce((sum, b) => sum + (b.failure_count || 0), 0) || 0,
      successRate: 0,
      byRegion: {},
      byCategory: {},
      sponsored: 0,
      organic: 0
    };

    if (analytics.totalRecipients > 0) {
      analytics.successRate = (analytics.totalSuccess / analytics.totalRecipients * 100).toFixed(1);
    }

    // Aggregate by region and category
    broadcasts?.forEach(broadcast => {
      const moment = broadcast.moments;
      if (moment) {
        // By region
        if (!analytics.byRegion[moment.region]) {
          analytics.byRegion[moment.region] = { count: 0, recipients: 0, success: 0 };
        }
        analytics.byRegion[moment.region].count++;
        analytics.byRegion[moment.region].recipients += broadcast.recipient_count || 0;
        analytics.byRegion[moment.region].success += broadcast.success_count || 0;

        // By category
        if (!analytics.byCategory[moment.category]) {
          analytics.byCategory[moment.category] = { count: 0, recipients: 0, success: 0 };
        }
        analytics.byCategory[moment.category].count++;
        analytics.byCategory[moment.category].recipients += broadcast.recipient_count || 0;
        analytics.byCategory[moment.category].success += broadcast.success_count || 0;

        // Sponsored vs organic
        if (moment.is_sponsored) {
          analytics.sponsored++;
        } else {
          analytics.organic++;
        }
      }
    });

    return analytics;
  } catch (error) {
    console.error('Analytics error:', error.message);
    throw error;
  }
}