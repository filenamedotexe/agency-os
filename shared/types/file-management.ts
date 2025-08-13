// Advanced File Management Types for Phase 4

export interface FileFolder {
  id: string
  name: string
  description?: string
  parent_folder_id?: string
  collection_id: string
  path: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Computed fields
  children?: FileFolder[]
  parent?: FileFolder
  resource_count?: number
}

export interface FileTag {
  id: string
  name: string
  color: string
  created_at: string
  
  // Computed fields
  usage_count?: number
}

export interface FileVersion {
  id: string
  resource_id: string
  version_number: number
  file_name: string
  file_size: number
  mime_type: string
  content_url: string
  checksum: string
  change_description?: string
  created_by: string
  created_at: string
  
  // Computed fields
  is_current?: boolean
  size_diff?: number
}

export interface EnhancedResource {
  id: string
  collection_id: string
  title: string
  description?: string
  type: 'document' | 'video' | 'link' | 'file' | 'image' | 'audio' | 'archive' | 'code'
  content_url: string
  file_name?: string
  file_size?: number
  mime_type?: string
  thumbnail_url?: string
  duration_minutes?: number
  order_index: number
  is_active: boolean
  downloads_count: number
  views_count: number
  created_by: string
  created_at: string
  updated_at: string
  
  // Advanced Phase 4 fields
  folder_id?: string
  checksum?: string
  compression_ratio?: number
  original_file_size?: number
  current_version: number
  status: 'active' | 'archived' | 'deleted' | 'processing'
  metadata: Record<string, any>
  preview_generated: boolean
  sharing_token?: string
  expires_at?: string
  
  // Relations
  folder?: FileFolder
  tags?: FileTag[]
  versions?: FileVersion[]
  
  // Computed fields
  compressed_size?: number
  space_saved?: number
  last_accessed?: string
  access_count?: number
}

export interface FileUploadProgress {
  id: string
  file: File
  name: string
  size: number
  type: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled'
  speed?: number
  eta?: number
  error?: string
  url?: string
  checksum?: string
}

export interface FileUploadConfig {
  maxFileSize: number // in bytes
  maxTotalSize: number // in bytes
  allowedMimeTypes: string[]
  autoCompress: boolean
  generateThumbnails: boolean
  enableVersioning: boolean
  chunkSize: number // for chunked uploads
  concurrentUploads: number
  retryAttempts: number
}

export interface FileBulkOperation {
  type: 'move' | 'copy' | 'delete' | 'tag' | 'compress' | 'share'
  resource_ids: string[]
  target_folder_id?: string
  tag_ids?: string[]
  sharing_config?: FileSharingConfig
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_files: number
  processed_files: number
  failed_files: string[]
  error?: string
}

export interface FileSharingConfig {
  type: 'public' | 'private' | 'password' | 'expiring'
  password?: string
  expires_at?: Date
  download_limit?: number
  allowed_users?: string[]
  allow_preview: boolean
  allow_download: boolean
  watermark?: boolean
}

