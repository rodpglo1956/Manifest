'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, magicLinkSchema } from '@/schemas/auth'

export async function login(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      error: {
        form: [error.message],
      },
    }
  }

  redirect('/dashboard')
}

export async function sendMagicLink(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
  }

  const parsed = magicLinkSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      error: {
        form: parsed.error.issues.map((i) => i.message),
      },
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
  })

  if (error) {
    return {
      error: {
        form: [error.message],
      },
    }
  }

  return {
    success: 'Check your email for a login link',
  }
}
