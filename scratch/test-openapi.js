require('dotenv').config({ path: '.env.local' });
async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(url);
  const data = await res.json();
  const tables = Object.keys(data.paths).filter(p => p !== '/' && !p.includes('{')).map(p => p.slice(1));
  console.log(tables);
}
run();
