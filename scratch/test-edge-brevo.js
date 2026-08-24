require('dotenv').config({ path: '.env.local' });

async function testEdgeBrevo() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Testing Edge Function Brevo integration...');
  const functionUrl = `${supabaseUrl}/functions/v1/process-email-queue?action=get-senders`;
  const response = await fetch(functionUrl, {
    headers: {
      'Authorization': `Bearer ${serviceKey}`
    }
  });

  console.log('Response Status:', response.status);
  if (response.ok) {
    const data = await response.json();
    console.log('Brevo Senders returned count:', Array.isArray(data.senders) ? data.senders.length : 0);
    console.log('Edge Function Brevo Verification: PASSED!');
  } else {
    console.log('Edge Function Brevo Verification: FAILED', await response.text());
  }
}

testEdgeBrevo();
