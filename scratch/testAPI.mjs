import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const nextPubUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const nextPubKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)

const supabaseUrl = nextPubUrlMatch[1].trim()
const supabaseKey = nextPubKeyMatch[1].trim()

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, usn')
    .limit(5)
  console.log("PROFILES:", data, error)
  
  if (data && data.length > 0) {
     const res2 = await supabase.from('profiles')
      .select('id, full_name, usn')
      .or(`full_name.ilike.%test%,usn.ilike.%test%`)
      .limit(8)
     console.log("SEARCH RESULTS:", res2.data, res2.error)
  }

  // test conversation members
  const res3 = await supabase.from('conversation_members').select('*').limit(5)
  console.log("CONV MEMBS:", res3.data, res3.error)
  
  // test notifications
  const res4 = await supabase.from('notifications').select('*').limit(5)
  console.log("NOTIFS:", res4.data, res4.error)
}

test()
