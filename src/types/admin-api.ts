// src/types/admin-api.ts - 管理画面API共通型定義

/**
 * API共通レスポンス型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
  timestamp?: string
}

/**
 * エラーレスポンス型
 */
export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode?: number
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * ファイルアップロードレスポンス
 */
export interface FileUploadResponse {
  fileName: string
  originalName: string
  size: number
  fileType: 'images' | 'videos' | 'pdfs' | 'programs'
  message?: string
}

/**
 * バッチ処理レスポンス
 */
export interface BatchResponse<T = any> {
  success: boolean
  summary: {
    total: number
    successful: number
    failed: number
  }
  results: Array<{
    id: string
    success: boolean
    data?: T
    error?: string
  }>
}

/**
 * 検証結果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}