'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inviteSchema, type InviteInput } from '@/schemas/invite'
import { inviteTeamMember } from '@/app/(app)/settings/team/actions'
import { useState } from 'react'

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to all features and settings',
  dispatcher: 'Can manage loads, dispatch, and view reports',
  driver: 'Mobile access to assigned loads and status updates',
  viewer: 'Read-only access to dashboards and reports',
}

export function InviteForm() {
  const [serverMessage, setServerMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
  })

  async function onSubmit(data: InviteInput) {
    setSubmitting(true)
    setServerMessage(null)

    const formData = new FormData()
    formData.set('email', data.email)
    formData.set('role', data.role)

    const result = await inviteTeamMember(formData)

    if (result?.error) {
      setServerMessage({ type: 'error', text: result.error })
    } else {
      setServerMessage({
        type: 'success',
        text: `Invitation sent to ${data.email}`,
      })
      reset()
    }

    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Invite Team Member
      </h3>

      {serverMessage && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            serverMessage.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {serverMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="invite-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="colleague@company.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="invite-role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role
          </label>
          <select
            id="invite-role"
            {...register('role')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="">Select a role...</option>
            {Object.entries(roleDescriptions).map(([role, desc]) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)} - {desc}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Sending...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  )
}
