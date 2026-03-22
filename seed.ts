import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || url.includes('YOUR_SUPABASE')) {
  console.error('\n❌ Error: Please put your real Supabase URL and Service Role Key inside .env.local before running this script!\n')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const testAccounts = [
  { email: 'admin@eventhub.test', password: 'password123', role: 'admin', usn: 'ADMIN001', name: 'Test Admin', dept: 'CSE', sem: 8, year: 4 },
  { email: 'manager@eventhub.test', password: 'password123', role: 'manager', usn: 'MGR001', name: 'Test Manager', dept: 'ISE', sem: 6, year: 3 },
  { email: 'student@eventhub.test', password: 'password123', role: 'student', usn: '1GD24CS888', name: 'Test Student', dept: 'ECE', sem: 4, year: 2 },
]

async function seedAccounts() {
  console.log('Seeding Database with Test Accounts...\n')

  for (const account of testAccounts) {
    // 1. Create the user in Supabase Auth via Admin Client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    })

    if (authError) {
      console.error(`Status [${account.role}]: Failed - ${authError.message}`)
      continue
    }

    if (authData.user) {
      // 2. Insert the corresponding profile with the correct role
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: account.name,
        usn: account.usn,
        department: account.dept,
        semester: account.sem,
        year: account.year,
        role: account.role,
      })

      if (profileError) {
        console.error(`Status [${account.role}]: Failed saving profile - ${profileError.message}`)
      } else {
        console.log(`✅ Success [${account.role}]: ${account.email} | pass: ${account.password}`)
      }
    }
  }
}

seedAccounts()
