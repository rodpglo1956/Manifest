'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadLoadDocument, getDocumentUrl } from '@/lib/storage'
import { uploadDocumentUrl } from '@/app/(app)/loads/status-actions'
import { Download, FileText, Loader2 } from 'lucide-react'

type DocType = 'bol' | 'rate_confirmation' | 'pod'

interface LoadDocumentsProps {
  loadId: string
  orgId: string
  bolUrl: string | null
  rateConfirmationUrl: string | null
  podUrl: string | null
}

const DOC_LABELS: Record<DocType, string> = {
  bol: 'Bill of Lading (BOL)',
  rate_confirmation: 'Rate Confirmation',
  pod: 'Proof of Delivery (POD)',
}

/**
 * Document upload and display section for load detail pages.
 * Shows existing documents as download links, or upload inputs for missing ones.
 */
export function LoadDocuments({
  loadId,
  orgId,
  bolUrl,
  rateConfirmationUrl,
  podUrl,
}: LoadDocumentsProps) {
  const [uploading, setUploading] = useState<DocType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<DocType, string | null>>({
    bol: bolUrl,
    rate_confirmation: rateConfirmationUrl,
    pod: podUrl,
  })

  async function handleUpload(file: File, docType: DocType) {
    setUploading(docType)
    setError(null)

    const { path, error: uploadError } = await uploadLoadDocument(
      file,
      orgId,
      loadId,
      docType
    )

    if (uploadError) {
      setError(uploadError)
      setUploading(null)
      return
    }

    // Update the load record with the storage path
    const { error: actionError } = await uploadDocumentUrl(loadId, docType, path)
    if (actionError) {
      setError(actionError)
      setUploading(null)
      return
    }

    setUrls((prev) => ({ ...prev, [docType]: path }))
    setUploading(null)
  }

  async function handleDownload(storagePath: string) {
    const { url, error: urlError } = await getDocumentUrl(storagePath)
    if (urlError) {
      setError(urlError)
      return
    }
    window.open(url, '_blank')
  }

  const docs: { type: DocType; url: string | null }[] = [
    { type: 'bol', url: urls.bol },
    { type: 'rate_confirmation', url: urls.rate_confirmation },
    { type: 'pod', url: urls.pod },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Documents</h3>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-3">
        {docs.map(({ type, url }) => (
          <div key={type}>
            {url ? (
              <button
                type="button"
                onClick={() => handleDownload(url)}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted"
              >
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium flex-1">
                  {DOC_LABELS[type]}
                </span>
                <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ) : (
              <div className="relative">
                {uploading === type && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                <FileUpload
                  onFileSelected={(file) => handleUpload(file, type)}
                  label={DOC_LABELS[type]}
                  disabled={uploading !== null}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
