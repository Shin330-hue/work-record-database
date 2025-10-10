// src/lib/admin/utils.ts - 管理画面共通ユーティリティ

/**
 * 環境に応じたデータパスを取得
 * @returns データルートパス
 */
export const getDataPath = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  
  return process.env.DEV_DATA_ROOT_PATH || './public/data'
}

/**
 * 図番をサニタイズ（安全な文字のみに変換）
 * @param drawingNumber 図番
 * @returns サニタイズされた図番
 */
export const sanitizeDrawingNumber = (drawingNumber: string): string => {
  return drawingNumber.replace(/[^a-zA-Z0-9\-_]/g, '')
}

/**
 * ファイル名をサニタイズ
 * @param fileName ファイル名
 * @returns サニタイズされたファイル名
 */
export const sanitizeFileName = (fileName: string): string => {
  // パスセパレータを除去
  fileName = fileName.replace(/[\/\\]/g, '_')
  // 特殊文字を除去（日本語は保持）
  fileName = fileName.replace(/[<>:"|?*]/g, '')
  // 先頭・末尾の空白とドットを除去
  fileName = fileName.trim().replace(/^\.+|\.+$/g, '')
  
  return fileName || 'unnamed'
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 * @param bytes バイト数
 * @returns フォーマットされたサイズ
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * タイムスタンプ付きファイル名を生成
 * @param originalName 元のファイル名
 * @param extension 拡張子（ドット付き）
 * @returns タイムスタンプ付きファイル名
 */
export const generateTimestampedFileName = (originalName: string, extension: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const baseName = originalName.replace(extension, '')
  return `${timestamp}-${sanitizeFileName(baseName)}${extension}`
}

/**
 * プログラムファイルの拡張子リスト
 */
export const PROGRAM_EXTENSIONS = [
  '.nc', '.txt', '.tap', '.pgm', '.mpf',
  '.ptp', '.gcode', '.cnc', '.min', '.eia',
  '.dxf', '.dwg', '.mcam', '.zip', '.stp', '.step'
] as const

/**
 * 画像ファイルの拡張子リスト
 */
export const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.tif', '.tiff', '.jfif'
] as const

/**
 * 動画ファイルの拡張子リスト
 */
export const VIDEO_EXTENSIONS = [
  '.mp4', '.avi', '.mov', '.wmv', '.webm'
] as const

/**
 * ファイルタイプを判定
 * @param fileName ファイル名
 * @param mimeType MIMEタイプ
 * @returns ファイルタイプ
 */
export const determineFileType = (
  fileName: string, 
  mimeType: string
): 'images' | 'videos' | 'pdfs' | 'programs' | 'unknown' => {
  const lowerName = fileName.toLowerCase()
  
  // PDF判定
  if (mimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
    return 'pdfs'
  }
  
  // プログラムファイル判定
  if (PROGRAM_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
    return 'programs'
  }
  
  // 画像判定
  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
    return 'images'
  }
  
  // 動画判定
  if (mimeType.startsWith('video/') || VIDEO_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
    return 'videos'
  }
  
  return 'unknown'
}