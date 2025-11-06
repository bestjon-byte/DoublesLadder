const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please ensure REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL by major sections (tables, policies, functions)
    // We'll need to execute them in order due to dependencies

    console.log('Executing SQL schema...');
    console.log('Note: This may take a few moments...\n');

    // Execute the full SQL
    // Note: Supabase client doesn't directly support multi-statement SQL execution
    // We need to use the REST API directly

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative: split into individual statements
      console.log('Direct execution failed, trying statement-by-statement execution...');
      await executeSQLStatements(sql);
    } else {
      console.log('✓ Schema applied successfully!');
    }

  } catch (error) {
    console.error('Error executing SQL:', error.message);

    // If direct execution fails, provide instructions
    console.log('\n=================================================');
    console.log('ALTERNATIVE: Manual Application Instructions');
    console.log('=================================================');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to: SQL Editor > New Query');
    console.log('3. Copy the contents of coaching_schema.sql');
    console.log('4. Paste into the SQL Editor');
    console.log('5. Click "Run" to execute');
    console.log('=================================================\n');

    process.exit(1);
  }
}

async function executeSQLStatements(sql) {
  // Remove comments and split by semicolons
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    // Skip comments and empty statements
    if (!stmt || stmt.startsWith('--')) continue;

    try {
      // Try to identify what kind of statement this is
      const stmtType = stmt.substring(0, 50).toUpperCase();
      let description = 'Executing statement';

      if (stmtType.includes('CREATE TABLE')) {
        const match = stmt.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        description = match ? `Creating table: ${match[1]}` : 'Creating table';
      } else if (stmtType.includes('CREATE INDEX')) {
        const match = stmt.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i);
        description = match ? `Creating index: ${match[1]}` : 'Creating index';
      } else if (stmtType.includes('CREATE POLICY')) {
        const match = stmt.match(/CREATE POLICY (\w+)/i);
        description = match ? `Creating policy: ${match[1]}` : 'Creating policy';
      } else if (stmtType.includes('CREATE FUNCTION') || stmtType.includes('CREATE OR REPLACE FUNCTION')) {
        const match = stmt.match(/FUNCTION (\w+)/i);
        description = match ? `Creating function: ${match[1]}` : 'Creating function';
      } else if (stmtType.includes('CREATE TRIGGER')) {
        const match = stmt.match(/CREATE TRIGGER (\w+)/i);
        description = match ? `Creating trigger: ${match[1]}` : 'Creating trigger';
      } else if (stmtType.includes('ALTER TABLE')) {
        description = 'Altering table';
      } else if (stmtType.includes('COMMENT ON')) {
        continue; // Skip comments for now
      } else if (stmtType.includes('INSERT INTO')) {
        const match = stmt.match(/INSERT INTO (\w+)/i);
        description = match ? `Inserting into: ${match[1]}` : 'Inserting data';
      }

      process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);

      // Execute using Supabase's query method (this may not work for all statements)
      // This is a limitation of the JS client - ideally we'd use a direct PostgreSQL connection

      // For now, we'll just log that this needs manual execution
      console.log('⚠ (requires manual execution)');

    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n=================================================');
  console.log('SQL Parsing Complete');
  console.log(`Total statements found: ${statements.length}`);
  console.log('=================================================');
  console.log('\nThe Supabase JavaScript client has limited support for DDL statements.');
  console.log('Please apply the schema manually using one of these methods:\n');
  console.log('METHOD 1: Supabase Dashboard (Recommended)');
  console.log('  1. Go to: https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Go to: SQL Editor > New Query');
  console.log('  4. Copy contents of: coaching_schema.sql');
  console.log('  5. Paste and click "Run"\n');
  console.log('METHOD 2: PostgreSQL Client');
  console.log('  1. Get database connection string from Supabase Dashboard');
  console.log('  2. Run: psql <connection_string> -f coaching_schema.sql\n');
  console.log('=================================================\n');
}

// Run the script
const schemaPath = path.join(__dirname, '..', 'coaching_schema.sql');
executeSQLFile(schemaPath);
