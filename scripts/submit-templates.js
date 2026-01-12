#!/usr/bin/env node

import { createTemplate } from '../config/whatsapp-compliant.js';
import { MESSAGE_TEMPLATES } from '../src/whatsapp-templates.js';
import dotenv from 'dotenv';

dotenv.config();

// Convert our template definitions to WhatsApp API format
function convertToWhatsAppFormat(templateDef) {
  return {
    name: templateDef.name,
    category: templateDef.category,
    language: templateDef.language || 'en',
    components: templateDef.components
  };
}

async function submitAllTemplates() {
  console.log('🚀 Submitting WhatsApp Business Templates...\n');
  
  const templates = [
    'WELCOME_CONFIRMATION',
    'UNSUBSCRIBE_CONFIRMATION', 
    'MOMENT_BROADCAST',
    'SPONSORED_MOMENT',
    'SUBSCRIPTION_PREFERENCES'
  ];
  
  for (const templateKey of templates) {
    try {
      const template = MESSAGE_TEMPLATES[templateKey];
      const whatsappTemplate = convertToWhatsAppFormat(template);
      
      console.log(`📤 Submitting: ${template.name}`);
      const result = await createTemplate(whatsappTemplate);
      
      console.log(`✅ Success: ${template.name} - ID: ${result.id}`);
      console.log(`   Status: Pending approval\n`);
      
    } catch (error) {
      console.error(`❌ Failed: ${templateKey}`);
      console.error(`   Error: ${error.message}\n`);
    }
  }
  
  console.log('📋 Template submission complete!');
  console.log('⏳ Templates are now pending WhatsApp approval (24-48 hours)');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  submitAllTemplates().catch(console.error);
}

export { submitAllTemplates };