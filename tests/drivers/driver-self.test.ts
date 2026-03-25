import { describe, it, expect } from 'vitest'

describe('Driver Self-Profile', () => {
  describe('DRVR-06: Driver self-profile view and edit', () => {
    it.todo('should display driver name, email, license info as read-only')
    it.todo('should display hire date, status, assigned vehicle as read-only')
    it.todo('should allow editing phone number')
    it.todo('should allow editing emergency contact name and phone')
    it.todo('should save changes via updateDriverSelf server action')
    it.todo('should show success message after saving')
    it.todo('should show error when no driver record is linked')
    it.todo('should show informative message for unlinked accounts')
  })

  describe('DRVR-05: Driver-user account linking', () => {
    it.todo('should show "Link to User Account" button for drivers without user_id')
    it.todo('should not show link button for already-linked drivers')
    it.todo('should send invitation email via Supabase admin API')
    it.todo('should set user_id on driver record after invitation')
    it.todo('should only allow admins to link drivers')
    it.todo('should show success message after linking')
    it.todo('should validate email before sending invitation')
  })
})
