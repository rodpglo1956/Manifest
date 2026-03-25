import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteForm } from '@/components/auth/invite-form'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Team | Manifest',
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-pink-100 text-pink-700',
  dispatcher: 'bg-blue-100 text-blue-700',
  driver: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) {
    redirect('/onboarding')
  }

  // Non-admin sees permission error
  if (profile.role !== 'admin') {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Team Members
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <p className="text-gray-500">
            You don&apos;t have permission to manage team members. Please
            contact your admin.
          </p>
        </div>
      </div>
    )
  }

  // Fetch org members with profile info
  const { data: members } = await supabase
    .from('org_members')
    .select('id, role, joined_at, user_id')
    .eq('org_id', profile.org_id)
    .order('joined_at', { ascending: true })

  // Fetch profile details for each member
  const memberIds = (members ?? []).map((m) => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', memberIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
        <p className="text-gray-500 mt-1">
          {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}{' '}
          in your organization
        </p>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Role
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => {
                const memberProfile = profileMap.get(member.user_id)
                const badgeColor =
                  roleBadgeColors[member.role] ?? 'bg-gray-100 text-gray-600'
                return (
                  <tr
                    key={member.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-3 px-4 text-gray-900">
                      {memberProfile?.full_name ?? 'Unknown'}
                      {member.user_id === user.id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${badgeColor}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                )
              })}
              {(!members || members.length === 0) && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 px-4 text-center text-gray-400"
                  >
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite form */}
      <InviteForm />
    </div>
  )
}
