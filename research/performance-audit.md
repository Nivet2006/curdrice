# Performance Audit

Worker: Worker 5 — Performance Audit
Scope: rendering, queries, bundle size, caching, scalability
Maximum files: 25
Files reviewed:
- components/student/StudentEventsView.tsx
- components/iic/InteractivePDFViewer.tsx
- components/shared/ImagePreview.tsx
- app/admin/bugs/page.tsx
- package.json
- supabase/migrations/0013_performance_indexes.sql

## Finding 1

### Title
Supabase client is recreated during render and used as an effect dependency

### Severity
High

### Confidence
High

### Evidence
- File path: `components/student/StudentEventsView.tsx`
- Function name: `StudentEventsView`
- Relevant code section: line 34 calls `const supabase = createClient()` in component render; lines 38-92 use `[events, supabase]`; lines 95-138 use `[supabase]`.

### Problem
If `createClient()` returns a new object on each render, effects depending on `supabase` rerun after every state update. The attendance effect sets state with `setAttendees`, which can trigger repeated cleanup/resubscribe/fetch cycles.

### Impact
This can cause unnecessary network requests, duplicate realtime subscription churn, degraded responsiveness, and higher Supabase load as event volume grows.

### Recommendation
Memoize the client or instantiate it outside render through a stable provider/hook.

### Example Fix
```tsx
const supabase = useMemo(() => createClient(), [])
```

## Finding 2

### Title
Attendance counts fetch joined registration rows for every event instead of using aggregate data

### Severity
Medium

### Confidence
High

### Evidence
- File path: `components/student/StudentEventsView.tsx`
- Function name: `fetchAttendance`
- Relevant code section: lines 41-47 query `registrations` with `.select('event_id, profiles(full_name)')` for all visible event ids, then count client-side in lines 50-70.

### Problem
The client downloads registration rows and profile names to calculate counts and first initials. This is inefficient for high-attendance events.

### Impact
As registrations grow, page load and realtime refreshes become more expensive. More profile data than needed is transferred to the browser.

### Recommendation
Use a database view/RPC that returns per-event counts plus limited display initials, protected by RLS, or cache denormalized attendee counts.

### Example Fix
```sql
create view event_attendance_summary as
select event_id, count(*) as total_count
from registrations
group by event_id;
```

## Finding 3

### Title
Heavy PDF, canvas, spreadsheet, and document libraries are present and should be isolated from critical bundles

### Severity
Low

### Confidence
Medium

### Evidence
- File path: `package.json`
- Function name: dependency manifest
- Relevant code section: dependencies include `canvas`, `pdfjs-dist`, `@react-pdf/renderer`, `xlsx`, `exceljs`, `docx`, `html-to-image`, and `chartjs-node-canvas` at lines 18-48.

### Problem
The dependency set includes large rendering and document-processing libraries. Without dynamic imports and server/client boundary checks, these can inflate bundles or complicate deployment.

### Impact
Initial page load, build time, or serverless cold starts may suffer if heavy libraries are imported on common paths.

### Recommendation
Audit imports for these packages and ensure they are loaded lazily only on pages/actions that need them.

### Example Fix
```ts
const { PDFDocument } = await import('pdf-lib')
```
