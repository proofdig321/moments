import axios from 'axios';
import dotenv from 'dotenv';
import { MESSAGE_TEMPLATES, WhatsAppRateLimiter } from '../src/whatsapp-templates.js';

dotenv.config();

const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}`;

export const whatsappAPI = axios.create({
  baseURL: WHATSAPP_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Rate limiter instance
const rateLimiter = new WhatsAppRateLimiter(80); // 80 messages per second

// Send template message (WhatsApp Business API compliant)
export const sendTemplateMessage = async (to, templateName, languageCode, parameters = []) => {
  try {
    const response = await whatsappAPI.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: parameters.length > 0 ? [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ] : []
      }
    });
    
    console.log(`Template message sent to ${to}: ${templateName}`);
    return response.data;
  } catch (error) {
    console.error('Template message error:', error.response?.data || error.message);
    throw error;
  }
};

// Send interactive message with buttons
export const sendInteractiveMessage = async (to, templateName, languageCode, parameters = [], buttonUrl = null) => {
  try {
    const template = MESSAGE_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const components = [];
    
    // Add body parameters
    if (parameters.length > 0) {
      components.push({
        type: 'body',
        parameters: parameters.map(param => ({
          type: 'text',
          text: param
        }))
      });
    }
    
    // Add button URL parameter
    if (buttonUrl && template.components.some(c => c.type === 'BUTTONS')) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{
          type: 'text',
          text: buttonUrl
        }]
      });
    }

    const response = await whatsappAPI.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template.name,
        language: {
          code: languageCode
        },
        components
      }
    });
    
    console.log(`Interactive template sent to ${to}: ${templateName}`);
    return response.data;
  } catch (error) {
    console.error('Interactive message error:', error.response?.data || error.message);
    throw error;
  }
};

// Fallback to freeform message (only within 24-hour window)
export const sendFreeformMessage = async (to, message, mediaUrls = []) => {
  try {
    // Send text message
    const textResponse = await whatsappAPI.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    });
    
    // Send media if provided
    for (const mediaUrl of mediaUrls) {
      try {
        const mediaType = getMediaType(mediaUrl);
        await whatsappAPI.post('/messages', {
          messaging_product: 'whatsapp',
          to,
          type: mediaType,
          [mediaType]: { link: mediaUrl }
        });
      } catch (mediaError) {
        console.error('Media send error:', mediaError.message);
      }
    }
    
    return textResponse.data;
  } catch (error) {
    console.error('Freeform message error:', error.response?.data || error.message);
    throw error;
  }
};

// Compliant broadcast function using templates
export const sendCompliantBroadcast = async (subscribers, templateName, parameters, buttonUrl = null) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const subscriber of subscribers) {
    try {
      await rateLimiter.addMessage(
        subscriber.phone_number,
        templateName,
        parameters,
        buttonUrl
      );
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        phone: subscriber.phone_number,
        error: error.message
      });
    }
  }
  
  return results;
};

// Check if user is within 24-hour messaging window
export const isWithin24HourWindow = async (phoneNumber) => {
  try {
    // Query your database for last user message timestamp
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('created_at')
      .eq('from_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!lastMessage) return false;
    
    const lastMessageTime = new Date(lastMessage.created_at);
    const now = new Date();
    const hoursDiff = (now - lastMessageTime) / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  } catch (error) {
    console.error('24-hour window check error:', error);
    return false;
  }
};

// Smart message sender - chooses template vs freeform based on 24h window
export const sendSmartMessage = async (to, content, templateName = null, parameters = []) => {
  try {
    const within24Hours = await isWithin24HourWindow(to);
    
    if (within24Hours && !templateName) {
      // Can send freeform message
      return await sendFreeformMessage(to, content);
    } else if (templateName) {
      // Use approved template
      return await sendTemplateMessage(to, templateName, 'en', parameters);
    } else {
      throw new Error('Cannot send message: outside 24h window and no template provided');
    }
  } catch (error) {
    console.error('Smart message error:', error);
    throw error;
  }
};

// Media type detection
function getMediaType(url) {
  const ext = url.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'webm', '3gp'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
  return 'document';
}

// Template management functions
export const createTemplate = async (template) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      template,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Template created: ${template.name}`);
    return response.data;
  } catch (error) {
    console.error('Template creation error:', error.response?.data || error.message);
    throw error;
  }
};

export const getTemplateStatus = async (templateName) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        params: { name: templateName },
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Template status error:', error.response?.data || error.message);
    throw error;
  }
};

// Override rate limiter's sendTemplateMessage method
rateLimiter.sendTemplateMessage = async (phoneNumber, templateName, parameters, buttonUrl) => {
  if (buttonUrl) {
    return await sendInteractiveMessage(phoneNumber, templateName, 'en', parameters, buttonUrl);
  } else {
    return await sendTemplateMessage(phoneNumber, templateName, 'en', parameters);
  }
};

export { rateLimiter };