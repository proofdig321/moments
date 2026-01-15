#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function checkDeployedFunctions() {
  try {
    console.log('🔍 Checking deployed Supabase functions...');
    
    const functions = [
      'admin-api',
      'broadcast-webhook', 
      'webhook',
      'analytics-refresh',
      'public-api'
    ];
    
    for (const func of functions) {
      const url = `${process.env.SUPABASE_URL}/functions/v1/${func}`;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
          }
        });
        
        if (response.status === 404) {
          console.log(`❌ ${func}: Not deployed`);
        } else {
          console.log(`✅ ${func}: Deployed (status: ${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${func}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDeployedFunctions();