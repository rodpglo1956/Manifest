'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_BRAND, CSS_VAR_MAP } from './config'
import type { WhiteLabelBrand } from './actions'

// ============================================================
// White-label context
// ============================================================

const WhiteLabelContext = createContext<WhiteLabelBrand>({
  brand_name: DEFAULT_BRAND.brand_name,
  logo_url: DEFAULT_BRAND.logo_url,
  primary_color: DEFAULT_BRAND.primary_color,
  secondary_color: DEFAULT_BRAND.secondary_color,
})

// ============================================================
// Provider: fetches config and applies CSS custom properties
// ============================================================

export function WhiteLabelProvider({
  config,
  children,
}: {
  config?: WhiteLabelBrand
  children: React.ReactNode
}) {
  const [brand, setBrand] = useState<WhiteLabelBrand>(() => ({
    brand_name: config?.brand_name ?? DEFAULT_BRAND.brand_name,
    logo_url: config?.logo_url ?? DEFAULT_BRAND.logo_url,
    primary_color: config?.primary_color ?? DEFAULT_BRAND.primary_color,
    secondary_color: config?.secondary_color ?? DEFAULT_BRAND.secondary_color,
  }))

  // Apply CSS custom properties when brand changes
  useEffect(() => {
    const root = document.documentElement
    for (const [field, cssVar] of Object.entries(CSS_VAR_MAP)) {
      const value = brand[field as keyof WhiteLabelBrand]
      if (value) {
        root.style.setProperty(cssVar, value)
      }
    }
  }, [brand])

  // Update brand when config prop changes
  useEffect(() => {
    if (config) {
      setBrand({
        brand_name: config.brand_name ?? DEFAULT_BRAND.brand_name,
        logo_url: config.logo_url ?? DEFAULT_BRAND.logo_url,
        primary_color: config.primary_color ?? DEFAULT_BRAND.primary_color,
        secondary_color: config.secondary_color ?? DEFAULT_BRAND.secondary_color,
      })
    }
  }, [config])

  return (
    <WhiteLabelContext.Provider value={brand}>
      {children}
    </WhiteLabelContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useWhiteLabel() {
  return useContext(WhiteLabelContext)
}

// ============================================================
// Brand components
// ============================================================

export function BrandLogo({ className }: { className?: string }) {
  const { logo_url, brand_name } = useWhiteLabel()
  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={logo_url}
      alt={brand_name}
      className={className ?? 'h-8 w-auto'}
    />
  )
}

export function BrandName({ className }: { className?: string }) {
  const { brand_name } = useWhiteLabel()
  return <span className={className}>{brand_name}</span>
}