export interface FileSearchFilters {
  query?: string
  collection_id?: string
  folder_id?: string
  tag_ids?: string[]
  file_types?: string[]
  mime_types?: string[]
  size_min?: number
  size_max?: number
  created_after?: Date
  created_before?: Date
  created_by?: string
  status?: ('active' | 'archived' | 'deleted' | 'processing')[]
  has_preview?: boolean
  sort_by?: 'name' | 'size' | 'created_at' | 'updated_at' | 'downloads' | 'views'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface FileSearchResult {
  resources: EnhancedResource[]
  total: number
  page: number
  limit: number
  has_more: boolean
  facets?: {
    file_types: Array<{ type: string; count: number }>
    mime_types: Array<{ mime_type: string; count: number }>
    tags: Array<{ tag: FileTag; count: number }>
    sizes: Array<{ range: string; count: number }>
  }
}

export interface FilePreview {
  resource_id: string
  type: 'image' | 'video' | 'audio' | 'document' | 'code' | 'text' | 'pdf' | 'unsupported'
  thumbnail_url?: string
  preview_url?: string
  pages?: number
  duration?: number
  dimensions?: { width: number; height: number }
  text_content?: string
  metadata?: Record<string, any>
  status: 'generating' | 'ready' | 'failed'
  error?: string
}

export interface FileAnalytics {
  resource_id: string
  total_views: number
  total_downloads: number
  unique_viewers: number
  avg_view_duration?: number
  popular_times: Array<{ hour: number; count: number }>
  geographic_data: Array<{ country: string; count: number }>
  referrer_data: Array<{ source: string; count: number }>
  device_data: Array<{ device: string; count: number }>
  recent_activity: Array<{
    user_id: string
    action: 'view' | 'download' | 'share'
    timestamp: string
    user_agent?: string
    ip_address?: string
  }>
}

export interface FileCompressionResult {
  original_size: number
  compressed_size: number
  compression_ratio: number
  format: string
  quality: number
  time_taken: number
  space_saved: number
}

export interface FileSystemTree {
  folders: Array<FileFolder & { children: FileSystemTree }>
  resources: EnhancedResource[]
}

export interface FileQuota {
  user_id: string
  total_allowed: number
  total_used: number
  available: number
  files_count: number
  largest_file: number
  oldest_file: string
  quota_warnings: Array<{
    type: 'approaching_limit' | 'limit_exceeded' | 'large_file'
    message: string
    threshold: number
  }>
}

// File operation hooks and events
export interface FileOperationEvent {
  type: 'upload_started' | 'upload_progress' | 'upload_completed' | 'upload_failed' |
        'download_started' | 'file_viewed' | 'file_shared' | 'file_deleted' |
        'preview_generated' | 'compression_completed' | 'version_created'
  resource_id: string
  user_id: string
  timestamp: string
  metadata?: Record<string, any>
  error?: string
}

// Validation and utility types
export type FileType = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'text' | 'other'

export interface MimeTypeConfig {
  type: FileType
  icon: string
  color: string
  previewable: boolean
  compressible: boolean
  extensions: string[]
  max_size?: number
}

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggested_actions?: string[]
}

// API Response types
export interface FileOperationResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
  operation_id?: string
}

export interface FileUploadResponse extends FileOperationResponse<EnhancedResource> {
  upload_id: string
  checksum: string
  compression_applied: boolean
  preview_generated: boolean
  virus_scan_result?: 'clean' | 'infected' | 'pending'
}

// Form and component types
export interface FileUploadFormData {
  files: File[]
  title?: string
  description?: string
  folder_id?: string
  tag_ids: string[]
  auto_compress: boolean
  generate_preview: boolean
  enable_versioning: boolean
  sharing_config?: FileSharingConfig
}

export interface FolderCreateFormData {
  name: string
  description?: string
  parent_folder_id?: string
  collection_id: string
}

export interface TagCreateFormData {
  name: string
  color: string
}

// Component prop types
export interface FileManagerProps {
  collection_id: string
  folder_id?: string
  view_mode: 'grid' | 'list' | 'tree'
  editable: boolean
  selectable: boolean
  show_breadcrumbs: boolean
  show_search: boolean
  show_filters: boolean
  show_bulk_actions: boolean
  upload_config?: Partial<FileUploadConfig>
  on_selection_change?: (selected: string[]) => void
  on_file_click?: (resource: EnhancedResource) => void
  on_folder_change?: (folder_id: string) => void
}

export interface FilePreviewProps {
  resource: EnhancedResource
  show_metadata: boolean
  show_versions: boolean
  show_analytics: boolean
  allow_download: boolean
  allow_share: boolean
  on_close: () => void
  on_download?: () => void
  on_share?: (config: FileSharingConfig) => void
}

export interface FileUploadDropzoneProps {
  accept?: string[]
  max_files?: number
  max_size?: number
  collection_id: string
  folder_id?: string
  auto_upload?: boolean
  show_progress?: boolean
  on_files_added?: (files: File[]) => void
  on_upload_complete?: (resources: EnhancedResource[]) => void
  on_upload_error?: (error: string) => void
}