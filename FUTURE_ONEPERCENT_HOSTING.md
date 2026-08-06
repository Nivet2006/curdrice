# Standalone Hosting Guide: The One Percent Club Website

This guide details all 3 methods to extract and host **only** the **One Percent Club website (`/c/onepercent`)** as a separate, standalone site on Vercel or any other hosting provider while preserving the main `Curdrice` / `Club Eve` codebase intact.

---

## Option 1: Standalone Micro Next.js App Folder (Recommended for Independent Deployment)

Create a lightweight subfolder (e.g. `onepercent-site/`) or a dedicated Git repository that extracts only the showcase page and its dependencies.

### Key Advantages:
- Completely decoupled from the main platform.
- Zero database latency if using static fallback data.
- Instant, lightweight build times on Vercel.

### Implementation Steps:
1. **Directory Structure**:
   ```text
   onepercent-site/
   ├── app/
   │   ├── layout.tsx (Includes OnePercentSplash)
   │   ├── page.tsx (Renders PublicShowcaseClient with static/DB data)
   │   └── globals.css (Tailwind & custom animation styles)
   ├── components/
   │   └── showcase/ (ShowcaseHeroSection, ShowcaseNavbar, ShowcaseContactSection, etc.)
   ├── public/ (Logos and brand assets)
   ├── package.json
   └── tailwind.config.ts
   ```
2. **Vercel Settings**:
   - Create a new project on Vercel linked to the repository.
   - Set **Root Directory** to `onepercent-site`.
   - Vercel automatically deploys to `onepercent.vercel.app` or your custom domain.

---

## Option 2: Vercel Domain / Subdomain Rewrite (Zero Code Duplication)

Keep everything in the existing codebase and use Vercel's edge routing to map a standalone domain directly to the `/c/onepercent` route.

### Key Advantages:
- **No code copying or extra maintenance**: Any updates made to showcase components automatically reflect on the standalone domain.
- Uses existing database connection and live dynamic data.

### Implementation Steps:
1. In `next.config.mjs`, add domain rewrites:
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     async rewrites() {
       return [
         {
           source: '/',
           has: [
             {
               type: 'host',
               value: 'onepercentclub.com', // or onepercent.gopalan.edu
             },
           ],
           destination: '/c/onepercent',
         },
       ]
     },
   }
   
   export default nextConfig
   ```
2. In **Vercel Dashboard** → **Project Settings** → **Domains**:
   - Add your domain (`onepercentclub.com` or custom subdomain).
   - Point DNS CNAME to `cname.vercel-dns.com`.

---

## Option 3: Static HTML / CSS Export (SSG / Static Hosting)

Export the fully rendered HTML, CSS, and JS bundle of `/c/onepercent` to a static output directory.

### Key Advantages:
- Can be drag-and-dropped directly into Vercel Static Hosting, Netlify, GitHub Pages, or Apache/Nginx web servers.
- Extremely fast page loads with 100% static asset serving.

### Implementation Steps:
1. Configure Next.js static export in `next.config.mjs`:
   ```javascript
   const nextConfig = {
     output: 'export',
   }
   export default nextConfig
   }
   ```
2. Build static bundle:
   ```bash
   npm run build
   ```
3. The resulting `out/` folder can be copied and hosted anywhere as pure static files.

---

## Current Configuration Quick Reference (The One Percent Club)

- **Slug**: `onepercent`
- **Hero Title**: `THE ONE PERCENT CLUB`
- **Contact Email**: `onepercentclub.admin@gmail.com`
- **Location**: `TBD`
- **Official Website Link**: `TBD`
