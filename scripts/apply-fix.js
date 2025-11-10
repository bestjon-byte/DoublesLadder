const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  try {
    console.log('Applying SQL fix for generate_coaching_sessions function...\n');

    const sqlPath = path.join(__dirname, '..', 'fix_generate_sessions_FINAL.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // The Supabase JS client can't execute DDL directly
    // We need to provide instructions for manual application

    console.log('=================================================================');
    console.log('SQL FIX READY - Manual Application Required');
    console.log('=================================================================\n');

    console.log('The fixed SQL function is ready in: fix_generate_sessions_FINAL.sql\n');

    console.log('To apply the fix, please follow these steps:\n');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project: hwpjrkmplydqaxiikupv');
    console.log('3. Navigate to: SQL Editor > New Query');
    console.log('4. Copy the entire contents of: fix_generate_sessions_FINAL.sql');
    console.log('5. Paste into the SQL Editor');
    console.log('6. Click "Run" to execute\n');

    console.log('OR use this direct link:');
    console.log('https://supabase.com/dashboard/project/hwpjrkmplydqaxiikupv/sql/new\n');

    console.log('=================================================================\n');

    console.log('What the fix does:');
    console.log('- Adds support for custom start_from_date parameter');
    console.log('- Fixes column name ambiguity issues (uses out_* names)');
    console.log('- Maintains backward compatibility (start_from_date is optional)');
    console.log('- Proper conflict handling for duplicate sessions\n');

    console.log('After applying, the frontend will be updated to use the new functionality.');
    console.log('=================================================================\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

applyFix();
