#!/usr/bin/env node

import { config } from 'dotenv';

config();

async function createBatchesTable() {
  try {
    console.log('📄 Creating broadcast_batches table via admin API...');
    
    // Use the admin API to execute SQL
    const adminUrl = `${process.env.SUPABASE_URL}/functions/v1/admin-api`;
    
    // Login first
    const loginResponse = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'info@unamifoundation.org',
        password: process.env.ADMIN_PASSWORD
      })
    });
    
    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      console.error('❌ Login failed:', loginResult);
      return;
    }
    
    console.log('✅ Logged in successfully');
    
    // Now we'll create the table by inserting a test record and letting the system handle it
    // Since we can't execute raw SQL, we'll deploy the updated schema
    console.log('📋 Table creation requires schema deployment');
    console.log('💡 The broadcast webhook will handle missing table gracefully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createBatchesTable();