const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'sem8year4@nivet2006.in',
    password: '123456'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  console.log('Logged in as:', authData.user.email);

  const { data: allPendingReports, error: queryError } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
    .in('status', ['pending_faculty', 'approved_faculty']);

  if (queryError) {
    console.error('Query error:', queryError);
    return;
  }

  console.log('All pending reports count:', allPendingReports?.length);
  console.log('Reports details:', allPendingReports);
}

run();
