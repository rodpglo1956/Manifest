import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCards } from '@/app/(app)/dashboard/stat-cards'
import { QuickActions } from '@/app/(app)/dashboard/quick-actions'

describe('StatCards', () => {
  it('renders 4 stat cards', () => {
    const { container } = render(
      <StatCards
        activeLoads={5}
        bookedToday={2}
        driversOnDuty={3}
        revenueMtd={12500}
      />
    )
    const cards = container.querySelectorAll('[data-testid^="stat-card-"]')
    expect(cards).toHaveLength(4)
  })

  it('formats revenue as USD currency', () => {
    render(
      <StatCards
        activeLoads={0}
        bookedToday={0}
        driversOnDuty={0}
        revenueMtd={12500.5}
      />
    )
    expect(screen.getByText('$12,500.50')).toBeDefined()
  })

  it('handles zero values', () => {
    const { container } = render(
      <StatCards
        activeLoads={0}
        bookedToday={0}
        driversOnDuty={0}
        revenueMtd={0}
      />
    )
    const cards = container.querySelectorAll('[data-testid^="stat-card-"]')
    expect(cards).toHaveLength(4)
    expect(screen.getByText('$0.00')).toBeDefined()
    // Check that zero values display
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3)
  })
})

describe('QuickActions', () => {
  it('renders 3 action buttons with correct links', () => {
    const { container } = render(<QuickActions />)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(3)

    const hrefs = Array.from(links).map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/loads/new')
    expect(hrefs).toContain('/dispatch')
    expect(hrefs).toContain('/invoices/new')
  })
})
