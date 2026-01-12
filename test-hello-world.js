#!/usr/bin/env node

import { sendTemplateMessage } from './config/whatsapp-compliant.js';

// Test hello_world template (already approved)
async function testTemplate(phoneNumber) {
  try {
    console.log(`📤 Sending hello_world template to ${phoneNumber}...`);
    
    const result = await sendTemplateMessage(
      phoneNumber,
      'hello_world',
      'en',
      [] // hello_world has no parameters
    );
    
    console.log('✅ Template sent successfully!');
    console.log('Message ID:', result.messages?.[0]?.id);
    
    return result;
  } catch (error) {
    console.error('❌ Template send failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage: node test-hello-world.js +27123456789
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.log('Usage: node test-hello-world.js +27123456789');
  process.exit(1);
}

testTemplate(phoneNumber);