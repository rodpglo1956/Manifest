'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Star, Mail, Phone } from 'lucide-react'
import { contactSchema, type ContactInput } from '@/lib/crm/schemas'
import { createContact, updateContact } from '@/app/(app)/crm/actions'
import type { CrmContact } from '@/types/database'

interface ContactListProps {
  contacts: CrmContact[]
  companyId: string
  showAddForm: boolean
}

export function ContactList({ contacts, companyId, showAddForm }: ContactListProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Contacts ({contacts.length})
        </h3>
        <button
          onClick={() => {
            const url = showAddForm
              ? `/crm/companies/${companyId}?tab=contacts`
              : `/crm/companies/${companyId}?tab=contacts&addContact=true`
            router.push(url)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </button>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <ContactInlineForm
          companyId={companyId}
          onDone={() => router.push(`/crm/companies/${companyId}?tab=contacts`)}
        />
      )}

      {/* Contact Cards */}
      {contacts.length === 0 && !showAddForm ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 text-sm">
          No contacts yet. Add a contact to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id}>
              {editingId === contact.id ? (
                <ContactInlineForm
                  companyId={companyId}
                  contact={contact}
                  onDone={() => {
                    setEditingId(null)
                    router.refresh()
                  }}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </span>
                        {contact.is_primary && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                            <Star className="w-3 h-3" /> Primary
                          </span>
                        )}
                      </div>
                      {contact.title && (
                        <span className="text-xs text-gray-500">{contact.title}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary">
                        <Mail className="w-3.5 h-3.5" /> {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary">
                        <Phone className="w-3.5 h-3.5" /> {contact.phone}
                      </a>
                    )}
                    <div className="flex items-center gap-1">
                      {!contact.is_primary && (
                        <SetPrimaryButton contactId={contact.id} companyId={companyId} />
                      )}
                      <button
                        onClick={() => setEditingId(contact.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit contact"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SetPrimaryButton({ contactId, companyId }: { contactId: string; companyId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSetPrimary() {
    startTransition(async () => {
      await updateContact(contactId, { is_primary: true, company_id: companyId })
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleSetPrimary}
      disabled={isPending}
      className="px-2 py-0.5 text-xs text-gray-500 hover:text-yellow-600 transition-colors disabled:opacity-50"
      title="Set as primary"
    >
      <Star className="w-3.5 h-3.5" />
    </button>
  )
}

function ContactInlineForm({
  companyId,
  contact,
  onDone,
}: {
  companyId: string
  contact?: CrmContact
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const isEdit = !!contact

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company_id: companyId,
          title: contact.title ?? '',
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          is_primary: contact.is_primary,
          notes: contact.notes ?? '',
        }
      : {
          company_id: companyId,
          is_primary: false,
        },
  })

  function onSubmit(data: ContactInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateContact(contact!.id, data)
        : await createContact(data)

      if (result.error) {
        const msgs = 'form' in result.error ? result.error.form : [String(result.error)]
        setError('root', { message: msgs.join(', ') })
        return
      }

      onDone()
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {errors.root && (
          <p className="text-xs text-red-500">{errors.root.message}</p>
        )}
        <input type="hidden" {...register('company_id')} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <input {...register('first_name')} placeholder="First name *" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            {errors.first_name && <p className="text-xs text-red-500 mt-0.5">{errors.first_name.message}</p>}
          </div>
          <div>
            <input {...register('last_name')} placeholder="Last name *" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            {errors.last_name && <p className="text-xs text-red-500 mt-0.5">{errors.last_name.message}</p>}
          </div>
          <div>
            <input {...register('title')} placeholder="Title" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_primary')} id="is_primary" className="rounded border-gray-300" />
            <label htmlFor="is_primary" className="text-sm text-gray-600">Primary</label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input type="email" {...register('email')} placeholder="Email" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email.message}</p>}
          </div>
          <div>
            <input type="tel" {...register('phone')} placeholder="Phone" className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDone}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Add Contact'}
          </button>
        </div>
      </form>
    </div>
  )
}
