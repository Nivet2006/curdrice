const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Harini Sem8
  const userId = '81406034-a484-4ce5-b63d-0d96520e6f8c';

  const { data: profile } = await supabase.from('profiles').select('full_name, department').eq('id', userId).single();
  const dept = profile?.department || 'General';
  console.log('Profile:', profile);
  console.log('dept:', dept);

  const { data: allPendingReports, error } = await supabase
    .from('iic_event_reports')
    .select('*, events(title, club_name, event_date, location, assigned_faculty_id, event_category)')
    .in('status', ['pending_faculty', 'approved_faculty']);

  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }

  console.log('All reports count:', allPendingReports?.length);
  const pendingIICReports = allPendingReports?.filter(r => {
    const isDeptMatch = r.department === dept;
    const isFacultyMatch = r.events?.assigned_faculty_id === userId;
    console.log(`Report id=${r.id}: r.department="${r.department}" vs dept="${dept}" (Match: ${isDeptMatch}), assigned_faculty_id="${r.events?.assigned_faculty_id}" vs user="${userId}" (Match: ${isFacultyMatch})`);
    return isDeptMatch || isFacultyMatch;
  }) || [];

  console.log('Filtered reports count:', pendingIICReports.length);
}

run();
