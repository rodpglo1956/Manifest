# Technology Stack

**Project:** Manifest - All-in-One Logistics Operations Platform
**Researched:** 2026-03-24
**Overall confidence:** HIGH

---

## Important Version Note

The PRD specifies Next.js 15. As of March 2026, **Next.js 16.2.1** is the latest stable release (shipped October 2025). However, **start with Next.js 15.x (latest patch)** because:

1. Next.js 16 renames `middleware.ts` to `proxy.ts` and removes the Edge Runtime from it — this affects auth patterns with Supabase SSR
2. Next.js 16 fully removes synchronous request API access (cookies, headers) — requires auditing all server components
3. The Supabase SSR package (`@supabase/ssr`) is tested against Next.js 15; Next.js 16 compatibility may have edge cases
4. PPR (Partial Prerendering) behavior changed between 15 and 16 — if you adopt PPR later, you want the stable 15 behavior first

**Recommendation:** Ship on Next.js 15.x. Migrate to 16 after Phase 1 is stable and Supabase SSR has documented 16 support. This is a low-risk upgrade when the time comes.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.x (latest patch) | Full-stack React framework | App Router, Server Components, Server Actions, API routes, route groups for three modes. Locked per PRD. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15. Server Components, Suspense, useOptimistic for dispatch updates. | HIGH |
| TypeScript | 5.x | Type safety | Non-negotiable for a multi-module app of this size. Catches org_id/RLS bugs at compile time. | HIGH |

### Backend / Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase (platform) | Latest | PostgreSQL + Auth + Realtime + Edge Functions + Storage + pg_cron | Single backend platform. Reduces ops to one vendor. RLS for multi-tenant isolation. Locked per PRD. | HIGH |
| @supabase/supabase-js | ^2.99.x | Client SDK | Isomorphic client for browser and server. Handles auth, queries, realtime subscriptions, storage uploads. | HIGH |
| @supabase/ssr | ^0.9.x | Server-side auth | Cookie-based auth for Next.js App Router. Replaces deprecated auth-helpers. Required for middleware auth checks. | HIGH |

### Payments

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Stripe Connect | Platform mode | SaaS billing, subscriptions | Supports carrier orgs as Connected Accounts. Handles subscriptions + usage billing + invoicing. Locked per PRD. | HIGH |
| stripe (Node SDK) | ^17.x | Server-side Stripe API | Webhook handling, checkout session creation, portal sessions. Use only in API routes, never client-side. | HIGH |

### AI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Claude API | Latest | Marie AI operations assistant | Runs on Railway. Stateless queries with DB context. Locked per PRD. | HIGH |
| Anthropic SDK (@anthropic-ai/sdk) | ^0.39.x | Claude API client | TypeScript SDK for Claude API calls from the Railway service. | HIGH |
| Vapi | Latest | Voice interface for Marie | Per-minute pricing. Locked per PRD. | MEDIUM |

### Styling & UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | Fast iteration, design system enforcement via config. Locked per PRD. | HIGH |
| Motion (framer-motion) | ^12.x | Animations | Rebranded from "Framer Motion" to "Motion". Import from `motion/react`. Page transitions, dispatch board interactions, toast animations. Listed in cursorrules. | HIGH |
| Recharts | ^3.8.x | Data visualization | React + D3 chart library. Tree-shakeable (import only LineChart, BarChart, etc.). Locked per PRD. | HIGH |
| Lucide React | ^0.47.x | Icon system | Consistent, tree-shakeable icon set. Locked per PRD. | HIGH |

---

## Supporting Libraries (Research-Validated)

These are the specific libraries needed for the capabilities the PRD requires but does not name.

