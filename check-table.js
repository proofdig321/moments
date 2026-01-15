#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAndCreateTable() {
  try {
    console.log('🔍 Checking if broadcast_batches table exists...');
    
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('broadcast_batches')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('📄 Table does not exist, creating it...');
      
      // Table doesn't exist, let's create it using a simple approach
      // We'll add it to the existing schema file and deploy
      console.log('✅ Table creation will be handled via schema deployment');
      
    } else if (error) {
      console.error('❌ Error checking table:', error);
    } else {
      console.log('✅ broadcast_batches table already exists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndCreateTable();