require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('--- Testing Brevo ---');
  const brevoKey = process.env.BREVO_API_KEY;
  console.log('process.env.BREVO_API_KEY present:', Boolean(brevoKey), 'length:', brevoKey ? brevoKey.length : 0);

  if (brevoKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'accept': 'application/json', 'api-key': brevoKey }
      });
      console.log('Direct Brevo /v3/account status:', res.status);
      if (!res.ok) {
        const text = await res.text();
        console.log('Direct Brevo response body:', text);
      }
    } catch (e) {
      console.log('Direct Brevo error:', e.message);
    }
  }

  // Test Supabase Edge Function process-email-queue?action=get-senders
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    try {
      const functionUrl = `${supabaseUrl}/functions/v1/process-email-queue?action=get-senders`;
      const edgeRes = await fetch(functionUrl, {
        headers: { 'Authorization': `Bearer ${serviceKey}` }
      });
      console.log('Edge Function process-email-queue?action=get-senders status:', edgeRes.status);
      if (edgeRes.ok) {
        const data = await edgeRes.json();
        console.log('Edge Function senders count:', Array.isArray(data.senders) ? data.senders.length : typeof data);
      } else {
        const text = await edgeRes.text();
        console.log('Edge Function error body:', text);
      }
    } catch (e) {
      console.log('Edge Function fetch error:', e.message);
    }
  }

  console.log('--- Testing ConvertAPI ---');
  const convertSecret = process.env.CONVERTAPI_SECRET;
  console.log('process.env.CONVERTAPI_SECRET present:', Boolean(convertSecret), 'length:', convertSecret ? convertSecret.length : 0);

  if (convertSecret) {
    try {
      const res1 = await fetch(`https://v2.convertapi.com/user?Secret=${convertSecret}`);
      console.log('ConvertAPI GET /user?Secret=... status:', res1.status);
      if (!res1.ok) {
        console.log('ConvertAPI /user body:', await res1.text());
      }
    } catch (e) {
      console.log('ConvertAPI /user error:', e.message);
    }

    try {
      const res2 = await fetch(`https://v2.convertapi.com/user/info?Secret=${convertSecret}`);
      console.log('ConvertAPI GET /user/info?Secret=... status:', res2.status);
    } catch (e) {}

    try {
      const res3 = await fetch(`https://v2.convertapi.com/user`, {
        headers: { 'Authorization': `Bearer ${convertSecret}` }
      });
      console.log('ConvertAPI GET /user Authorization Bearer status:', res3.status);
    } catch (e) {}
  }
}

test();
