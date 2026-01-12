import { supabase } from '../config/supabase.js';
import { broadcastMoment } from './broadcast.js';

// Urgency-based broadcast scheduler
export async function processUrgentMoments() {
  try {
    // Get urgent moments that need immediate broadcast
    const { data: urgentMoments, error } = await supabase
      .from('moments')
      .select('id, title, urgency_level, created_at')
      .eq('status', 'broadcasted')
      .eq('urgency_level', 'high')
      .is('broadcast_sent', null)
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) throw error;

    let processedCount = 0;
    
    for (const moment of urgentMoments || []) {
      try {
        console.log(`Broadcasting urgent moment: ${moment.title}`);
        await broadcastMoment(moment.id);
        
        // Mark as broadcast sent
        await supabase
          .from('moments')
          .update({ broadcast_sent: new Date().toISOString() })
          .eq('id', moment.id);
          
        processedCount++;
      } catch (error) {
        console.error(`Failed to broadcast urgent moment ${moment.id}:`, error.message);
      }
    }

    return { urgent: processedCount };
  } catch (error) {
    console.error('Urgent broadcast error:', error.message);
    return { urgent: 0, error: error.message };
  }
}

// Weekly aggregated broadcast for non-urgent content
export async function processWeeklyDigest() {
  try {
    // Get non-urgent moments from past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: moments, error } = await supabase
      .from('moments')
      .select('id, title, content, region, category, content_source, created_at')
      .eq('status', 'broadcasted')
      .in('urgency_level', ['low', 'medium'])
      .is('digest_sent', null)
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!moments || moments.length === 0) {
      console.log('No moments for weekly digest');
      return { digest: 0 };
    }

    // Group by region
    const byRegion = moments.reduce((acc, moment) => {
      if (!acc[moment.region]) acc[moment.region] = [];
      acc[moment.region].push(moment);
      return acc;
    }, {});

    // Create digest message
    let digestMessage = `📊 Weekly Community Digest\n\n`;
    
    Object.entries(byRegion).forEach(([region, regionMoments]) => {
      digestMessage += `📍 ${region} (${regionMoments.length} updates)\n`;
      regionMoments.slice(0, 3).forEach(moment => {
        const source = moment.content_source === 'community' ? '👥' : '🏛️';
        digestMessage += `${source} ${moment.title}\n`;
      });
      if (regionMoments.length > 3) {
        digestMessage += `... and ${regionMoments.length - 3} more\n`;
      }
      digestMessage += `\n`;
    });

    digestMessage += `🌐 View all: moments.unamifoundation.org\n`;
    digestMessage += `📱 Reply STOP to unsubscribe`;

    // Get all subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscriptions')
      .select('phone_number')
      .eq('opted_in', true);

    if (subError) throw subError;

    // Send digest to all subscribers
    let successCount = 0;
    for (const subscriber of subscribers || []) {
      try {
        await sendWhatsAppMessage(subscriber.phone_number, digestMessage);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 20)); // Rate limit
      } catch (error) {
        console.error(`Failed to send digest to ${subscriber.phone_number}`);
      }
    }

    // Mark moments as digest sent
    const momentIds = moments.map(m => m.id);
    await supabase
      .from('moments')
      .update({ digest_sent: new Date().toISOString() })
      .in('id', momentIds);

    console.log(`Weekly digest sent to ${successCount} subscribers`);
    return { digest: successCount };

  } catch (error) {
    console.error('Weekly digest error:', error.message);
    return { digest: 0, error: error.message };
  }
}