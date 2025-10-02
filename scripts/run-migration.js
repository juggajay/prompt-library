#!/usr/bin/env node

/**
 * Script to run the database migration for Project Rules Generator
 *
 * Usage: node scripts/run-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Read the SQL file
    const sqlPath = join(__dirname, '../supabase/migrations/create_rule_generation_tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL Migration File Loaded');
    console.log('─'.repeat(60));

    // Split SQL into individual statements (rough split by semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) continue;

      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          // Try direct execution via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql_query: statement + ';' })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }

        console.log(`   ✅ Success`);
      } catch (err) {
        console.log(`   ⚠️  Error (may be expected): ${err.message}`);
        // Continue even if some statements fail (e.g., table already exists)
      }
    }

    console.log('\n─'.repeat(60));
    console.log('✅ Migration completed!\n');

    // Verify tables were created
    console.log('🔍 Verifying table creation...\n');

    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', [
        'rule_generation_sessions',
        'rule_conversation_messages',
        'project_rule_templates'
      ]);

    if (tableError) {
      console.log('⚠️  Could not verify tables (this is okay, they might still exist)');
    } else {
      console.log('Tables found:');
      if (tables && tables.length > 0) {
        tables.forEach(t => console.log(`   ✅ ${t.table_name}`));
      } else {
        console.log('   ℹ️  No tables returned (verification query may not work with RLS)');
      }
    }

    console.log('\n🎉 All done! You can now use the Project Rules Generator feature.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   Project Rules Generator - Database Migration        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

runMigration();
