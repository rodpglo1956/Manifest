# Phase 1: Auth & Organization - Research

**Researched:** 2026-03-24
**Domain:** Supabase Auth SSR + Next.js 15 App Router + Multi-tenant RLS
**Confidence:** HIGH

## Summary

Phase 1 establishes the authentication, organization, and authorization foundation that every subsequent phase builds on. The core stack is Next.js 15 App Router with Supabase Auth via the `@supabase/ssr` package, which replaces the deprecated `@supabase/auth-helpers-nextjs`. The SSR package provides `createBrowserClient` and `createServerClient` utilities that handle cookie-based session management across server components, client components, API routes, and middleware.

The RLS foundation uses the `(select auth.uid())` pattern (not bare `auth.uid()`) for a documented 95% performance improvement. A custom `auth.org_id()` helper function will be created to centralize the org lookup subquery, preventing copy-paste errors across dozens of future RLS policies. The invitation flow uses Supabase's `auth.admin.inviteUserByEmail()` with metadata to pass the target org and role, combined with a database trigger that auto-creates profile records on signup.

**Primary recommendation:** Build the Supabase client utilities, middleware, and RLS foundation first (Wave 0/1), then layer auth UI, org creation, invitation flow, and role-based routing on top.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Supabase Auth handles all authentication -- email/password primary, magic link secondary
- Database trigger creates `profiles` record linked to `auth.uid()` on signup
- Session management via Supabase's built-in session handling (access + refresh tokens)
- Login redirects to correct mode based on `profile.role`: admin/dispatcher -> Command, driver -> Driver PWA, viewer -> Command (read-only)
- Owner-Operator mode auto-detected based on org tier and user count (single-user admin = owner-operator)
- On signup, user is prompted to create org OR join existing via invitation
- Org creation collects: company name, address, phone, email, DOT number (optional), MC number (optional), company_type ('dot_carrier', 'non_dot_carrier', 'both')
- Admin generates invitation with target role assignment
- Invitation sent via email with a link to join the org
- Invited user creates account -> automatically linked to org with assigned role
- `org_members` table tracks membership with role and join date
- Four roles: admin, dispatcher, driver, viewer
- Role stored in `profiles.role` and enforced via RLS policies AND API middleware
- Use `(select auth.uid())` pattern (not bare `auth.uid()`) for RLS performance
- Create `auth.org_id()` helper function to avoid inline subqueries in every policy
- Index `org_id` on every table for RLS performance
- RLS on organizations, profiles, org_members from day one
- Policy naming convention: descriptive names like `users_own_profile`, `org_profiles`, `org_members_access`
- Next.js App Router route groups: `(auth)` for login/signup, `(app)` for Command mode, `(driver)` for Driver PWA, `(marketing)` for public pages
- Middleware checks session validity and role on every request to protected routes
- Follow PRD-01 schema exactly for organizations, profiles, org_members tables
- All columns snake_case, uuid PKs with gen_random_uuid(), timestamptz for all timestamps
- Status columns use text type with documented enum values in comments
- Design system: white default theme, #EC008C primary color, 15px Inter body font, 8px spacing grid
- JetBrains Mono for DOT numbers, MC numbers on org setup forms
- Product name always capitalized "Manifest". Company name "Glo Matrix LLC"

### Claude's Discretion
- Exact Supabase client configuration (SSR vs client-side patterns)
- Error message wording for auth flows
- Loading states during auth operations
- Form validation approach for signup/org creation
- Exact middleware implementation pattern for Next.js 15 App Router

