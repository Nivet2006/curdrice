/**
 * Dynamic URL generator for club public showcase pages.
 * Prefers the custom slug if set, otherwise falls back to the club ID.
 */
export function getClubPublicUrl(club: { id: string; slug?: string | null }): string {
  if (!club) return '/c'
  const target = club.slug && club.slug.trim() ? club.slug.trim() : club.id
  return `/c/${target}`
}
