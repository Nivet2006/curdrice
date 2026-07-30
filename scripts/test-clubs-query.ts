import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function checkRLS() {
  console.log('--- Testing Anon Client Query ---')
  const anonClient = createClient(url, anonKey)
  const { data: anonClubs, error: anonError } = await anonClient.from('clubs').select('*')
  console.log('Anon Error:', anonError)
  console.log('Anon Clubs Count:', anonClubs?.length || 0)

  console.log('\n--- Testing Service Role Query ---')
  const serviceClient = createClient(url, serviceKey)
  const { data: serviceClubs, error: serviceError } = await serviceClient.from('clubs').select('*')
  console.log('Service Error:', serviceError)
  console.log('Service Clubs Count:', serviceClubs?.length || 0)
}

checkRLS()
