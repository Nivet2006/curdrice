/**
 * Minimal HMAC-SHA256 signing utility for server-only use.
 * Used to create and verify short-lived pending TOTP challenge cookies
 * so the verify-login route does not have to trust a client-supplied userId.
 */

const ALGO = 'SHA-256'
const ENC = new TextEncoder()

function getSecret(): string {
  const secret = process.env.TOTP_CHALLENGE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing TOTP_CHALLENGE_SECRET or SUPABASE_SERVICE_ROLE_KEY env var')
  return secret
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    ENC.encode(secret),
    { name: 'HMAC', hash: ALGO },
    false,
    ['sign', 'verify']
  )
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Create a signed pending-challenge token: "userId.expiresAt.signature" */
export async function signTotpChallenge(userId: string, ttlSeconds = 300): Promise<string> {
  const expiresAt = Date.now() + ttlSeconds * 1000
  const payload = `${userId}.${expiresAt}`
  const key = await hmacKey(getSecret())
  const sig = await crypto.subtle.sign('HMAC', key, ENC.encode(payload))
  return `${payload}.${bufToHex(sig)}`
}

/** Verify a pending-challenge token. Returns userId if valid, null otherwise. */
export async function verifyTotpChallenge(token: string): Promise<string | null> {
  try {
    const parts = token.split('.')
    // format: userId . expiresAt . hexSig  (userId itself cannot contain dots)
    if (parts.length < 3) return null
    const hexSig = parts[parts.length - 1]
    const expiresAt = parseInt(parts[parts.length - 2], 10)
    const userId = parts.slice(0, parts.length - 2).join('.')

    if (!userId || isNaN(expiresAt) || Date.now() > expiresAt) return null

    const payload = `${userId}.${expiresAt}`
    const key = await hmacKey(getSecret())

    // Constant-time verify
    const sigBytes = Uint8Array.from(hexSig.match(/.{2}/g)!.map(h => parseInt(h, 16)))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, ENC.encode(payload))
    return valid ? userId : null
  } catch {
    return null
  }
}
