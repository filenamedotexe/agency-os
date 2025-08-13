// Advanced File Management Utilities for Phase 4

import { MimeTypeConfig, FileType, FileValidationResult, FileCompressionResult } from '@/shared/types/file-management'

// MIME type configurations with extended support
export const MIME_TYPE_CONFIGS: Record<string, MimeTypeConfig> = {
  // Documents
  'application/pdf': {
    type: 'document',
    icon: 'FileText',
    color: 'red',
    previewable: true,
    compressible: true,
    extensions: ['.pdf'],
    max_size: 50 * 1024 * 1024 // 50MB
  },
  'application/msword': {
    type: 'document',
    icon: 'FileText',
    color: 'blue',
    previewable: true,
    compressible: true,
    extensions: ['.doc'],
    max_size: 25 * 1024 * 1024 // 25MB
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    type: 'document',
    icon: 'FileText',
    color: 'blue',
    previewable: true,
    compressible: true,
    extensions: ['.docx'],
    max_size: 25 * 1024 * 1024 // 25MB
  },
  'application/vnd.ms-excel': {
    type: 'document',
    icon: 'FileSpreadsheet',
    color: 'green',
    previewable: true,
    compressible: true,
    extensions: ['.xls'],
    max_size: 25 * 1024 * 1024 // 25MB
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    type: 'document',
    icon: 'FileSpreadsheet',
    color: 'green',
    previewable: true,
    compressible: true,
    extensions: ['.xlsx'],
    max_size: 25 * 1024 * 1024 // 25MB
  },
  'application/vnd.ms-powerpoint': {
    type: 'document',
    icon: 'Presentation',
    color: 'orange',
    previewable: true,
    compressible: true,
    extensions: ['.ppt'],
    max_size: 50 * 1024 * 1024 // 50MB
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    type: 'document',
    icon: 'Presentation',
    color: 'orange',
    previewable: true,
    compressible: true,
    extensions: ['.pptx'],
    max_size: 50 * 1024 * 1024 // 50MB
  },
  
  // Images
  'image/jpeg': {
    type: 'image',
    icon: 'Image',
    color: 'purple',
    previewable: true,
    compressible: true,
    extensions: ['.jpg', '.jpeg'],
    max_size: 10 * 1024 * 1024 // 10MB
  },
  'image/png': {
    type: 'image',
    icon: 'Image',
    color: 'purple',
    previewable: true,
    compressible: true,
    extensions: ['.png'],
    max_size: 10 * 1024 * 1024 // 10MB
  },
  'image/gif': {
    type: 'image',
    icon: 'Image',
    color: 'purple',
    previewable: true,
    compressible: false,
    extensions: ['.gif'],
    max_size: 5 * 1024 * 1024 // 5MB
  },
  'image/webp': {
    type: 'image',
    icon: 'Image',
    color: 'purple',
    previewable: true,
    compressible: true,
    extensions: ['.webp'],
    max_size: 10 * 1024 * 1024 // 10MB
  },
  'image/svg+xml': {
    type: 'image',
    icon: 'Image',
    color: 'purple',
    previewable: true,
    compressible: true,
    extensions: ['.svg'],
    max_size: 2 * 1024 * 1024 // 2MB
  },
  
  // Videos
  'video/mp4': {
    type: 'video',
    icon: 'Video',
    color: 'red',
    previewable: true,
    compressible: true,
    extensions: ['.mp4'],
    max_size: 500 * 1024 * 1024 // 500MB
  },
  'video/webm': {
    type: 'video',
    icon: 'Video',
    color: 'red',
    previewable: true,
    compressible: true,
    extensions: ['.webm'],
    max_size: 500 * 1024 * 1024 // 500MB
  },
  'video/quicktime': {
    type: 'video',
    icon: 'Video',
    color: 'red',
    previewable: true,
    compressible: true,
    extensions: ['.mov'],
    max_size: 500 * 1024 * 1024 // 500MB
  },
  'video/x-msvideo': {
    type: 'video',
    icon: 'Video',
    color: 'red',
    previewable: true,
    compressible: true,
    extensions: ['.avi'],
    max_size: 500 * 1024 * 1024 // 500MB
  },
  
  // Audio
  'audio/mpeg': {
    type: 'audio',
    icon: 'Music',
    color: 'pink',
    previewable: true,
    compressible: false,
    extensions: ['.mp3'],
    max_size: 50 * 1024 * 1024 // 50MB
  },
  'audio/wav': {
    type: 'audio',
    icon: 'Music',
    color: 'pink',
    previewable: true,
    compressible: true,
    extensions: ['.wav'],
    max_size: 100 * 1024 * 1024 // 100MB
  },
  'audio/ogg': {
    type: 'audio',
    icon: 'Music',
    color: 'pink',
    previewable: true,
    compressible: false,
    extensions: ['.ogg'],
    max_size: 50 * 1024 * 1024 // 50MB
  },
  
  // Archives
  'application/zip': {
    type: 'archive',
    icon: 'Archive',
    color: 'yellow',
    previewable: false,
    compressible: false,
    extensions: ['.zip'],
    max_size: 100 * 1024 * 1024 // 100MB
  },
  'application/x-rar-compressed': {
    type: 'archive',
    icon: 'Archive',
    color: 'yellow',
    previewable: false,
    compressible: false,
    extensions: ['.rar'],
    max_size: 100 * 1024 * 1024 // 100MB
  },
  'application/x-7z-compressed': {
    type: 'archive',
    icon: 'Archive',
    color: 'yellow',
    previewable: false,
    compressible: false,
    extensions: ['.7z'],
    max_size: 100 * 1024 * 1024 // 100MB
  },
  
  // Code
  'text/javascript': {
    type: 'code',
    icon: 'Code',
    color: 'green',
    previewable: true,
    compressible: true,
    extensions: ['.js'],
    max_size: 5 * 1024 * 1024 // 5MB
  },
  'application/json': {
    type: 'code',
    icon: 'Code',
    color: 'green',
    previewable: true,
    compressible: true,
    extensions: ['.json'],
    max_size: 5 * 1024 * 1024 // 5MB
  },
  'text/html': {
    type: 'code',
    icon: 'Code',
    color: 'orange',
    previewable: true,
    compressible: true,
    extensions: ['.html'],
    max_size: 5 * 1024 * 1024 // 5MB
  },
  'text/css': {
    type: 'code',
    icon: 'Code',
    color: 'blue',
    previewable: true,
    compressible: true,
    extensions: ['.css'],
    max_size: 5 * 1024 * 1024 // 5MB
  },
  
  // Text
  'text/plain': {
    type: 'text',
    icon: 'FileText',
    color: 'gray',
    previewable: true,
    compressible: true,
    extensions: ['.txt'],
    max_size: 10 * 1024 * 1024 // 10MB
  },
  'text/markdown': {
    type: 'text',
    icon: 'FileText',
    color: 'gray',
    previewable: true,
    compressible: true,
    extensions: ['.md'],
    max_size: 5 * 1024 * 1024 // 5MB
  },
  'text/csv': {
    type: 'document',
    icon: 'FileSpreadsheet',
    color: 'green',
    previewable: true,
    compressible: true,
    extensions: ['.csv'],
    max_size: 25 * 1024 * 1024 // 25MB
  }
}

