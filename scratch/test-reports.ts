import { createClient } from '../lib/supabase/server';

async function test() {
  const supabase = await createClient();
  const { data: allPendingReports, error } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
    .in('status', ['pending_faculty', 'approved_faculty']);
    
  console.log('Error:', error);
  console.log('Reports count:', allPendingReports?.length);
  console.log('Reports:', JSON.stringify(allPendingReports, null, 2));
}

test();