### Deferred Ideas (OUT OF SCOPE)
- OAuth providers (Google, GitHub) -- v2 requirement
- 2FA -- v2 requirement
- Password reset flow -- standard Supabase Auth feature, not in current requirements
- User avatar upload -- depends on Supabase Storage setup, handled later
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Supabase `signUp()` + createBrowserClient pattern, signup form with Zod validation |
| AUTH-02 | User can log in and stay logged in across sessions | Supabase session handling with cookie-based SSR, middleware token refresh via `getClaims()` |
| AUTH-03 | User can log in via magic link as alternative to password | Supabase `signInWithOtp()` -- magic link enabled by default, 60s rate limit, 1h expiry |
| AUTH-04 | Database trigger creates profile record on signup | PL/pgSQL trigger function on `auth.users` INSERT with `security definer` |
| AUTH-05 | User can create a new organization with company details | Org creation form + server action/API route inserting into `organizations` + `org_members` + updating `profiles.org_id` |
| AUTH-06 | Admin can invite users to join their organization with role assignment | `auth.admin.inviteUserByEmail()` with `data` metadata containing org_id and role |
| AUTH-07 | Invited users can join an existing organization via invitation link | Invite callback route processes token, trigger creates profile, metadata links to org |
| AUTH-08 | Role-based access enforced: admin, dispatcher, driver, viewer | RLS policies + middleware role checks + route group isolation |
| AUTH-09 | Middleware redirects users to correct mode based on role | Next.js middleware reads profile role, redirects to `/(app)`, `/(driver)`, or owner-operator view |
| AUTH-10 | RLS policy on organizations, profiles, and org_members tables with org_id isolation | `auth.org_id()` helper + `(select auth.uid())` pattern + indexes on org_id |
</phase_requirements>

## Standard Stack

### Core (Phase 1 Only)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.x (latest patch) | Full-stack React framework | App Router, Server Components, Server Actions, route groups. Locked per PRD. Stay on 15 -- Next.js 16 renames middleware to proxy and changes Supabase SSR compatibility. |
| react / react-dom | ^19.x | UI library | Ships with Next.js 15. |
| typescript | ^5.x | Type safety | Non-negotiable for multi-module app. |
| @supabase/supabase-js | ^2.99.x | Client SDK | Isomorphic client for auth, queries, realtime. |
| @supabase/ssr | ^0.9.x | Server-side auth | Cookie-based auth for Next.js App Router. Replaces deprecated auth-helpers. |
| tailwindcss | ^4.x | Utility-first CSS | CSS-first configuration via `@theme` directive. No tailwind.config.js needed in v4. |
| zod | ^4.3.x | Schema validation | Shared validation between forms, server actions, and API routes. |
| react-hook-form | ^7.72.x | Form state management | Uncontrolled components for signup/login/org-creation forms. |
| @hookform/resolvers | ^5.x | Schema resolver bridge | Connects react-hook-form to Zod schemas. |
| lucide-react | ^0.47.x | Icon system | Tree-shakeable icons. Locked per PRD. |

### Supporting (Phase 1 Only)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.x | Date formatting | Format `joined_at`, `created_at` timestamps in UI |

### Not Needed in Phase 1
- Motion/Framer Motion -- no animations needed yet
- Recharts -- no charts yet
- TanStack Query -- server components handle data fetching for Phase 1
- react-dropzone -- no file uploads in Phase 1 auth flows
- Maps, DnD, PDF -- later phases

**Installation (Phase 1):**
```bash
npx create-next-app@15 manifest --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd manifest
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers lucide-react date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── callback/route.ts          # Auth callback handler
│   │   └── layout.tsx                 # Centered auth layout
│   ├── (app)/                         # Command mode (admin, dispatcher, viewer)
│   │   ├── dashboard/page.tsx
│   │   ├── settings/
│   │   │   └── team/page.tsx          # Invitation management
│   │   └── layout.tsx                 # Sidebar + header layout
│   ├── (driver)/                      # Driver PWA mode
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   ├── (marketing)/                   # Public pages
│   │   └── page.tsx
│   ├── layout.tsx                     # Root layout (fonts, metadata)
│   └── middleware.ts                  # Auth + role routing
├── lib/
│   └── supabase/
│       ├── client.ts                  # createBrowserClient utility
│       ├── server.ts                  # createServerClient utility
│       └── middleware.ts              # updateSession helper
├── components/
│   ├── ui/                            # Design system primitives
│   └── auth/                          # Auth-specific components
├── types/
│   └── database.ts                    # Supabase generated types
└── schemas/
    ├── auth.ts                        # Zod schemas for auth forms
    └── organization.ts                # Zod schemas for org creation
supabase/
├── migrations/
│   ├── 00001_organizations.sql
│   ├── 00002_profiles.sql
│   ├── 00003_org_members.sql
│   ├── 00004_rls_policies.sql
│   ├── 00005_auth_trigger.sql
│   └── 00006_auth_helpers.sql         # auth.org_id() function
└── seed.sql                           # Test data for two orgs
```

