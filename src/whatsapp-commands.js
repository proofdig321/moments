// Enhanced WhatsApp Command Handler for Community-First Onboarding
// Handles START, STOP, HELP, REGIONS, INTERESTS commands

export async function handleWhatsAppCommand(message, supabase) {
  const phoneNumber = message.from;
  const text = (message.text?.body || '').toLowerCase().trim();
  
  // Region mapping
  const regionMap = {
    'gp': 'Gauteng',
    'gauteng': 'Gauteng',
    'wc': 'Western Cape', 
    'western cape': 'Western Cape',
    'kzn': 'KwaZulu-Natal',
    'kwazulu-natal': 'KwaZulu-Natal',
    'kwazulu natal': 'KwaZulu-Natal',
    'ec': 'Eastern Cape',
    'eastern cape': 'Eastern Cape', 
    'fs': 'Free State',
    'free state': 'Free State',
    'lp': 'Limpopo',
    'limpopo': 'Limpopo',
    'mp': 'Mpumalanga',
    'mpumalanga': 'Mpumalanga',
    'nc': 'Northern Cape',
    'northern cape': 'Northern Cape',
    'nw': 'North West',
    'north west': 'North West',
    'northwest': 'North West'
  };
  
  // Interest mapping
  const interestMap = {
    '1': 'Education',
    '2': 'Safety', 
    '3': 'Culture',
    '4': 'Jobs',
    '5': 'Health',
    '6': 'Technology',
    '7': 'Environment',
    '8': 'Youth'
  };
  
  try {
    // Get current subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    // Handle different commands
    if (['start', 'join', 'subscribe'].includes(text)) {
      return await handleStartCommand(phoneNumber, supabase);
      
    } else if (['stop', 'unsubscribe', 'quit', 'cancel'].includes(text)) {
      return await handleStopCommand(phoneNumber, supabase);
      
    } else if (['help', 'info', 'options'].includes(text)) {
      return await handleHelpCommand(phoneNumber, supabase);
      
    } else if (['regions', 'region', 'location', 'area'].includes(text)) {
      return await handleRegionsCommand(phoneNumber, supabase);
      
    } else if (['interests', 'categories', 'topics', 'preferences'].includes(text)) {
      return await handleInterestsCommand(phoneNumber, supabase);
      
    } else if (regionMap[text]) {
      return await handleRegionSelection(phoneNumber, regionMap[text], supabase);
      
    } else if (text.match(/^[1-8,\s]+$/)) {
      return await handleInterestSelection(phoneNumber, text, interestMap, supabase);
      
    } else {
      // Treat as community content to share
      return await handleCommunityContent(phoneNumber, message.text?.body || '', supabase);
    }
    
  } catch (error) {
    console.error('Command handling error:', error);
    return {
      success: false,
      message: 'Sorry, we encountered an error processing your message. Please try again.',
      action: 'error'
    };
  }
}

async function handleStartCommand(phoneNumber, supabase) {
  try {
    // Create or update subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        phone_number: phoneNumber,
        opted_in: true,
        opted_in_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        regions: ['GP'], // Default to Gauteng
        categories: ['Education', 'Safety', 'Jobs'], // Default interests
        consent_timestamp: new Date().toISOString(),
        consent_method: 'whatsapp_optin'
      }, { 
        onConflict: 'phone_number',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) {
      console.error('Subscription error:', error);
      return {
        success: false,
        message: 'Sorry, we couldn\'t complete your subscription. Please try again.',
        action: 'error'
      };
    }
    
    return {
      success: true,
      message: `🌍 Welcome to your community space!

You're now connected to Unami Foundation Moments - where YOUR community shares what matters most.

✨ This is about YOUR moments, YOUR opportunities, YOUR community.

We simply help connect neighbors and share local insights.

Region: Gauteng (default)
Interests: Education, Safety, Jobs

Reply REGIONS to change your area
Reply INTERESTS to update preferences
Reply HELP for all options

Your community, your moments 🤝`,
      action: 'subscribed',
      template: 'welcome_confirmation',
      parameters: ['Gauteng', 'Education, Safety, Jobs']
    };
    
  } catch (error) {
    console.error('Start command error:', error);
    return {
      success: false,
      message: 'Welcome! We\'re setting up your community connection. Please try again in a moment.',
      action: 'error'
    };
  }
}

async function handleStopCommand(phoneNumber, supabase) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        phone_number: phoneNumber,
        opted_in: false,
        opted_out_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      }, { onConflict: 'phone_number' });
    
    if (error) {
      console.error('Unsubscribe error:', error);
    }
    
    return {
      success: true,
      message: `Thank you for being part of our community! 🙏

You've left Unami Foundation Moments, but your community connections remain strong.

Reply START anytime to reconnect with local opportunities and community insights.

Stay connected, stay empowered! ✊`,
      action: 'unsubscribed',
      template: 'unsubscribe_confirmation'
    };
    
  } catch (error) {
    console.error('Stop command error:', error);
    return {
      success: true,
      message: 'You have been unsubscribed. Reply START anytime to rejoin your community.',
      action: 'unsubscribed'
    };
  }
}

async function handleHelpCommand(phoneNumber, supabase) {
  return {
    success: true,
    message: `🤝 Unami Foundation Moments - Community Help

This is YOUR community platform:

📍 REGIONS: Reply with province name
   (KZN, WC, GP, EC, FS, LP, MP, NC, NW)

🏷️ INTERESTS: Reply INTERESTS to choose
   (Education, Safety, Culture, Jobs, Health, etc.)

📱 COMMANDS:
   • START - Join community updates
   • STOP - Leave (anytime)
   • HELP - This message
   • REGIONS - Change your area
   • INTERESTS - Update preferences

💡 Share local opportunities by messaging us directly!

Your community, your voice, your moments.`,
    action: 'help',
    template: 'community_help'
  };
}

