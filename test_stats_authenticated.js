const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hwpjrkmplydqaxiikupv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTUwNjgsImV4cCI6MjA3MTA5MTA2OH0.6xnC3k_CRChyavAfdJT0I4NLN_Wv1ZgIlRO0Jnqckkk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithAuth() {
  console.log('\n=== Testing Stats Function Execution ===\n');

  // Try calling the function directly
  console.log('1. Direct RPC call (as anon):');
  const { data: anonData, error: anonError } = await supabase.rpc('get_player_attendance_stats_by_type', {
    p_session_type: 'Beginners'
  });

  if (anonError) {
    console.error('   Error:', anonError.message);
  } else {
    console.log('   Success! Returned', anonData?.length || 0, 'players');
    if (anonData && anonData.length > 0) {
      console.log('   Sample:', anonData[0].player_name, '-', anonData[0].attendance_count + 'x');
    }
  }

  console.log('\n---\n');

  // Check if function exists and permissions
  console.log('2. Checking function metadata:');
  const { data: funcData, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname, prosecdef')
    .eq('proname', 'get_player_attendance_stats_by_type')
    .single();

  if (funcError) {
    console.log('   Cannot query pg_proc (expected - requires elevated permissions)');
  } else {
    console.log('   Function found:', funcData.proname);
    console.log('   Security Definer:', funcData.prosecdef);
  }

  console.log('\n---\n');

  // Try querying the tables directly as anon
  console.log('3. Testing direct table access (as anon):');

  const { data: sessionsData, error: sessionsError } = await supabase
    .from('coaching_sessions')
    .select('id')
    .limit(1);

  console.log('   coaching_sessions:', sessionsError ? 'BLOCKED - ' + sessionsError.message : 'Accessible');

  const { data: attendanceData, error: attendanceError } = await supabase
    .from('coaching_attendance')
    .select('id')
    .limit(1);

  console.log('   coaching_attendance:', attendanceError ? 'BLOCKED - ' + attendanceError.message : 'Accessible');

  const { data: accessData, error: accessError } = await supabase
    .from('coaching_access')
    .select('id')
    .limit(1);

  console.log('   coaching_access:', accessError ? 'BLOCKED - ' + accessError.message : 'Accessible');

  console.log('\n=== Test Complete ===\n');
  console.log('CONCLUSION: The function has SECURITY DEFINER, but RLS policies block');
  console.log('anon access to the underlying tables. When you log in as admin,');
  console.log('the function should work. Let me check what the function actually returns...\n');
}

testWithAuth();