### Forms & Validation

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| react-hook-form | ^7.72.x | Form state management | Uncontrolled components = minimal re-renders. 12KB gzipped. Works with Server Actions. Industry standard for Next.js forms. The load creation form has 30+ fields — RHF handles this without performance issues. | HIGH |
| @hookform/resolvers | ^5.x | Schema resolver bridge | Connects react-hook-form to Zod schemas. One line: `resolver: zodResolver(loadSchema)`. | HIGH |
| zod | ^4.3.x | Schema validation | TypeScript-first validation. Share schemas between client forms, Server Actions, and API routes. Single source of truth for load, driver, invoice, compliance data shapes. | HIGH |

### PDF Generation

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| @react-pdf/renderer | ^4.3.x | Invoice and report PDF generation | React component-based PDF creation. Build invoice templates as React components with branded styling. Works server-side in API routes for batch report generation. 860K+ weekly downloads, actively maintained. | HIGH |

**Why not jsPDF:** jsPDF is imperative (doc.text(x, y, "string")) which makes branded multi-page invoices painful. @react-pdf/renderer lets you write JSX that maps to PDF layout — much better DX for the invoice and report templates this app needs.

**Why not pdfmake:** JSON-based layout is fine for simple docs but awkward for the branded, component-driven invoice templates Manifest needs. React-pdf fits the React mental model.

### Maps & Routing

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| react-map-gl | ^8.x | React wrapper for map rendering | Created by Uber's visualization team. Supports both Mapbox GL and MapLibre GL as backends. Handles markers, popups, route polylines for dispatch board map view. | HIGH |
| maplibre-gl | ^5.x | Map rendering engine | Free, open-source (BSD-3). No per-tile API fees. Use with free tile providers (OpenFreeMap, MapTiler free tier, or self-hosted PMTiles). Avoids Mapbox's usage-based pricing which can spike with many dispatch sessions. | HIGH |

**Why MapLibre over Mapbox:** Cost. Mapbox charges per map load and per tile request. A dispatch board with 10+ dispatchers viewing maps all day will rack up charges fast. MapLibre is free forever. Use OpenFreeMap or MapTiler (free tier: 100K tiles/month) for tiles.

**Why not Google Maps:** Expensive, heavy SDK, poor React integration. MapLibre + react-map-gl is the standard for logistics/fleet dashboards.

