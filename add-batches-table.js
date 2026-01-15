#!/usr/bin/env node

import fs from 'fs';
import { config } from 'dotenv';

config();

async function addBroadcastBatchesTable() {
  try {
    console.log('📄 Adding broadcast_batches table...');
    
    const sql = fs.readFileSync('./add-broadcast-batches-only.sql', 'utf8');
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ sql })
    });
    
    if (response.ok) {
      console.log('✅ broadcast_batches table added successfully');
    } else {
      const error = await response.text();
      console.log('ℹ️ Response:', error);
      
      // Check if table already exists
      const checkResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/broadcast_batches?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_KEY
        }
      });
      
      if (checkResponse.status === 200) {
        console.log('✅ broadcast_batches table already exists');
      } else {
        console.error('❌ Failed to create table');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addBroadcastBatchesTable();