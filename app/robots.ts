import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/cc/', '/hod/', '/pr/', '/student/', '/teacher/'],
    },
    sitemap: 'https://club-eve.vercel.app/sitemap.xml',
  }
}