**Tile provider recommendation:** Start with [MapTiler free tier](https://www.maptiler.com/) (100K requests/month free, styled vector tiles). Upgrade to their paid plan or self-host PMTiles if you exceed the limit. OpenFreeMap is fully free but has less polish.

### Offline PWA & Service Workers

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| serwist | ^9.5.x | Service worker toolkit | Successor to next-pwa. Built on Workbox. Actively maintained, designed for Next.js App Router. Official Next.js docs reference it. Handles precaching, runtime caching strategies, background sync. | HIGH |
| @serwist/next | ^9.5.x | Next.js integration for Serwist | Provides the Next.js plugin config, generates the SW entry point, handles dev/prod differences. | HIGH |
| idb-keyval | ^6.x | IndexedDB key-value store | ~600 bytes. Promise-based. For offline caching of active load data, vehicle info, pending form submissions. PRD-04 explicitly names this library. | HIGH |

**Why not next-pwa:** Unmaintained for 2+ years. Does not support App Router properly. Serwist is the community-accepted successor.

**Background Sync strategy:** Use Serwist's BackgroundSyncPlugin for offline form submissions (DVIR inspections, fuel logs, status updates). Queue mutations in IndexedDB via idb-keyval, replay when online. The Background Sync API handles this natively in supported browsers.

### File Uploads

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| react-dropzone | ^14.x | Drag-and-drop file upload | 5M+ weekly downloads. Headless hook-based API (useDropzone). Pairs with react-hook-form for the load document upload flow. Handles camera capture on mobile via accept attributes. | HIGH |

**Upload flow:** react-dropzone captures the file -> preview it -> upload to Supabase Storage via `supabase.storage.from('documents').upload()` -> store the URL in the load/invoice record. No separate upload service needed.

**Why not UploadThing:** Adds a third-party managed service. Supabase Storage already handles file uploads with RLS-scoped buckets. No reason to add another vendor.

### Data Fetching & State

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| @tanstack/react-query | ^5.x | Server state management | Stale-while-revalidate caching, background refetching, optimistic updates for dispatch actions. PRD-04 explicitly recommends this. Pairs with Supabase: use `.throwOnError()` on Supabase queries so TanStack Query catches errors properly. | HIGH |
| @tanstack/react-virtual | ^3.13.x | List virtualization | Headless virtualizer for large datasets: load history, driver roster, activity feeds, compliance item lists. 10-15KB. PRD-04 specifies virtualized lists. | HIGH |

**TanStack Query + Supabase Realtime pattern:** Use TanStack Query as primary state layer. Subscribe to Supabase Realtime channels. On realtime event, call `queryClient.invalidateQueries()` to trigger a refetch. This gives you both caching AND live updates.

### Date Handling

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| date-fns | ^4.x | Date formatting and manipulation | Tree-shakeable (only import what you use). Functional API works well with TypeScript. Handles pickup/delivery date formatting, overdue invoice calculations, compliance expiration date math. Larger than Day.js but better tree-shaking means similar effective bundle size. | HIGH |

**Why not Day.js:** Day.js has a smaller base bundle (2KB vs 12-40KB for date-fns), but date-fns tree-shakes to only what you import. For a project this size, you will use many date functions — date-fns' functional API and TypeScript support win.

### Security

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| isomorphic-dompurify | ^2.x | HTML sanitization | Works on both server and client (uses jsdom on server). For sanitizing any user-provided text that gets rendered (notes fields, broker names, etc.). PRD-04 specifies DOMPurify. | HIGH |

### Notifications

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Web Push API | Browser native | Push notifications for Driver PWA | No library needed. Use `navigator.serviceWorker.ready` + `PushManager.subscribe()`. Serwist handles the SW side. VAPID keys stored in Supabase Vault. | HIGH |
| Resend | API | Email notifications | Already in GloMatrix infrastructure per PRD-04. REST API for transactional emails (invoice sent, compliance alert, trial ending). | MEDIUM |

### Drag-and-Drop (Dispatch Board)

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| @dnd-kit/core | ^6.x | Drag-and-drop for dispatch board | Accessible, performant drag-and-drop. For the dispatch board's drag-driver-to-load assignment flow. Headless, works with any styling approach. | HIGH |
| @dnd-kit/sortable | ^10.x | Sortable lists | For kanban-style load board view (drag loads between status columns). | HIGH |

**Why not react-beautiful-dnd:** Deprecated by Atlassian. @dnd-kit is the standard replacement, actively maintained, better accessibility.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15.x | Next.js 16.x | Middleware renaming + Supabase SSR compatibility concerns. Upgrade after Phase 1. |
| Maps | MapLibre + react-map-gl | Mapbox GL | Per-request pricing. Dispatch board = high usage = high cost. |
| Maps | MapLibre + react-map-gl | Google Maps | Expensive, heavy, poor React DX. |
| PDF | @react-pdf/renderer | jsPDF | Imperative API, painful for branded multi-page invoices. |
| PDF | @react-pdf/renderer | pdfmake | JSON layout less natural than JSX for React devs. |
| Forms | react-hook-form | Formik | Heavier, more re-renders, less active maintenance. |
| PWA | Serwist | next-pwa | Unmaintained 2+ years. No App Router support. |
| PWA | Serwist | next-pwa-pack | Too new, small community. Serwist is the established successor. |
| Upload | react-dropzone | UploadThing | Adds unnecessary vendor. Supabase Storage handles uploads. |
| DnD | @dnd-kit | react-beautiful-dnd | Deprecated by Atlassian. |
| Dates | date-fns | Day.js | Less TypeScript support, plugin-based API is less ergonomic. |
| Dates | date-fns | Moment.js | Deprecated. 300KB+ bundle. |
| Validation | Zod 4 | Yup | Less TypeScript inference. Zod's `z.infer<>` is unmatched. |
| State | TanStack Query | SWR | Less feature-rich. TanStack Query has better mutation support, optimistic updates, devtools. |

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| n8n | Explicitly banned per PRD. All automation via Supabase Edge Functions + pg_cron. |
| Prisma | Supabase client SDK handles queries directly. Adding an ORM adds complexity and breaks RLS (Prisma uses a connection pool that bypasses RLS). |
| tRPC | Over-engineering. API routes with Zod validation + Supabase client are sufficient. |
| NextAuth / Auth.js | Supabase Auth is the auth layer. Adding NextAuth creates auth state conflicts. |
| Redux / Zustand | TanStack Query handles server state. For minimal client state (UI toggles, modal state), use React context or useState. No global state library needed. |
| Chakra UI / shadcn/ui | Custom design system per PRD. Tailwind + custom components. No component library — build to the design system spec. |
| Puppeteer/Playwright for PDF | Server-side browser rendering is heavy, slow, expensive on Railway/Vercel. @react-pdf/renderer is purpose-built for PDF generation. |
| Socket.io | Supabase Realtime handles websockets. Adding Socket.io duplicates functionality. |

---

## Installation

```bash
# Core framework
npm install next@15 react@19 react-dom@19

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Styling & UI
npm install tailwindcss framer-motion recharts lucide-react

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# Data fetching & state
npm install @tanstack/react-query @tanstack/react-virtual

# Maps
npm install react-map-gl maplibre-gl

# PDF generation
npm install @react-pdf/renderer

# File uploads
npm install react-dropzone

# PWA / Service workers
npm install serwist @serwist/next

# Offline storage
npm install idb-keyval

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable

# Dates
npm install date-fns

# Security
npm install isomorphic-dompurify

# Payments
npm install stripe

# AI
npm install @anthropic-ai/sdk

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @tanstack/react-query-devtools
```

---

## Version Pinning Strategy

Pin major versions with caret (`^`) in package.json. Use a lockfile (package-lock.json or pnpm-lock.yaml). Key version constraints:

- **Next.js:** Pin to `^15` until explicit migration to 16
- **Supabase JS:** Pin to `^2` (v3 will be a major migration)
- **Zod:** Pin to `^4` (breaking changes from v3)
- **react-hook-form:** Pin to `^7` (v8 is still in beta)
- **Serwist:** Pin to `^9`
- **Recharts:** Pin to `^3`

---

## Sources

- [Next.js 15 vs 16 comparison](https://www.descope.com/blog/post/nextjs15-vs-nextjs16) - Next.js version decision
- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - Official migration docs
- [Serwist Next.js integration](https://serwist.pages.dev/docs/next/getting-started) - PWA setup for App Router
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) - Official PWA docs referencing Serwist
- [TanStack Query + Supabase integration](https://makerkit.dev/blog/saas/supabase-react-query) - Pattern for combining the two
- [Supabase SSR package](https://www.npmjs.com/package/@supabase/ssr) - v0.9.x docs
- [react-hook-form + Zod guide](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1) - 2026 integration patterns
- [PDF library comparison](https://dev.to/ansonch/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025-13g0) - @react-pdf/renderer selection rationale
- [MapLibre GL JS](https://maplibre.org/) - Open-source map rendering
- [react-map-gl docs](https://visgl.github.io/react-map-gl/docs) - React wrapper for MapLibre/Mapbox
- [Best file upload libraries for React 2026](https://www.pkgpulse.com/blog/best-file-upload-libraries-react-2026) - react-dropzone validation
- [Best JavaScript date libraries 2026](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026) - date-fns vs Day.js comparison
- [isomorphic-dompurify npm](https://www.npmjs.com/package/isomorphic-dompurify) - Server/client sanitization
- [@tanstack/react-virtual](https://tanstack.com/virtual/latest) - List virtualization
- [Serwist PWA with Next.js](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7) - next-pwa successor rationale
