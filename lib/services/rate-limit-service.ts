import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export class RateLimitExceededError extends Error {
  constructor(message = 'Rate limit exceeded. Please try again later.') {
    super(message)
    this.name = 'RateLimitExceededError'
  }
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

/**
 * Checks if a given identifier and action has exceeded the rate limit.
 * If exceeded, throws a RateLimitExceededError.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_action: action,
    p_max_requests: config.maxRequests,
    p_window_seconds: Math.floor(config.windowMs / 1000)
  })

  if (error) {
    console.error('Rate limit RPC error:', error)
    // Fail open or closed? Usually fail closed or throw generic error, but for resilience fail open is sometimes preferred.
    // Given security nature, we'll throw an error so it fails closed.
    throw new Error('Internal error checking rate limits')
  }

  if (data === false) {
    throw new RateLimitExceededError()
  }

  return true
}

/**
 * Helper to get the client IP address from request headers.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = headersList.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'unknown'
}
