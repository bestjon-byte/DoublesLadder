const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hwpjrkmplydqaxiikupv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTUwNjgsImV4cCI6MjA3MTA5MTA2OH0.6xnC3k_CRChyavAfdJT0I4NLN_Wv1ZgIlRO0Jnqckkk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryUser() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('email', 'best.jon@gmail.com')
      .single();

    if (error) {
      console.error('Error querying user:', error);
      process.exit(1);
    }

    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Exception:', err);
    process.exit(1);
  }
}

queryUser();
