// VAPID configuration for Web Push notifications
// Keys generated via: npx web-push generate-vapid-keys

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
export const VAPID_SUBJECT = 'mailto:support@glomatrix.com'
