#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250115_add_broadcast_batches.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Applying broadcast_batches migration...');
    
    // Execute the SQL via Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });
    
    if (response.ok) {
      console.log('✅ Migration applied successfully');
    } else {
      const error = await response.text();
      console.error('❌ Migration failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

applyMigration();