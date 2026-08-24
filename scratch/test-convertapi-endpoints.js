require('dotenv').config({ path: '.env.local' });

async function test() {
  const secret = process.env.CONVERTAPI_SECRET;
  console.log('Secret length:', secret ? secret.length : 0);

  // Try different endpoints for ConvertAPI
  const endpoints = [
    `https://v2.convertapi.com/user?Secret=${secret}`,
    `https://v2.convertapi.com/user/info?Secret=${secret}`,
    `https://v2.convertapi.com/user?secret=${secret}`,
    `https://v2.convertapi.com/user/details?Secret=${secret}`,
    `https://v2.convertapi.com/user/seconds?Secret=${secret}`,
    `https://v2.convertapi.com/user/userinfo?Secret=${secret}`,
    `https://v2.convertapi.com/user?token=${secret}`,
    `https://v2.convertapi.com/user/balance?Secret=${secret}`,
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep);
      const text = await res.text();
      console.log(ep, '=> Status:', res.status, 'Body:', text.slice(0, 100));
    } catch (e) {
      console.log(ep, '=> Error:', e.message);
    }
  }

  // Also test converting a 1-byte text/plain to pdf or checking convertapi formats endpoint!
  // Note: GET https://v2.convertapi.com/user or GET https://v2.convertapi.com/info
  try {
    const res = await fetch(`https://v2.convertapi.com/user`, {
      headers: { 'Authorization': `Bearer ${secret}` }
    });
    console.log('Bearer auth => Status:', res.status, 'Body:', (await res.text()).slice(0, 100));
  } catch (e) {}

  // What about GET https://v2.convertapi.com/info?Secret=... or https://v2.convertapi.com/user?token=...
  try {
    const res = await fetch(`https://v2.convertapi.com/info?Secret=${secret}`);
    console.log('GET /info => Status:', res.status, 'Body:', (await res.text()).slice(0, 100));
  } catch (e) {}
}

test();
