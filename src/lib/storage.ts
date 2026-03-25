import { createClient } from '@/lib/supabase/client'

const BUCKET = 'load-documents'

/**
 * Upload a document file to Supabase Storage.
 * Path format: {orgId}/{loadId}/{docType}.{ext}
 * Uses upsert: true to allow re-uploading the same document type.
 */
export async function uploadLoadDocument(
  file: File,
  orgId: string,
  loadId: string,
  docType: 'bol' | 'rate_confirmation' | 'pod'
): Promise<{ path: string; error?: string }> {
  const supabase = createClient()

  // Extract file extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const storagePath = `${orgId}/${loadId}/${docType}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path: storagePath }
}

/**
 * Get a signed URL for downloading a document from private storage.
 * URLs expire after 1 hour (3600 seconds).
 */
export async function getDocumentUrl(
  path: string
): Promise<{ url: string; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)

  if (error || !data?.signedUrl) {
    return { url: '', error: error?.message || 'Failed to create signed URL' }
  }

  return { url: data.signedUrl }
}
