'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login } from '@/app/(auth)/login/actions'
import { MagicLinkForm } from './magic-link-form'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

export function LoginForm() {
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleLogin(formData: FormData) {
    setServerError(null)
    const result = await login(formData)
    if (result?.error?.form) {
      setServerError(result.error.form[0])
    }
  }

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'password'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setMode('magic-link')}
          className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'magic-link'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Magic Link
        </button>
      </div>

      {mode === 'password' ? (
        <form action={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{serverError}</p>
            </div>
          )}

          <SubmitButton />
        </form>
      ) : (
        <MagicLinkForm />
      )}

      <p className="text-center text-sm text-gray-600 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
