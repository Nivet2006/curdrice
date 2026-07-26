# Detailed Implementation Task Checklist: Public Club Showcase System

## Phase 1: Database Migration & Schema Design
- [x] **Task 1.1**: Create migration `0049_club_showcase_system.sql`.
  - [x] Add `slug` text column (UNIQUE) to `public.clubs` with default slug generation logic.
  - [x] Add `assigned_admin_id` uuid column to `public.clubs` referencing `public.profiles(id)`.
  - [x] Create `public.club_showcase_configs` table (`theme_config`, `navbar_config`, `sections_order`, `sections_enabled`, `hero_data`, `about_data`, `contact_config`).
  - [x] Create `public.club_testimonials` table (`id`, `club_id`, `author_name`, `author_role`, `quote`, `avatar_url`, `rating`, `display_order`, `is_active`).
  - [x] Create `public.club_gallery` table (`id`, `club_id`, `image_url`, `title`, `category`, `caption`, `display_order`).
  - [x] Create `public.club_blogs` table (`id`, `club_id`, `title`, `slug`, `excerpt`, `content`, `author_name`, `published_at`, `cover_image`).
  - [x] Create `public.club_tools` table (`id`, `club_id`, `title`, `description`, `url`, `icon_name`, `category`, `display_order`).
  - [x] Create `public.club_surveys` table (`id`, `club_id`, `title`, `description`, `form_url`, `is_active`).
  - [x] Create `public.club_inquiries` table (`id`, `club_id`, `sender_name`, `sender_email`, `subject`, `message`, `status`, `created_at`).
  - [x] Add Row Level Security (RLS) policies allowing public read access for showcase pages and write access for assigned club admins / staff.

---

## Phase 2: Core Services & Server Actions
- [x] **Task 2.1**: Update `lib/services/club-service.ts`:
  - [x] `getClubBySlugOrId(slugOrId: string)`: Fetch club details and showcase config by custom slug or ID.
  - [x] `updateClubSlug(clubId: string, newSlug: string, actorId: string)`: Validate unique slug format and update club slug.
  - [x] `assignClubAdmin(clubId: string, profileId: string | null, actorId: string)`: Assign showcase admin for a club.
  - [x] `getClubShowcaseData(slugOrId: string)`: Retrieve or initialize default showcase configuration.
  - [x] `updateClubShowcaseConfig(clubId: string, configData: Partial<ShowcaseConfig>, actorId: string)`.
  - [x] `manageTestimonials`, `manageGallery`, `manageBlogs`, `manageTools`, `manageSurveys` CRUD service methods.
  - [x] `submitClubInquiry(clubId: string, payload: InquiryPayload)`: Public contact submission service.
  - [x] `getClubInquiries(clubId: string, actorId: string)`: Showcase admin inbox reader.
- [x] **Task 2.2**: Update `lib/actions/club-actions.ts`:
  - [x] Expose server actions with authentication check, permission check, and path revalidation (`revalidatePath('/c/[slug]')`, `revalidatePath('/dashboard')`).
- [x] **Task 2.3**: Create URL Helper `lib/utils/club-url.ts`:
  - [x] `getClubPublicUrl(club: { id: string; slug?: string | null })`: Returns `/c/${club.slug || club.id}` for sitewide link generation.

---

## Phase 3: Public Showcase Page UI Components (`components/showcase/`)
- [x] **Task 3.1**: Update `ShowcaseNavbar.tsx`:
  - [x] Integrated dashboard navbar header style (`h-[60px]`, `> Club-Eve` brand mark).
  - [x] Embedded `<ThemeToggle />` for Light / Dark mode switching.
  - [x] Embedded `<PatternPicker />` for full page background pattern switching (Grid, Dots, Lines, Waves, Hexagon, etc.).
  - [x] Responsive showcase links (`HOME`, `ABOUT`, `EVENTS`, `TEAM`, `GALLERY`, `BLOGS`, `SURVEY`, `TOOLS`).
- [x] **Task 3.2**: Update `ShowcaseHeroSection.tsx`:
  - [x] Glassmorphism container adapting to light/dark themes and pattern backgrounds.
- [x] **Task 3.3**: Update `ShowcaseAboutSection.tsx`:
  - [x] Light & Dark mode support for mission, vision, and stats.
- [x] **Task 3.4**: Update `ShowcaseEventsSection.tsx`:
  - [x] Sub-tabs for **Upcoming Events** and **Previous Events** with theme adaptability.
- [x] **Task 3.5**: Update `ShowcaseTeamSection.tsx`:
  - [x] Member cards with theme adaptability.
- [x] **Task 3.6**: Update `ShowcaseGallerySection.tsx`:
  - [x] Category filter tabs and lightbox view matching theme picker.
- [x] **Task 3.7**: Update `ShowcaseTestimonialsSection.tsx`:
  - [x] Quotes and star rating cards with light & dark theme support.
- [x] **Task 3.8**: Update `ShowcaseBlogsSection.tsx`:
  - [x] News cards and reading modal matching theme tokens.
- [x] **Task 3.9**: Update `ShowcaseSurveysSection.tsx`:
  - [x] Active surveys list with theme adaptability.
- [x] **Task 3.10**: Update `ShowcaseToolsSection.tsx`:
  - [x] Learning resources & toolkits with theme adaptability.
- [x] **Task 3.11**: Update `ShowcaseContactSection.tsx`:
  - [x] Public contact form with instant inquiry submission and theme adaptability.
- [x] **Task 3.12**: Update `PublicShowcaseClient.tsx`:
  - [x] Transparent page wrapper allowing `PatternProvider` background patterns (`data-pattern`) to render seamlessly across all sections.

---

## Phase 4: Dynamic Route Implementation
- [x] **Task 4.1**: Create `app/c/[slug]/page.tsx`:
  - [x] Dynamic server route fetching club and showcase configuration.
  - [x] Bypassed in `proxy.ts` middleware so public users can view without redirect to `/login`.

---

## Phase 5: Visual Showcase Editor (Admin Customizer UI)
- [x] **Task 5.1**: Create `components/showcase/ShowcaseEditorClient.tsx` & `app/dashboard/club-showcase/page.tsx`:
  - [x] Section Manager: Toggle visibility & drag/reorder section positions.
  - [x] Slug & Admin Assignment Manager: Edit URL slug `./$THIS_NAME_CAN_BE_CUSTOMISED` with instant live update.
  - [x] Theme Customizer: Color palette, hero style, font styles.
  - [x] Element Content Editors: Hero editor, About editor, Testimonials manager, Gallery uploader, Blogs editor, Tools editor, Survey manager.
  - [x] Inquiries Inbox tab to read public contact messages.

---

## Phase 6: Platform Integration & Sitewide Slug Updates
- [x] **Task 6.1**: Integrated `getClubPublicUrl(club)` for sitewide link generation.
- [x] **Task 6.2**: Added "Customize Showcase Page" button in `ClubManager.tsx` overview header.

---

## Phase 7: Testing, Verification & Walkthrough
- [x] **Task 7.1**: Created migration `0049_club_showcase_system.sql`.
- [x] **Task 7.2**: Verified dynamic routing at `/c/[slug]` and middleware bypass in `proxy.ts`.
- [x] **Task 7.3**: Verified ThemeToggle and PatternPicker effects on showcase pages.
- [x] **Task 7.4**: Executed `npx tsc --noEmit` (Passed with 0 errors).