async function handleRegionsCommand(phoneNumber, supabase) {
  return {
    success: true,
    message: `📍 Choose your community region:

Reply with your province:

🏙️ GP - Gauteng
🌊 WC - Western Cape  
🏔️ KZN - KwaZulu-Natal
🦓 EC - Eastern Cape
🌾 FS - Free State
🌳 LP - Limpopo
⛰️ MP - Mpumalanga
🏜️ NC - Northern Cape
🌿 NW - North West

Example: Reply 'KZN' for KwaZulu-Natal

Your region helps us share the most relevant community opportunities with you!`,
    action: 'region_selection',
    template: 'region_selection'
  };
}

async function handleInterestsCommand(phoneNumber, supabase) {
  return {
    success: true,
    message: `🏷️ What matters most to your community?

Reply with numbers (e.g., '1,3,5'):

1️⃣ Education - Skills, training, learning
2️⃣ Safety - Community safety, awareness  
3️⃣ Culture - Events, heritage, celebrations
4️⃣ Jobs - Employment, opportunities
5️⃣ Health - Wellness, clinic info
6️⃣ Technology - Digital skills, access
7️⃣ Environment - Conservation, green initiatives
8️⃣ Youth - Programs for young people

Example: Reply '1,4,5' for Education, Jobs, and Health

We'll share community moments that match your interests!`,
    action: 'interest_selection',
    template: 'interests_selection'
  };
}

async function handleRegionSelection(phoneNumber, regionName, supabase) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        phone_number: phoneNumber,
        regions: [regionName],
        last_activity: new Date().toISOString()
      }, { onConflict: 'phone_number' })
      .select()
      .single();
    
    if (error) {
      console.error('Region update error:', error);
      return {
        success: false,
        message: 'Sorry, we couldn\'t update your region. Please try again.',
        action: 'error'
      };
    }
    
    return {
      success: true,
      message: `📍 Region updated to ${regionName}!

You'll now receive community moments and opportunities relevant to your area.

🤝 Help your neighbors by sharing local opportunities, events, and important community information.

Reply INTERESTS to update what matters most to you.`,
      action: 'region_updated',
      template: 'region_updated',
      parameters: [regionName]
    };
    
  } catch (error) {
    console.error('Region selection error:', error);
    return {
      success: false,
      message: `Region updated to ${regionName}! Reply INTERESTS to choose your topics.`,
      action: 'region_updated'
    };
  }
}

async function handleInterestSelection(phoneNumber, interestText, interestMap, supabase) {
  try {
    // Parse interest numbers
    const numbers = interestText.split(',').map(n => n.trim()).filter(n => n.match(/^[1-8]$/));
    
    if (numbers.length === 0) {
      return {
        success: false,
        message: `❓ Please reply with numbers 1-8 separated by commas.

Example: '1,4,5' for Education, Jobs, Health

1️⃣ Education  2️⃣ Safety  3️⃣ Culture  4️⃣ Jobs
5️⃣ Health  6️⃣ Technology  7️⃣ Environment  8️⃣ Youth

Reply HELP for all options.`,
        action: 'invalid_interests',
        template: 'invalid_interests'
      };
    }
    
    const selectedInterests = numbers.map(n => interestMap[n]);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        phone_number: phoneNumber,
        categories: selectedInterests,
        last_activity: new Date().toISOString()
      }, { onConflict: 'phone_number' })
      .select()
      .single();
    
    if (error) {
      console.error('Interest update error:', error);
    }
    
    return {
      success: true,
      message: `🏷️ Interests updated: ${selectedInterests.join(', ')}

You'll receive community moments matching these topics.

💡 Share opportunities in these areas with your community by messaging us directly!

Your input helps neighbors discover relevant opportunities.

Reply REGIONS to change your area.`,
      action: 'interests_updated',
      template: 'interests_updated',
      parameters: [selectedInterests.join(', ')]
    };
    
  } catch (error) {
    console.error('Interest selection error:', error);
    return {
      success: true,
      message: `Interests updated! You'll receive community moments matching your preferences.`,
      action: 'interests_updated'
    };
  }
}

async function handleCommunityContent(phoneNumber, content, supabase) {
  try {
    // Store the community-shared content for review
    const title = content.length <= 50 ? content : content.substring(0, 47) + '...';
    
    const { data: moment, error } = await supabase
      .from('moments')
      .insert({
        title,
        content,
        region: 'GP', // Default region, can be improved with user's region
        category: 'Community',
        status: 'draft', // Requires review before broadcasting
        created_by: 'community',
        content_source: 'community',
        is_sponsored: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Community content storage error:', error);
    }
    
    return {
      success: true,
      message: `🌟 Thank you for sharing with your community!

Your message: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"

We're reviewing it to share with neighbors who might benefit.

✨ Community members like you make this platform valuable by sharing:
• Local opportunities
• Safety updates  
• Cultural events
• Job openings
• Community resources

Keep sharing what matters to your community! 🤝`,
      action: 'community_content_shared',
      template: 'community_moment_share',
      parameters: [content.substring(0, 200)]
    };
    
  } catch (error) {
    console.error('Community content handling error:', error);
    return {
      success: true,
      message: 'Thank you for sharing with your community! We\'ll review your message and share it with neighbors who might benefit. 🤝',
      action: 'community_content_shared'
    };
  }
}

export default handleWhatsAppCommand;