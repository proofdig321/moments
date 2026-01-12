import { supabase } from '../config/supabase.js';

export async function getCampaignAnalytics(timeframe = '30d') {
  try {
    const interval = timeframe === '7d' ? '7 days' : timeframe === '90d' ? '90 days' : '30 days';
    
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select(`
        *,
        sponsors(display_name),
        moments(id, broadcasted_at, broadcasts(recipient_count, success_count))
      `)
      .gte('created_at', `now() - interval '${interval}'`);

    const analytics = {
      totalCampaigns: campaigns?.length || 0,
      byStatus: {},
      byBudget: { total: 0, average: 0 },
      performance: { totalReach: 0, totalSuccess: 0, successRate: 0 },
      topSponsors: {},
      regionDistribution: {},
      categoryDistribution: {}
    };

    campaigns?.forEach(campaign => {
      // Status distribution
      analytics.byStatus[campaign.status] = (analytics.byStatus[campaign.status] || 0) + 1;
      
      // Budget analysis
      analytics.byBudget.total += campaign.budget || 0;
      
      // Performance metrics
      campaign.moments?.forEach(moment => {
        moment.broadcasts?.forEach(broadcast => {
          analytics.performance.totalReach += broadcast.recipient_count || 0;
          analytics.performance.totalSuccess += broadcast.success_count || 0;
        });
      });
      
      // Sponsor analysis
      if (campaign.sponsors?.display_name) {
        analytics.topSponsors[campaign.sponsors.display_name] = 
          (analytics.topSponsors[campaign.sponsors.display_name] || 0) + 1;
      }
      
      // Region distribution
      campaign.target_regions?.forEach(region => {
        analytics.regionDistribution[region] = (analytics.regionDistribution[region] || 0) + 1;
      });
      
      // Category distribution
      campaign.target_categories?.forEach(category => {
        analytics.categoryDistribution[category] = (analytics.categoryDistribution[category] || 0) + 1;
      });
    });

    analytics.byBudget.average = analytics.totalCampaigns > 0 
      ? analytics.byBudget.total / analytics.totalCampaigns 
      : 0;
    
    analytics.performance.successRate = analytics.performance.totalReach > 0
      ? (analytics.performance.totalSuccess / analytics.performance.totalReach * 100).toFixed(1)
      : 0;

    return analytics;
  } catch (error) {
    console.error('Campaign analytics error:', error);
    return null;
  }
}

export async function getSponsorROI(sponsorId, timeframe = '30d') {
  try {
    const interval = timeframe === '7d' ? '7 days' : timeframe === '90d' ? '90 days' : '30 days';
    
    const { data } = await supabase
      .from('campaigns')
      .select(`
        budget,
        moments(broadcasts(recipient_count, success_count))
      `)
      .eq('sponsor_id', sponsorId)
      .gte('created_at', `now() - interval '${interval}'`);

    const totalBudget = data?.reduce((sum, campaign) => sum + (campaign.budget || 0), 0) || 0;
    const totalReach = data?.reduce((sum, campaign) => {
      return sum + (campaign.moments?.reduce((momentSum, moment) => {
        return momentSum + (moment.broadcasts?.reduce((broadcastSum, broadcast) => {
          return broadcastSum + (broadcast.recipient_count || 0);
        }, 0) || 0);
      }, 0) || 0);
    }, 0) || 0;

    return {
      totalBudget,
      totalReach,
      costPerReach: totalReach > 0 ? (totalBudget / totalReach).toFixed(2) : 0,
      campaigns: data?.length || 0
    };
  } catch (error) {
    console.error('Sponsor ROI error:', error);
    return null;
  }
}