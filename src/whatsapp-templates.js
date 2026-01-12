// WhatsApp Business API Template Management System
// Compliant with Meta Business API requirements

export const TEMPLATE_CATEGORIES = {
  UTILITY: 'UTILITY',
  MARKETING: 'MARKETING', 
  AUTHENTICATION: 'AUTHENTICATION'
};

// Template definitions for WhatsApp Business API approval
export const MESSAGE_TEMPLATES = {
  // UTILITY Templates (Account updates, notifications)
  WELCOME_CONFIRMATION: {
    name: 'welcome_confirmation',
    category: TEMPLATE_CATEGORIES.UTILITY,
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Welcome to Unami Foundation Moments! 🌟\n\nYou\'re now subscribed to community updates for {{1}}.\n\nCategories: {{2}}\n\nReply STOP anytime to unsubscribe.'
      },
      {
        type: 'FOOTER',
        text: 'Unami Foundation - Empowering Communities'
      }
    ]
  },

  UNSUBSCRIBE_CONFIRMATION: {
    name: 'unsubscribe_confirmation',
    category: TEMPLATE_CATEGORIES.UTILITY,
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'You have been unsubscribed from Unami Foundation Moments.\n\nReply START anytime to resubscribe.\n\nThank you for being part of our community! 🙏'
      }
    ]
  },

  // MARKETING Templates (Moment broadcasts)
  MOMENT_BROADCAST: {
    name: 'moment_broadcast_v2',
    category: TEMPLATE_CATEGORIES.MARKETING,
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '{{1}} Moment — {{2}}'
      },
      {
        type: 'BODY',
        text: '{{3}}\n\n{{4}}\n\n🏷️ {{5}} • 📍 {{6}}\n\n🌐 More: https://moments.unamifoundation.org'
      },
      {
        type: 'FOOTER',
        text: 'Reply STOP to unsubscribe'
      }
    ]
  },

  SPONSORED_MOMENT: {
    name: 'sponsored_moment_v2',
    category: TEMPLATE_CATEGORIES.MARKETING,
    language: 'en',
    components: [
      {
        type: 'HEADER',
        format: 'TEXT',
        text: '{{1}} [Sponsored] Moment — {{2}}'
      },
      {
        type: 'BODY',
        text: '{{3}}\n\n{{4}}\n\n🏷️ {{5}} • 📍 {{6}}\n\n✨ Proudly sponsored by {{7}}\n\n🌐 More: https://moments.unamifoundation.org'
      },
      {
        type: 'FOOTER',
        text: 'Reply STOP to unsubscribe'
      }
    ]
  },

  // Interactive subscription management
  SUBSCRIPTION_PREFERENCES: {
    name: 'subscription_preferences',
    category: TEMPLATE_CATEGORIES.UTILITY,
    language: 'en',
    components: [
      {
        type: 'BODY',
        text: 'Manage your Unami Foundation Moments preferences:\n\nCurrent region: {{1}}\nCategories: {{2}}\n\nUse the buttons below to update your preferences.'
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Change Region'
          },
          {
            type: 'QUICK_REPLY', 
            text: 'Update Categories'
          },
          {
            type: 'QUICK_REPLY',
            text: 'Unsubscribe'
          }
        ]
      }
    ]
  }
};

// Template parameter builders
export function buildWelcomeParams(region, categories) {
  return [region, categories.join(', ')];
}

export function buildMomentParams(moment, sponsor = null) {
  const emoji = sponsor ? getSponsorEmoji(sponsor.tier) : '📢';

  if (sponsor) {
    return [
      emoji,
      moment.region,
      moment.title,
      moment.content,
      moment.category,
      moment.region,
      sponsor.display_name
    ];
  } else {
    return [
      emoji,
      moment.region, 
      moment.title,
      moment.content,
      moment.category,
      moment.region
    ];
  }
}

export function buildPreferencesParams(region, categories) {
  return [region, categories.join(', ')];
}

function getSponsorEmoji(tier) {
  switch (tier) {
    case 'enterprise': return '👑';
    case 'premium': return '⭐';
    default: return '📢';
  }
}

// Template validation for WhatsApp Business API
export function validateTemplate(template) {
  const errors = [];
  
  if (!template.name || template.name.length > 512) {
    errors.push('Template name required and must be ≤512 characters');
  }
  
  if (!Object.values(TEMPLATE_CATEGORIES).includes(template.category)) {
    errors.push('Invalid template category');
  }
  
  if (!template.components || template.components.length === 0) {
    errors.push('Template must have at least one component');
  }
  
  // Validate components
  template.components?.forEach((component, index) => {
    if (!['HEADER', 'BODY', 'FOOTER', 'BUTTONS'].includes(component.type)) {
      errors.push(`Invalid component type at index ${index}`);
    }
    
    if (component.type === 'BODY' && (!component.text || component.text.length > 1024)) {
      errors.push(`Body text required and must be ≤1024 characters at index ${index}`);
    }
    
    if (component.type === 'BUTTONS' && component.buttons?.length > 3) {
      errors.push(`Maximum 3 buttons allowed at index ${index}`);
    }
  });
  
  return errors;
}

// Rate limiting for WhatsApp Business API
export class WhatsAppRateLimiter {
  constructor(messagesPerSecond = 80) {
    this.messagesPerSecond = messagesPerSecond;
    this.messageQueue = [];
    this.isProcessing = false;
  }
  
  async addMessage(phoneNumber, templateName, parameters, mediaUrls = []) {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({
        phoneNumber,
        templateName, 
        parameters,
        mediaUrls,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }
  
  async processQueue() {
    this.isProcessing = true;
    const interval = 1000 / this.messagesPerSecond;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      
      try {
        const result = await this.sendTemplateMessage(
          message.phoneNumber,
          message.templateName,
          message.parameters,
          message.mediaUrls
        );
        message.resolve(result);
      } catch (error) {
        message.reject(error);
      }
      
      // Rate limiting delay
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    this.isProcessing = false;
  }
  
  async sendTemplateMessage(phoneNumber, templateName, parameters, mediaUrls) {
    // This will be implemented in the WhatsApp config
    throw new Error('sendTemplateMessage must be implemented');
  }
}