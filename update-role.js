const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hwpjrkmplydqaxiikupv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTUwNjgsImV4cCI6MjA3MTA5MTA2OH0.6xnC3k_CRChyavAfdJT0I4NLN_Wv1ZgIlRO0Jnqckkk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserRole() {
  console.log('Updating user role...');

  // Update the role
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', 'best.jon@gmail.com')
    .select();

  if (updateError) {
    console.error('Error updating role:', updateError);
    return;
  }

  console.log('Update result:', updateData);

  // Verify the update
  const { data: verifyData, error: verifyError } = await supabase
    .from('profiles')
    .select('id, name, email, role, status')
    .eq('email', 'best.jon@gmail.com');

  if (verifyError) {
    console.error('Error verifying update:', verifyError);
    return;
  }

  console.log('\nVerification - User profile:');
  console.log(JSON.stringify(verifyData, null, 2));
}

updateUserRole();
