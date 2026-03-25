import { describe, it, expect } from 'vitest'

// LOAD-13: Kanban board tests

describe('LoadKanban', () => {
  it.todo('groups loads by status into columns')
  it.todo('shows status label and count badge in column header')
  it.todo('renders load cards with load number, route, date, driver, revenue')
  it.todo('cards link to /loads/[id] detail page')
  it.todo('shows "No loads" placeholder in empty columns')
  it.todo('displays columns in lifecycle status order')
  it.todo('hides canceled/paid columns when they have no loads')
})
