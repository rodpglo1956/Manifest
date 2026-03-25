'use client'

import { useState, useRef } from 'react'
import { Upload, Camera } from 'lucide-react'

interface FileUploadProps {
  onFileSelected: (file: File) => void
  accept?: string
  label?: string
  isMobile?: boolean
  disabled?: boolean
}

/**
 * File upload component with desktop file picker and mobile camera support.
 * When isMobile is true, adds capture="environment" for rear camera access.
 */
export function FileUpload({
  onFileSelected,
  accept = 'image/*,application/pdf',
  label = 'Upload file',
  isMobile = false,
  disabled = false,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onFileSelected(file)
    }
  }

  const Icon = isMobile ? Camera : Upload

  return (
    <label
      className={`
        flex flex-col items-center justify-center gap-2
        rounded-lg border-2 border-dashed border-border
        px-4 py-6 cursor-pointer transition-colors
        hover:border-primary
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${fileName ? 'border-primary/50 bg-primary/5' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        {...(isMobile ? { capture: 'environment' as const } : {})}
      />
      <Icon className="h-6 w-6 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {fileName || label}
      </span>
    </label>
  )
}
