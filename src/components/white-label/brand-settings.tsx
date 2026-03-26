'use client'

import { useState, useTransition } from 'react'
import { saveWhiteLabelConfig, uploadLogo } from '@/lib/white-label/actions'
import type { WhiteLabelConfig } from '@/types/database'

// ============================================================
// Brand Settings form (enterprise orgs only)
// ============================================================

type FormData = {
  enabled: boolean
  brand_name: string
  logo_url: string
  favicon_url: string
  primary_color: string
  secondary_color: string
  custom_domain: string
  support_email: string
  support_phone: string
}

export function BrandSettings({
  config,
}: {
  config: Partial<WhiteLabelConfig> | null
}) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    enabled: config?.enabled ?? false,
    brand_name: config?.brand_name ?? '',
    logo_url: config?.logo_url ?? '',
    favicon_url: config?.favicon_url ?? '',
    primary_color: config?.primary_color ?? '#EC008C',
    secondary_color: config?.secondary_color ?? '#1e3a5f',
    custom_domain: config?.custom_domain ?? '',
    support_email: config?.support_email ?? '',
    support_phone: config?.support_phone ?? '',
  })

  function updateField(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  function handleSubmit() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await saveWhiteLabelConfig(form)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new globalThis.FormData()
    formData.append('file', file)

    const result = await uploadLogo(formData)
    if (result.url) {
      updateField('logo_url', result.url)
    } else if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Enable toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer-checked:bg-[var(--brand-primary,#EC008C)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
        </label>
        <span className="text-sm font-medium text-gray-700">
          Enable white-label branding
        </span>
      </div>

      {/* Brand name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brand Name
        </label>
        <input
          type="text"
          value={form.brand_name}
          onChange={(e) => updateField('brand_name', e.target.value)}
          placeholder="Your Company Name"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-primary,#EC008C)] focus:ring-1 focus:ring-[var(--brand-primary,#EC008C)]"
        />
      </div>

      {/* Logo upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Logo
        </label>
        <div className="flex items-center gap-4">
          {form.logo_url && (
            /* eslint-disable @next/next/no-img-element */
            <img
              src={form.logo_url}
              alt="Brand logo"
              className="h-12 w-auto rounded border border-gray-200 p-1"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => updateField('primary_color', e.target.value)}
              className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={form.primary_color}
              onChange={(e) => updateField('primary_color', e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secondary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => updateField('secondary_color', e.target.value)}
              className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={form.secondary_color}
              onChange={(e) => updateField('secondary_color', e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Custom domain */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Domain
        </label>
        <input
          type="text"
          value={form.custom_domain}
          onChange={(e) => updateField('custom_domain', e.target.value)}
          placeholder="app.yourcompany.com"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-primary,#EC008C)] focus:ring-1 focus:ring-[var(--brand-primary,#EC008C)]"
        />
      </div>

      {/* Support info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Support Email
          </label>
          <input
            type="email"
            value={form.support_email}
            onChange={(e) => updateField('support_email', e.target.value)}
            placeholder="support@yourcompany.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-primary,#EC008C)] focus:ring-1 focus:ring-[var(--brand-primary,#EC008C)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Support Phone
          </label>
          <input
            type="tel"
            value={form.support_phone}
            onChange={(e) => updateField('support_phone', e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand-primary,#EC008C)] focus:ring-1 focus:ring-[var(--brand-primary,#EC008C)]"
          />
        </div>
      </div>

      {/* Live preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
        <div
          className="rounded-lg border border-gray-200 p-4"
          style={{ backgroundColor: form.secondary_color + '0D' }}
        >
          <div className="flex items-center gap-3 mb-3">
            {form.logo_url ? (
              /* eslint-disable @next/next/no-img-element */
              <img
                src={form.logo_url}
                alt="Preview"
                className="h-8 w-auto"
              />
            ) : (
              <div
                className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: form.primary_color }}
              >
                {(form.brand_name || 'M')[0]}
              </div>
            )}
            <span
              className="text-lg font-bold"
              style={{ color: form.secondary_color }}
            >
              {form.brand_name || 'Your Brand'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md px-4 py-1.5 text-sm text-white"
              style={{ backgroundColor: form.primary_color }}
            >
              Primary Action
            </button>
            <button
              type="button"
              className="rounded-md px-4 py-1.5 text-sm border"
              style={{
                borderColor: form.secondary_color,
                color: form.secondary_color,
              }}
            >
              Secondary
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Brand settings saved successfully.
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-md bg-[var(--brand-primary,#EC008C)] px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
