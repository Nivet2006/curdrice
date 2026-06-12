const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: allPendingReports, error } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
    .in('status', ['pending_faculty', 'approved_faculty']);

  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }

  console.log('Count of pending/approved faculty reports:', allPendingReports?.length);
  console.log('Reports:', allPendingReports);
}

run();
