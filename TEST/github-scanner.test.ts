import { describe, it, expect, vi } from 'vitest'

vi.mock('react', () => ({
  cache: (fn: any) => fn
}))

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {}
  })
}))

import {
  parseRepoUrl,
  scanForSecrets,
  computeJaroWinkler,
  computeCosineSimilarity,
  parseArchitecture
} from '../lib/services/github-scanner'

describe('GitHub Scanner Service Tests', () => {
  describe('parseRepoUrl', () => {
    it('should parse standard HTTPS GitHub URLs', () => {
      const result = parseRepoUrl('https://github.com/facebook/react')
      expect(result).toEqual({ owner: 'facebook', repo: 'react' })
    })

    it('should handle trailing slashes', () => {
      const result = parseRepoUrl('https://github.com/facebook/react/')
      expect(result).toEqual({ owner: 'facebook', repo: 'react' })
    })

    it('should handle .git extension', () => {
      const result = parseRepoUrl('https://github.com/facebook/react.git')
      expect(result).toEqual({ owner: 'facebook', repo: 'react' })
    })

    it('should return null for invalid URLs', () => {
      const result = parseRepoUrl('https://google.com/facebook/react')
      expect(result).toBeNull()
    })
  })

  describe('scanForSecrets', () => {
    it('should detect AWS Access Keys', () => {
      const text = 'AWS_KEY=AKIAIOSFODNN7EXAMPLE'
      const warnings = scanForSecrets(text)
      expect(warnings).toContain('Detected potential AWS Access Key ID')
    })

    it('should detect Supabase Tokens', () => {
      const text = 'SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.1234567890'
      const warnings = scanForSecrets(text)
      expect(warnings).toContain('Detected potential Supabase Token / JWT')
    })

    it('should detect Database URI connections', () => {
      const text = 'DATABASE_URL=postgresql://user:pass@localhost:5432/mydb'
      const warnings = scanForSecrets(text)
      expect(warnings).toContain('Detected potential Database Connection URI (Postgres/Mongo)')
    })

    it('should return empty array for clean texts', () => {
      const text = 'This is a clean file with no secrets.'
      const warnings = scanForSecrets(text)
      expect(warnings).toHaveLength(0)
    })
  })

  describe('computeJaroWinkler', () => {
    it('should return 1.0 for identical strings', () => {
      expect(computeJaroWinkler('hello', 'hello')).toBe(1.0)
    })

    it('should return 0.0 for completely different strings', () => {
      expect(computeJaroWinkler('abc', 'xyz')).toBe(0.0)
    })

    it('should return high similarity for slight differences', () => {
      const score = computeJaroWinkler('martha', 'marhta')
      expect(score).toBeGreaterThan(0.9)
    })
  })

  describe('computeCosineSimilarity', () => {
    it('should return 1.0 for identical texts', () => {
      const text = 'The quick brown fox jumps over the lazy dog'
      expect(computeCosineSimilarity(text, text)).toBeCloseTo(1.0)
    })

    it('should return 0.0 for completely disjoint texts', () => {
      expect(computeCosineSimilarity('apple banana', 'orange grape')).toBe(0.0)
    })

    it('should return intermediate similarity for partial overlap', () => {
      const sim = computeCosineSimilarity('react nextjs tailwind', 'react nextjs prisma')
      expect(sim).toBeCloseTo(0.67, 1)
    })
  })

  describe('parseArchitecture', () => {
    it('should detect Next.js and Prisma stacks', () => {
      const files = ['package.json', 'prisma/schema.prisma', 'app/layout.tsx']
      const pkgJson = { dependencies: { next: '^14.0.0', react: '^18.0.0' } }
      const arch = parseArchitecture(files, pkgJson)

      expect(arch.frontend).toBe('Next.js')
      expect(arch.database).toBe('Prisma (SQL)')
      expect(arch.diagram).toContain('Frontend(Next.js)')
      expect(arch.diagram).toContain('Database(Prisma (SQL))')
    })

    it('should fallback to default stack heuristics if package.json is missing', () => {
      const files = ['requirements.txt', 'supabase/migrations/0001_init.sql']
      const arch = parseArchitecture(files, null, 'fastapi==0.100.0')

      expect(arch.backend).toBe('FastAPI (Python)')
      expect(arch.database).toBe('Supabase')
    })
  })
})