### Pattern 1: Supabase Browser Client (Singleton)
**What:** Client-side Supabase instance for auth operations in Client Components.
**When to use:** Login forms, signup forms, any client-side auth interaction.
```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 2: Supabase Server Client (Per-Request)
**What:** Server-side Supabase instance with cookie access for Server Components, Server Actions, and API routes.
**When to use:** Any server-side data fetching or mutation that needs auth context.
```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Can be ignored in Server Components where cookies are read-only
          }
        },
      },
    }
  )
}
```

### Pattern 3: Middleware Session Refresh
**What:** Middleware refreshes expired auth tokens on every request, passing updated cookies to both server and browser.
**When to use:** Always runs -- this is the session refresh mechanism.
**Critical:** Use `getClaims()` not `getUser()` in middleware. `getClaims()` validates JWT locally using cached JWKS (no network request for asymmetric keys). `getUser()` makes a network request to Supabase Auth on every middleware invocation.
```typescript
// src/lib/supabase/middleware.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session -- getClaims validates JWT locally (fast)
  const { data: { claims }, error } = await supabase.auth.getClaims()

  return { supabase, supabaseResponse, claims, error }
}
```

### Pattern 4: Role-Based Middleware Routing
**What:** After session refresh, check user role and redirect to correct mode.
**When to use:** The main middleware.ts file.
```typescript
// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, claims, error } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Public routes -- no auth needed
  if (pathname.startsWith('/(marketing)') || pathname === '/') {
    return supabaseResponse
  }

  // Auth routes -- redirect to app if already logged in
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (claims && !error) {
      // Fetch profile to determine redirect target
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, org_id')
        .eq('id', claims.sub)
        .single()

      if (profile?.org_id) {
        const target = profile.role === 'driver' ? '/driver/dashboard' : '/dashboard'
        return NextResponse.redirect(new URL(target, request.url))
      }
      // No org -- send to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return supabaseResponse
  }

  // Protected routes -- require auth
  if (!claims || error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based routing enforcement
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', claims.sub)
    .single()

  if (!profile?.org_id) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Driver trying to access Command mode -> redirect to Driver PWA
  if (profile.role === 'driver' && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/driver/dashboard', request.url))
  }

  // Non-driver trying to access Driver PWA -> redirect to Command
  if (profile.role !== 'driver' && pathname.startsWith('/driver')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Pattern 5: Auth Callback Route
**What:** Handles the redirect after email confirmation, magic link click, or invitation acceptance.
**When to use:** Required for any email-based auth flow.
```typescript
// src/app/(auth)/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth error -- redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

### Pattern 6: The auth.org_id() Helper Function
**What:** Custom PostgreSQL function in the `auth` schema that returns the current user's org_id. Cached per-statement when wrapped in `(select ...)`.
**When to use:** Every RLS policy that needs org isolation.
```sql
-- supabase/migrations/00006_auth_helpers.sql
-- Custom helper: returns the org_id for the currently authenticated user
-- Wrap in (select auth.org_id()) in RLS policies for initPlan caching
create or replace function auth.org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id from public.profiles where id = auth.uid()
$$;
```

### Pattern 7: RLS Policies with Performance Optimization
**What:** Use `(select auth.org_id())` in all org-scoped policies.
**Why:** The `(select ...)` wrapper triggers PostgreSQL's initPlan optimization, caching the result per-statement instead of evaluating per-row. Documented 95% improvement.
```sql
-- supabase/migrations/00004_rls_policies.sql

-- Organizations: users can only see/modify their own org
create policy "org_access" on organizations
  for all using (id = (select auth.org_id()));

-- Profiles: users can see all profiles in their org
create policy "org_profiles" on profiles
  for select using (org_id = (select auth.org_id()));

-- Profiles: users can update their own profile
create policy "users_own_profile" on profiles
  for update using (id = (select auth.uid()));

-- Org members: users can see members in their org
create policy "org_members_select" on org_members
  for select using (org_id = (select auth.org_id()));

-- Org members: only admins can insert/update/delete members
create policy "org_members_admin_manage" on org_members
  for all using (
    org_id = (select auth.org_id())
    and exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );
```

### Pattern 8: Profile Trigger on Signup
**What:** Auto-creates a profiles record when a new auth.users row is inserted.
**Critical:** Use `security definer` so the trigger can write to `profiles` even though the user doesn't have RLS access yet. Set `search_path = ''` to prevent search path injection.
```sql
-- supabase/migrations/00005_auth_trigger.sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'viewer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Pattern 9: Invitation Flow
**What:** Admin invites user -> Supabase sends email -> user clicks link -> account created with metadata -> trigger creates profile -> callback route links to org.
**Implementation approach:**
```typescript
// Server Action or API route (requires service role key)
// Source: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inviteUser(email: string, orgId: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        org_id: orgId,
        role: role,
        invited: true,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
    }
  )
  if (!error) {
    // Also create org_members record (pending until user accepts)
    await supabaseAdmin.from('org_members').insert({
      org_id: orgId,
      user_id: data.user.id,
      role: role,
    })
  }
  return { data, error }
}
```

**Trigger modification for invitations:** The profile trigger should check `raw_user_meta_data` for `org_id` and `role` passed via invitation metadata, and auto-populate `profiles.org_id` and `profiles.role` accordingly.

### Pattern 10: Tailwind CSS v4 Theme Configuration
**What:** Define design tokens via CSS `@theme` directive. No tailwind.config.js needed in v4.
```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --color-primary: #EC008C;
  --color-primary-hover: #D4007E;
  --color-primary-light: #FFF0F7;

  --radius-sm: 4px;
  --radius-md: 6px;   /* buttons */
  --radius-lg: 10px;  /* cards */
  --radius-xl: 12px;  /* max allowed */

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);  /* max allowed */

  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
}
```

### Anti-Patterns to Avoid
- **Using `auth.uid()` without `(select ...)` wrapper:** Causes function to evaluate per-row instead of per-statement. 95% performance penalty on large tables.
- **Using `getSession()` or `getUser()` in middleware:** `getSession()` is unsafe (trusts JWT without validation). `getUser()` makes a network request on every middleware invocation. Use `getClaims()` which validates JWT locally via cached JWKS.
- **Creating Supabase admin client in client components:** The service role key must NEVER be exposed to the browser. Admin operations (invitations) must use server actions or API routes.
- **Bare subqueries in RLS policies:** `(select org_id from profiles where id = auth.uid())` repeated in every policy. Use `auth.org_id()` helper instead.
- **Using `security invoker` for auth triggers:** The trigger runs before the user has RLS access to the profiles table. Must use `security definer`.
- **Forgetting `set search_path = ''` on security definer functions:** Without this, a malicious user could manipulate the search path to redirect the function to a different table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT handling, cookie management | `@supabase/ssr` middleware pattern | Token refresh, cookie chunking, expiry handling are complex edge cases |
| Email sending for invitations | Custom SMTP integration | `supabase.auth.admin.inviteUserByEmail()` | Handles token generation, email template, verification link |
| Magic link flow | Custom OTP/token system | `supabase.auth.signInWithOtp()` | Rate limiting, expiry, security built in |
| Password hashing | bcrypt/argon2 implementation | Supabase Auth | Supabase uses bcrypt internally with proper salt handling |
| Form validation | Manual if/else validation | Zod schemas + react-hook-form + @hookform/resolvers | Type inference, reusable schemas, consistent error messages |
| Auth callback handling | Manual token exchange | Auth callback route with `exchangeCodeForSession()` | Handles PKCE flow, code exchange, session establishment |

**Key insight:** Supabase Auth handles the entire auth lifecycle. The application code should focus on: (1) wrapping Supabase client calls in the correct utility patterns, (2) setting up RLS policies, and (3) building the UI forms. Do not build custom auth middleware or session stores.

## Common Pitfalls

### Pitfall 1: Middleware Profile Query on Every Request
**What goes wrong:** Querying the profiles table in middleware to check role causes a database round-trip on every single request, including static assets.
**Why it happens:** Need to check role for routing decisions.
**How to avoid:** Use the middleware matcher to skip static assets. Cache profile data in a short-lived cookie or use JWT custom claims (via Supabase Custom Access Token Hook) to embed role and org_id directly in the JWT. For Phase 1, the profile query approach is acceptable with proper matcher configuration -- optimize with custom claims if performance becomes an issue.
**Warning signs:** Slow page loads, high database connection count.

### Pitfall 2: Trigger Failure Blocks Signup
**What goes wrong:** If the `handle_new_user()` trigger function throws an error (constraint violation, null reference, etc.), the entire auth.users INSERT is rolled back and the user cannot sign up.
**Why it happens:** The trigger runs in the same transaction as the auth.users INSERT.
**How to avoid:** Use `coalesce()` for all nullable fields. Test the trigger thoroughly with edge cases (no metadata, empty strings, missing fields). Keep the trigger simple -- just INSERT the minimal profile record.
**Warning signs:** Users report "something went wrong" on signup with no auth.users record created.

### Pitfall 3: RLS Policy Ordering and Conflicts
**What goes wrong:** A user creates an org but then cannot see their own profile because the `org_profiles` policy requires `org_id` to match, and the profile's `org_id` hasn't been set yet.
**Why it happens:** Race condition between creating the org and updating the profile's org_id.
**How to avoid:** The `users_own_profile` policy (using `id = auth.uid()`) must exist as a separate SELECT policy so users can always read/update their own profile regardless of org_id. The org creation flow should be: (1) INSERT org, (2) UPDATE profiles SET org_id, (3) INSERT org_members -- all in a single transaction or server action.
**Warning signs:** "No rows returned" errors immediately after signup.

### Pitfall 4: Missing Auth Callback Route
**What goes wrong:** Magic link and invitation emails redirect to the app but the session is never established because there is no route to exchange the auth code for a session.
**Why it happens:** Supabase email links contain a `code` parameter that must be exchanged server-side via `exchangeCodeForSession()`.
**How to avoid:** Always create the `/auth/callback/route.ts` handler. Configure it as an allowed redirect URL in Supabase dashboard. Test both magic link and invitation email flows.
**Warning signs:** Users click email links and land on login page instead of being authenticated.

### Pitfall 5: Cookie Size Limits with Supabase SSR
**What goes wrong:** Supabase session cookies can exceed the 4KB browser cookie limit when JWT claims are large.
**Why it happens:** The `@supabase/ssr` package stores the full session in cookies.
**How to avoid:** The `@supabase/ssr` package automatically handles cookie chunking (splits across multiple cookies). Do not manually set cookies -- let the `setAll()` callback handle it. Do not add excessive custom claims to the JWT.
**Warning signs:** Auth works in development but fails in production, intermittent session loss.

### Pitfall 6: Supabase Email Rate Limits
**What goes wrong:** Built-in Supabase email service has a hard limit of 3 emails per hour. Invitation flow breaks when admin tries to invite multiple team members.
**Why it happens:** Development/free tier uses built-in email service.
**How to avoid:** Configure custom SMTP early (Resend, SendGrid, or similar). In Supabase dashboard: Authentication -> Providers -> Email -> Enable Custom SMTP. Also increase rate limit in Authentication -> Rate Limits.
**Warning signs:** Invitations silently fail after the first few, no error returned.

## Code Examples

### Signup Form with Organization Creation
```typescript
// src/app/(auth)/signup/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signupSchema } from '@/schemas/auth'

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  })

  if (error) {
    return { error: { form: [error.message] } }
  }

  redirect('/onboarding')
}
```

### Zod Schema for Organization Creation
```typescript
// src/schemas/organization.ts
import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  address_line1: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().max(2).optional(),
  address_zip: z.string().max(10).optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  dot_number: z.string().max(20).optional().or(z.literal('')),
  mc_number: z.string().max(20).optional().or(z.literal('')),
  company_type: z.enum(['dot_carrier', 'non_dot_carrier', 'both']),
})

export type OrganizationInput = z.infer<typeof organizationSchema>
```

### Organization Creation Server Action
```typescript
// src/app/(auth)/onboarding/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { organizationSchema } from '@/schemas/organization'

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = organizationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Create org, update profile, create membership -- in sequence
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert(parsed.data)
    .select('id')
    .single()

  if (orgError) return { error: { form: [orgError.message] } }

  // Update profile with org_id and admin role
  await supabase
    .from('profiles')
    .update({ org_id: org.id, role: 'admin' })
    .eq('id', user.id)

  // Create org_members record
  await supabase
    .from('org_members')
    .insert({ org_id: org.id, user_id: user.id, role: 'admin' })

  redirect('/dashboard')
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers deprecated. SSR package is the only supported path. |
| `supabase.auth.getSession()` in server code | `supabase.auth.getClaims()` | Late 2025 | `getSession()` trusts JWT without validation. `getClaims()` validates locally via JWKS. |
| `supabase.auth.getUser()` in middleware | `supabase.auth.getClaims()` | Late 2025 | `getUser()` makes network request per invocation. `getClaims()` validates locally (faster). |
| `tailwind.config.js` with JavaScript | CSS `@theme` directive | Tailwind v4 (2025) | No config file needed. Design tokens defined in CSS. |
| `auth.uid()` in RLS | `(select auth.uid())` in RLS | Always recommended | 95% performance improvement via initPlan caching. |
| Manual cookie management | `@supabase/ssr` cookie handlers | 2024 | Automatic cookie chunking, refresh token handling. |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Fully deprecated. Use `@supabase/ssr`.
- `supabase.auth.getSession()` in server code: Unsafe. Use `getClaims()`.
- `tailwind.config.js`: Not needed in Tailwind v4. Use `@theme` in CSS.

## Open Questions

1. **Custom Access Token Hook for Role/Org in JWT**
   - What we know: Supabase supports Custom Access Token Hooks that can embed custom claims (like role and org_id) directly into the JWT, eliminating the need for profile queries in middleware.
   - What's unclear: Whether this is available on the free tier, exact implementation complexity, and whether it introduces risks if role/org changes mid-session (stale JWT claims).
   - Recommendation: Start with profile query in middleware (simpler, always fresh data). Optimize with Custom Access Token Hook only if middleware latency becomes a measured problem.

2. **Invitation Email Template Customization**
   - What we know: Supabase provides default invitation email templates. They can be customized in the dashboard or via local development config.
   - What's unclear: Exact template variable access for organization name in the invite email.
   - Recommendation: Customize the invitation email template to include the org name and role. Use `{{ .Data.org_name }}` or similar template variables from the metadata passed to `inviteUserByEmail()`.

3. **Owner-Operator Auto-Detection Timing**
   - What we know: Owner-Operator mode is auto-detected when the org has a single admin user and is on a specific tier.
   - What's unclear: Billing tiers don't exist in Phase 1, so the tier check cannot be implemented yet.
   - Recommendation: For Phase 1, detect Owner-Operator as: `role === 'admin' AND org member count === 1`. Add tier check when billing is implemented in Phase 10.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Signup with email/password creates user | integration | `npx vitest run tests/auth/signup.test.ts -t "signup" --reporter=verbose` | No -- Wave 0 |
| AUTH-02 | Session persists across page loads | integration | `npx vitest run tests/auth/session.test.ts -t "session" --reporter=verbose` | No -- Wave 0 |
| AUTH-03 | Magic link sends OTP email | integration | `npx vitest run tests/auth/magic-link.test.ts --reporter=verbose` | No -- Wave 0 |
| AUTH-04 | Trigger creates profile on signup | unit (SQL) | `supabase db test` or manual SQL verification | No -- Wave 0 |
| AUTH-05 | Org creation with all fields | unit | `npx vitest run tests/org/create.test.ts --reporter=verbose` | No -- Wave 0 |
| AUTH-06 | Admin can generate invitation | integration | `npx vitest run tests/auth/invite.test.ts -t "invite" --reporter=verbose` | No -- Wave 0 |
| AUTH-07 | Invited user joins org | integration | `npx vitest run tests/auth/invite.test.ts -t "accept" --reporter=verbose` | No -- Wave 0 |
| AUTH-08 | Role enforcement in RLS | unit (SQL) | `supabase db test` or policy verification script | No -- Wave 0 |
| AUTH-09 | Middleware redirects by role | unit | `npx vitest run tests/middleware/routing.test.ts --reporter=verbose` | No -- Wave 0 |
| AUTH-10 | RLS isolates org data | integration (SQL) | `supabase db test` or cross-org isolation test | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- framework configuration
- [ ] `tests/setup.ts` -- test setup with Supabase test client
- [ ] `tests/auth/signup.test.ts` -- AUTH-01
- [ ] `tests/auth/session.test.ts` -- AUTH-02
- [ ] `tests/auth/magic-link.test.ts` -- AUTH-03
- [ ] `tests/org/create.test.ts` -- AUTH-05
- [ ] `tests/auth/invite.test.ts` -- AUTH-06, AUTH-07
- [ ] `tests/middleware/routing.test.ts` -- AUTH-09
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom` -- no test framework detected
- [ ] SQL-level tests for AUTH-04, AUTH-08, AUTH-10 may require Supabase CLI `supabase db test` or pgTAP

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Next.js Setup](https://supabase.com/docs/guides/auth/server-side/nextjs) -- createServerClient, createBrowserClient, middleware, callback route patterns
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- `(select auth.uid())` pattern, 95% improvement benchmark, index recommendations
- [Supabase Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data) -- trigger function for profile creation on signup
- [Supabase inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) -- invitation API with data/metadata options
- [Supabase getClaims()](https://supabase.com/docs/reference/javascript/auth-getclaims) -- JWT validation method, replaces getUser() in middleware
- [Supabase Magic Link](https://supabase.com/docs/guides/auth/passwordless-login/auth-magic-link) -- signInWithOtp(), 60s rate limit, 1h expiry
- [Tailwind CSS v4 Theme](https://tailwindcss.com/docs/theme) -- @theme directive, CSS-first design tokens

### Secondary (MEDIUM confidence)
- [Supabase RLS Best Practices (MakerKit)](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) -- multi-tenant RLS patterns verified against official docs
- [Supabase RLS Performance Discussion #14576](https://github.com/orgs/supabase/discussions/14576) -- community validation of performance patterns
- [Next.js + Supabase Auth Guide (Medium)](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1) -- SSR auth workflow patterns

### Tertiary (LOW confidence)
- [getClaims vs getUser Issue #40985](https://github.com/supabase/supabase/issues/40985) -- documentation is actively being updated on getClaims usage; some guides still reference getUser. Verify current Supabase docs at implementation time.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified in official docs, versions confirmed
- Architecture: HIGH -- patterns sourced from official Supabase Next.js guide
- Supabase SSR patterns: HIGH -- directly from official docs, verified code examples
- RLS performance: HIGH -- documented benchmarks from Supabase, well-established pattern
- auth.org_id() helper: MEDIUM -- custom function, not in official docs, but follows established patterns for security definer functions
- Middleware routing: MEDIUM -- pattern assembled from official examples, getClaims() documentation still being updated
- Invitation flow: MEDIUM -- inviteUserByEmail API confirmed, but metadata-to-profile linking is custom logic
- Pitfalls: HIGH -- drawn from official troubleshooting guides and community discussions

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable ecosystem, 30-day window)
