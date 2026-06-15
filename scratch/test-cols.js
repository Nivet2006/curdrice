require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabaseAdmin.from('backup_logs').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No data, inserting a dummy row");
    await supabaseAdmin.from('backup_logs').insert({ admin_id: '00000000-0000-0000-0000-000000000000', file_name: 'test' });
    const { data } = await supabaseAdmin.from('backup_logs').select('*').limit(1);
    console.log(Object.keys(data[0]));
  }
}
run();
