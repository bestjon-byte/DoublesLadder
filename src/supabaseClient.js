import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hwpjrkmplydqaxiikupv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cGpya21wbHlkcWF4aWlrdXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MTUwNjgsImV4cCI6MjA3MTA5MTA2OH0.6xnC3k_CRChyavAfdJT0I4NLN_Wv1ZgIlRO0Jnqckkk'

export const supabase = createClient(supabaseUrl, supabaseKey)