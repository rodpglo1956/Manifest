import { describe, it, expect } from 'vitest'

// LOAD-12: Load list filtering tests

describe('LoadFilters', () => {
  it.todo('renders status dropdown with all 10 load statuses')
  it.todo('renders driver dropdown populated from org drivers')
  it.todo('renders date range inputs for pickup date filtering')
  it.todo('renders broker text input for search')
  it.todo('updates URL searchParams when status filter changes')
  it.todo('updates URL searchParams when driver filter changes')
  it.todo('updates URL searchParams when date range changes')
  it.todo('updates URL searchParams when broker filter changes')
  it.todo('clears all filters when Clear button is clicked')
  it.todo('shows Clear button only when filters are active')
})

describe('LoadList', () => {
  it.todo('renders table with correct columns')
  it.todo('shows load number as monospace link to detail page')
  it.todo('shows StatusBadge for each load')
  it.todo('shows driver name or "Unassigned" text')
  it.todo('formats revenue as currency')
  it.todo('shows empty state when no loads match')
})
