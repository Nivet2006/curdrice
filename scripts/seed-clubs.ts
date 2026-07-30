import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !serviceKey || url.includes('YOUR_SUPABASE')) {
  console.error('\n❌ Error: Missing valid Supabase credentials in .env.local!\n')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const defaultClubs = [
  {
    name: 'TechEon Robotics Club',
    slug: 'techeon',
    description: 'The premier robotics and hardware innovation club of the campus. Building autonomous drones, battle bots, and IoT systems.',
    category: 'Technology'
  },
  {
    name: 'Grafix Design & Media',
    slug: 'grafix',
    description: 'Creative design, UI/UX, video production, and digital art community empowering student visual creators.',
    category: 'Arts & Media'
  },
  {
    name: 'Winfinity Innovation Lab',
    slug: 'winfinity',
    description: 'Incubator for student startups, hackathons, open-source projects, and entrepreneurial innovation.',
    category: 'Entrepreneurship'
  },
  {
    name: '1% Coding Club',
    slug: '1percent',
    description: 'Competitive programming, web development, cloud computing, and software engineering practice community.',
    category: 'Coding & Tech'
  }
]

async function seedClubs() {
  console.log('🚀 Seeding Campus Clubs...\n')

  for (const clubData of defaultClubs) {
    const { data: existing } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', clubData.slug)
      .single()

    if (!existing) {
      const { data: newClub, error } = await supabase
        .from('clubs')
        .insert({
          name: clubData.name,
          slug: clubData.slug,
          description: clubData.description
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Failed to insert ${clubData.name}:`, error.message)
      } else {
        console.log(`✅ Seeded Club: ${clubData.name} (./c/${clubData.slug})`)

        // Also initialize default showcase config for this club
        if (newClub) {
          await supabase.from('club_showcase_configs').upsert({
            club_id: newClub.id,
            hero_data: {
              title: clubData.name,
              subtitle: clubData.description,
              tagline: `Welcome to the Official ${clubData.name} Showcase Page`,
              ctaPrimaryText: 'Explore Events',
              ctaPrimaryUrl: '#events',
              ctaSecondaryText: 'Contact Us',
              ctaSecondaryUrl: '#contact'
            },
            about_data: {
              mission: `Empowering students to excel in ${clubData.category}.`,
              vision: 'Creating a vibrant hub for student innovation and collaboration.',
              stats: [
                { label: 'Active Members', value: '150+' },
                { label: 'Events Hosted', value: '25+' },
                { label: 'Projects Built', value: '40+' }
              ]
            }
          })
        }
      }
    } else {
      console.log(`ℹ️ Club already exists: ${clubData.name} (./c/${clubData.slug})`)
    }
  }

  console.log('\n🎉 Campus Clubs Seeding Completed!')
}

seedClubs()
