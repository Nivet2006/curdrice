require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const logsClient = createClient(process.env.LOGS_SUPABASE_URL, process.env.LOGS_SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await logsClient.storage.from('iic-reports').list('032A-WE51B');
  console.log("Bucket data inside 032A-WE51B:", data);
  console.log("Error:", error);
}
run();