// File size constants
export const FILE_SIZES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MAX_TOTAL_UPLOAD: 1024 * 1024 * 1024, // 1GB total
  MAX_SINGLE_FILE: 500 * 1024 * 1024, // 500MB per file
  CHUNK_SIZE: 1024 * 1024 // 1MB chunks for upload
}

// Validation constants
export const VALIDATION_RULES = {
  MAX_FILENAME_LENGTH: 255,
  MIN_FILENAME_LENGTH: 1,
  MAX_DESCRIPTION_LENGTH: 1000,
  INVALID_FILENAME_CHARS: /[<>:"/\\|?*\x00-\x1f]/g,
  RESERVED_NAMES: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Get file type based on MIME type
 */
export function getFileTypeFromMime(mimeType: string): FileType {
  const config = MIME_TYPE_CONFIGS[mimeType]
  return config?.type || 'other'
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : ''
}

/**
 * Get MIME type configuration
 */
export function getMimeTypeConfig(mimeType: string): MimeTypeConfig | null {
  return MIME_TYPE_CONFIGS[mimeType] || null
}

/**
 * Check if file type is previewable
 */
export function isPreviewable(mimeType: string): boolean {
  const config = getMimeTypeConfig(mimeType)
  return config?.previewable || false
}

/**
 * Check if file type is compressible
 */
export function isCompressible(mimeType: string): boolean {
  const config = getMimeTypeConfig(mimeType)
  return config?.compressible || false
}

/**
 * Validate file upload
 */
export function validateFile(file: File, allowedTypes?: string[]): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestedActions: string[] = []
  
  // Check file name
  if (!file.name || file.name.length < VALIDATION_RULES.MIN_FILENAME_LENGTH) {
    errors.push('File name is required')
  }
  
  if (file.name.length > VALIDATION_RULES.MAX_FILENAME_LENGTH) {
    errors.push(`File name too long (max ${VALIDATION_RULES.MAX_FILENAME_LENGTH} characters)`)
  }
  
  if (VALIDATION_RULES.INVALID_FILENAME_CHARS.test(file.name)) {
    errors.push('File name contains invalid characters')
    suggestedActions.push('Remove special characters from filename')
  }
  
  const nameWithoutExt = file.name.split('.')[0].toUpperCase()
  if (VALIDATION_RULES.RESERVED_NAMES.includes(nameWithoutExt)) {
    errors.push('File name is reserved by the system')
    suggestedActions.push('Choose a different filename')
  }
  
  // Check file size
  const config = getMimeTypeConfig(file.type)
  const maxSize = config?.max_size || FILE_SIZES.MAX_SINGLE_FILE
  
  if (file.size > maxSize) {
    errors.push(`File too large (max ${formatFileSize(maxSize)})`)
    if (isCompressible(file.type)) {
      suggestedActions.push('Enable compression to reduce file size')
    }
  }
  
  if (file.size === 0) {
    errors.push('File is empty')
  }
  
  // Check MIME type
  if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed: ${file.type}`)
  }
  
  if (!config) {
    warnings.push('File type not recognized - limited features available')
  }
  
  // Performance warnings
  if (file.size > 50 * FILE_SIZES.MB) {
    warnings.push('Large file detected - upload may take some time')
  }
  
  if (file.type.startsWith('video/') && file.size > 100 * FILE_SIZES.MB) {
    suggestedActions.push('Consider compressing video before upload')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggested_actions: suggestedActions.length > 0 ? suggestedActions : undefined
  }
}

/**
 * Validate multiple files for bulk upload
 */
export function validateBulkUpload(files: File[], maxTotalSize: number = FILE_SIZES.MAX_TOTAL_UPLOAD): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const suggestedActions: string[] = []
  
  if (files.length === 0) {
    errors.push('No files selected')
    return { valid: false, errors, warnings }
  }
  
  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > maxTotalSize) {
    errors.push(`Total file size too large (max ${formatFileSize(maxTotalSize)})`)
    suggestedActions.push('Remove some files or enable compression')
  }
  
  // Check for duplicate names
  const fileNames = files.map(f => f.name.toLowerCase())
  const duplicates = fileNames.filter((name, index) => fileNames.indexOf(name) !== index)
  if (duplicates.length > 0) {
    errors.push(`Duplicate filenames detected: ${[...new Set(duplicates)].join(', ')}`)
    suggestedActions.push('Rename duplicate files')
  }
  
  // Validate individual files
  let hasIndividualErrors = false
  files.forEach((file, index) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      hasIndividualErrors = true
    }
  })
  
  if (hasIndividualErrors) {
    errors.push('Some files have validation errors')
    suggestedActions.push('Check individual file validation results')
  }
  
  // Performance warnings
  if (files.length > 20) {
    warnings.push('Large number of files - consider uploading in batches')
  }
  
  if (totalSize > 100 * FILE_SIZES.MB) {
    warnings.push('Large total size - upload may take significant time')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggested_actions: suggestedActions.length > 0 ? suggestedActions : undefined
  }
}

/**
 * Generate file checksum (simple hash for client-side)
 */
export async function generateFileChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Estimate compression ratio for a file
 */
export function estimateCompressionRatio(file: File): number {
  const config = getMimeTypeConfig(file.type)
  
  if (!config?.compressible) return 1.0
  
  // Estimated compression ratios based on file type
  switch (config.type) {
    case 'image':
      if (file.type === 'image/png') return 0.7
      if (file.type === 'image/jpeg') return 0.9 // Already compressed
      return 0.8
    case 'document':
      return 0.5
    case 'text':
    case 'code':
      return 0.3
    case 'video':
      return 0.9 // Usually already compressed
    case 'audio':
      return 0.9 // Usually already compressed
    default:
      return 0.7
  }
}

/**
 * Calculate estimated upload time
 */
export function estimateUploadTime(fileSize: number, connectionSpeed: number = 1024 * 1024): string {
  const seconds = fileSize / connectionSpeed
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

/**
 * Generate unique filename to avoid conflicts
 */
export function generateUniqueFilename(originalName: string, existingNames: string[]): string {
  let filename = originalName
  let counter = 1
  
  const extension = getFileExtension(originalName)
  const nameWithoutExt = originalName.replace(extension, '')
  
  while (existingNames.includes(filename.toLowerCase())) {
    filename = `${nameWithoutExt} (${counter})${extension}`
    counter++
  }
  
  return filename
}

/**
 * Parse folder path into breadcrumb items
 */
export function parseFolderPath(path: string): Array<{ name: string; path: string }> {
  if (!path || path === '/') return [{ name: 'Root', path: '/' }]
  
  const parts = path.split('/').filter(Boolean)
  const breadcrumbs = [{ name: 'Root', path: '/' }]
  
  let currentPath = ''
  for (const part of parts) {
    currentPath += '/' + part
    breadcrumbs.push({ name: part, path: currentPath })
  }
  
  return breadcrumbs
}

/**
 * Sort files by various criteria
 */
export function sortFiles<T extends { name?: string; file_name?: string; size?: number; file_size?: number; created_at: string; updated_at?: string }>(
  files: T[],
  sortBy: 'name' | 'size' | 'created_at' | 'updated_at',
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...files].sort((a, b) => {
    let aVal: any
    let bVal: any
    
    switch (sortBy) {
      case 'name':
        aVal = (a.name || a.file_name || '').toLowerCase()
        bVal = (b.name || b.file_name || '').toLowerCase()
        break
      case 'size':
        aVal = a.size || a.file_size || 0
        bVal = b.size || b.file_size || 0
        break
      case 'created_at':
        aVal = new Date(a.created_at).getTime()
        bVal = new Date(b.created_at).getTime()
        break
      case 'updated_at':
        aVal = new Date(a.updated_at || a.created_at).getTime()
        bVal = new Date(b.updated_at || b.created_at).getTime()
        break
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Filter files by search query and criteria
 */
export function filterFiles<T extends { name?: string; file_name?: string; description?: string; type?: string; mime_type?: string; tags?: Array<{ name: string }> }>(
  files: T[],
  query: string,
  typeFilter?: string[],
  tagFilter?: string[]
): T[] {
  const searchQuery = query.toLowerCase().trim()
  
  return files.filter(file => {
    // Text search
    const name = (file.name || file.file_name || '').toLowerCase()
    const description = (file.description || '').toLowerCase()
    const tags = (file.tags || []).map(tag => tag.name.toLowerCase()).join(' ')
    
    const matchesQuery = !searchQuery || 
      name.includes(searchQuery) || 
      description.includes(searchQuery) || 
      tags.includes(searchQuery)
    
    // Type filter
    const matchesType = !typeFilter || typeFilter.length === 0 || 
      (file.type && typeFilter.includes(file.type)) ||
      (file.mime_type && typeFilter.some(type => getMimeTypeConfig(file.mime_type!)?.type === type))
    
    // Tag filter
    const matchesTags = !tagFilter || tagFilter.length === 0 ||
      (file.tags && file.tags.some(tag => tagFilter.includes(tag.name)))
    
    return matchesQuery && matchesType && matchesTags
  })
}

/**
 * Calculate storage statistics
 */
export function calculateStorageStats(files: Array<{ file_size?: number; type?: string; mime_type?: string }>): {
  total_size: number
  total_files: number
  by_type: Record<FileType, { count: number; size: number }>
  largest_file: number
  average_size: number
} {
  const stats = {
    total_size: 0,
    total_files: files.length,
    by_type: {} as Record<FileType, { count: number; size: number }>,
    largest_file: 0,
    average_size: 0
  }
  
  for (const file of files) {
    const size = file.file_size || 0
    stats.total_size += size
    stats.largest_file = Math.max(stats.largest_file, size)
    
    const type = file.type ? file.type as FileType : getFileTypeFromMime(file.mime_type || '')
    if (!stats.by_type[type]) {
      stats.by_type[type] = { count: 0, size: 0 }
    }
    stats.by_type[type].count++
    stats.by_type[type].size += size
  }
  
  stats.average_size = stats.total_files > 0 ? stats.total_size / stats.total_files : 0
  
  return stats
}