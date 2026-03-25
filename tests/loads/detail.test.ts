import { describe, it, expect } from 'vitest'

// LOAD-14: Load detail page tests

describe('LoadDetail', () => {
  it.todo('renders load number in monospace font')
  it.todo('renders current status badge')
  it.todo('shows valid transition buttons based on current status')
  it.todo('renders pickup section with address, date, contact')
  it.todo('renders delivery section with address, date, contact')
  it.todo('renders freight section with commodity, weight, equipment')
  it.todo('renders rate breakdown with total revenue highlighted')
  it.todo('renders broker section with MC number in monospace')
  it.todo('shows assigned driver as link to /drivers/[id]')
  it.todo('shows "Unassigned" when no driver assigned')
  it.todo('shows assigned vehicle unit number and make/model')
  it.todo('embeds LoadDocuments component')
  it.todo('renders edit button linking to /loads/[id]/edit')
})

describe('LoadTimeline', () => {
  it.todo('renders status history entries in reverse chronological order')
  it.todo('shows status badge for each entry')
  it.todo('shows formatted timestamp for each entry')
  it.todo('shows user name who made the change')
  it.todo('shows notes when present')
  it.todo('connects entries with vertical line')
  it.todo('shows empty state when no history')
})
