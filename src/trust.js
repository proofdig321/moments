import { supabase } from '../config/supabase.js';

export const processTrustSignals = async (messageData, advisory) => {
  const flags = [];
  
  // Soft trust controls - log everything, block nothing
  
  // High urgency flagging
  if (advisory.urgency_level === 'high') {
    flags.push({
      message_id: messageData.id,
      flag_type: 'high_urgency',
      severity: 'medium',
      action_taken: 'logged',
      notes: 'High urgency content detected for review'
    });
  }
  
  // Harm signal detection (advisory only)
  if (advisory.harm_signals.detected && advisory.harm_signals.confidence > 0.7) {
    flags.push({
      message_id: messageData.id,
      flag_type: 'potential_harm',
      severity: advisory.escalation_suggested ? 'high' : 'medium',
      action_taken: advisory.escalation_suggested ? 'escalated' : 'logged',
      notes: `${advisory.harm_signals.type}: ${advisory.harm_signals.context}`
    });
  }
  
  // Spam pattern detection
  if (advisory.spam_indicators.detected && advisory.spam_indicators.confidence > 0.8) {
    flags.push({
      message_id: messageData.id,
      flag_type: 'spam_pattern',
      severity: 'low',
      action_taken: 'logged',
      notes: `Patterns: ${advisory.spam_indicators.patterns.join(', ')}`
    });
  }
  
  // Rate limiting check (soft)
  const recentMessages = await checkRecentMessages(messageData.from_number);
  if (recentMessages > 20) { // 20 messages in last hour
    flags.push({
      message_id: messageData.id,
      flag_type: 'high_volume',
      severity: 'low',
      action_taken: 'logged',
      notes: `${recentMessages} messages in last hour`
    });
  }
  
  // Store all flags
  if (flags.length > 0) {
    await supabase.from('flags').insert(flags);
  }
  
  // NEVER block - always allow message through
  return {
    allowed: true,
    flags: flags.length,
    escalation_needed: advisory.escalation_suggested
  };
};

const checkRecentMessages = async (fromNumber) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('from_number', fromNumber)
    .gte('created_at', oneHourAgo);
  
  return count || 0;
};

export const handleOptOut = async (fromNumber) => {
  // Handle STOP commands
  await supabase.from('flags').insert({
    message_id: null,
    flag_type: 'opt_out',
    severity: 'low',
    action_taken: 'logged',
    notes: `User ${fromNumber} opted out`
  });
  
  return true;
};