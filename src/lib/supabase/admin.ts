// SERVER ONLY -- never import in client components
// Admin Supabase client using service role key for privileged operations
// such as inviting users via auth.admin.inviteUserByEmail()
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
