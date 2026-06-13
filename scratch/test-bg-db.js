const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  // We use supabase service role key or admin key to bypass RLS for testing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Let's use supabase admin client or service role key if available, otherwise anon key if it allows select
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const customBgJson = JSON.stringify({
    type: 'preset',
    presetKey: 'sunset',
    textColor: 'light',
    glassmorphism: true
  });

  console.log('Inserting test event with custom background...');
  
  const testEventId = '99999999-9999-9999-9999-999999999999';
  
  // Clean up any previous test run
  await supabase.from('events').delete().eq('id', testEventId);

  // Insert dummy event
  const { data, error } = await supabase.from('events').insert({
    id: testEventId,
    title: 'Test Custom Background Event',
    description: 'This is a test event to verify custom backgrounds',
    club_name: 'Test Club',
    location: 'Test Location',
    event_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    registration_deadline: new Date(Date.now() + 43200000).toISOString(),
    status: 'upcoming',
    approval_status: 'approved',
    is_public: true,
    banner_url: 'https://example.com/banner.jpg',
    custom_background: customBgJson
  }).select('id, custom_background').single();

  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }

  console.log('Successfully inserted event with ID:', data.id);
  console.log('Retrieved custom_background field:', data.custom_background);

  // Assert match
  if (data.custom_background === customBgJson) {
    console.log('SUCCESS: Database successfully persisted and retrieved custom background configuration!');
  } else {
    console.error('ERROR: Persisted background does not match expected JSON!');
    process.exit(1);
  }

  // Cleanup
  console.log('Cleaning up test event...');
  await supabase.from('events').delete().eq('id', testEventId);
  console.log('Done!');
}

run();
