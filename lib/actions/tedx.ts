import { supabase } from '@/lib/supabase/client'

export interface TedxPortfolio {
  id: string
  profile_id?: string | null
  slug: string
  display_name: string
  role: string
  team_name?: string
  year?: number
  is_active: boolean
  is_public: boolean
  profile_photo_url?: string | null
  bio?: string | null
  social_links?: Record<string, string>
  portfolio_data?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export async function getTedxPortfolios(): Promise<TedxPortfolio[]> {
  const { data, error } = await supabase
    .from('tedx_portfolios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching TEDx portfolios:', error)
    return []
  }
  return data || []
}

export async function getTedxPortfolioBySlug(slug: string): Promise<TedxPortfolio | null> {
  const { data, error } = await supabase
    .from('tedx_portfolios')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error(`Error fetching TEDx portfolio for slug "${slug}":`, error)
    return null
  }
  return data
}

export async function createTedxPortfolio(input: Partial<TedxPortfolio>): Promise<{ data: TedxPortfolio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tedx_portfolios')
    .insert([input])
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }
  return { data, error: null }
}

export async function updateTedxPortfolio(id: string, input: Partial<TedxPortfolio>): Promise<{ data: TedxPortfolio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('tedx_portfolios')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }
  return { data, error: null }
}
