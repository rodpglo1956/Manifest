// SERVER ONLY -- never import in client components
// Admin Supabase client using service role key for privileged operations
// such as inviting users via auth.admin.inviteUserByEmail()
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let _admin: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}

// Backwards-compatible export (lazy getter)
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdmin(), prop, receiver)
  },
})
