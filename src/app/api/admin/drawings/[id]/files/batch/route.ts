// src/app/api/admin/drawings/[id]/files/batch/route.ts - 図番ファイル一括管理API

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { existsSync } from 'fs'

// データパス取得
const getDataPath = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  
  return process.env.DEV_DATA_ROOT_PATH || './public/data'
}

// プログラムファイルの拡張子
const programExtensions = [
  '.nc', '.txt', '.tap', '.pgm', '.mpf', 
  '.ptp', '.gcode', '.cnc', '.min', '.eia'
]

// ファイルタイプ判定
function determineFileType(file: File): 'images' | 'videos' | 'pdfs' | 'programs' {
  const fileName = file.name.toLowerCase()
  const mimeType = file.type
  
  // PDF判定
  if (mimeType.includes('pdf')) return 'pdfs'
  
  // プログラムファイル判定
  if (programExtensions.some(ext => fileName.endsWith(ext))) return 'programs'
  if (mimeType === 'text/plain' && programExtensions.some(ext => fileName.endsWith(ext))) return 'programs'
  
  // 画像・動画判定
  if (mimeType.startsWith('image/')) return 'images'
  if (mimeType.startsWith('video/')) return 'videos'
  
  throw new Error(`サポートされていないファイル形式: ${file.name}`)
}

// ファイル検証
function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  
  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `ファイルサイズが大きすぎます。最大50MBまでです。(${file.name})` }
  }
  
  // ファイル名チェック（危険な拡張子の除外）
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.js', '.vbs', '.jar']
  const fileName = file.name.toLowerCase()
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    return { valid: false, error: `実行可能ファイルはアップロードできません。(${file.name})` }
  }
  
  // ファイルタイプ別の追加検証
  try {
    const fileType = determineFileType(file)
    
    switch (fileType) {
      case 'images':
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedImageTypes.includes(file.type)) {
          return { valid: false, error: `サポートされていない画像形式です。(${file.name})` }
        }
        break
        
      case 'videos':
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov']
        if (!allowedVideoTypes.includes(file.type)) {
          return { valid: false, error: `サポートされていない動画形式です。(${file.name})` }
        }
        break
        
      case 'pdfs':
        if (!file.type.includes('pdf')) {
          return { valid: false, error: `PDFファイルではありません。(${file.name})` }
        }
        break
        
      case 'programs':
        // プログラムファイルは拡張子で判定済み
        break
    }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'ファイルタイプの判定に失敗しました' }
  }
  
  return { valid: true }
}

// 複数ファイル検証
function validateFiles(files: File[]): { valid: boolean; error?: string } {
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024 // 100MB
  const MAX_FILE_COUNT = 20 // 画像・動画と違い、図面やプログラムは多い可能性があるため増やす
  
  // ファイル数チェック
  if (files.length > MAX_FILE_COUNT) {
    return { valid: false, error: `ファイル数が上限を超えています。最大${MAX_FILE_COUNT}ファイルまでです。` }
  }
  
  // 総容量チェック
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > MAX_TOTAL_SIZE) {
    return { valid: false, error: `総ファイルサイズが大きすぎます。最大100MBまでです。` }
  }
  
  // 個別ファイル検証
  for (const file of files) {
    const validation = validateFile(file)
    if (!validation.valid) {
      return validation
    }
  }
  
  return { valid: true }
}

// ファイル名生成（ファイルタイプ別）
function generateFileName(file: File, fileType: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  
  switch (fileType) {
    case 'images':
    case 'videos':
      // 画像・動画：タイムスタンプ付加（重複回避）
      return `${timestamp}-${file.name}`
      
    case 'pdfs':
    case 'programs':
      // PDF・プログラム：オリジナルファイル名を保持
      return file.name
      
    default:
      return `${timestamp}-${file.name}`
  }
}

// 重複チェック付きファイル保存
async function saveFileWithDuplicateCheck(
  filePath: string, 
  fileName: string, 
  buffer: Buffer
): Promise<string> {
  let finalFileName = fileName
  let counter = 1
  
  // 重複チェック
  while (existsSync(path.join(filePath, finalFileName))) {
    const ext = path.extname(fileName)
    const base = path.basename(fileName, ext)
    finalFileName = `${base}_${counter}${ext}`
    counter++
  }
  
  const fullPath = path.join(filePath, finalFileName)
  await fs.writeFile(fullPath, buffer)
  
  return finalFileName
}

// instruction.jsonの更新
async function updateInstructionFile(
  drawingNumber: string, 
  stepNumber: string, 
  fileType: string, 
  fileNames: string[]
): Promise<void> {
  const dataPath = getDataPath()
  const instructionPath = path.join(
    dataPath,
    'work-instructions',
    `drawing-${drawingNumber}`,
    'instruction.json'
  )
  
  try {
    // 既存のinstruction.jsonを読み込み
    // 動的なプロパティアクセスのため、anyを使用
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instruction: any = {}
    if (existsSync(instructionPath)) {
      const content = await fs.readFile(instructionPath, 'utf-8')
      instruction = JSON.parse(content)
    }
    
    // ファイルリストの更新
    
    if (stepNumber === '0') {
      // overview の場合
      if (!instruction.overview) instruction.overview = {}
      if (!(instruction.overview as Record<string, unknown>)[fileType]) (instruction.overview as Record<string, unknown>)[fileType] = []
      
      // 既存のファイルリストに追加（重複を除く）
      const existingFiles = new Set(instruction.overview[fileType])
      fileNames.forEach(fileName => existingFiles.add(fileName))
      instruction.overview[fileType] = Array.from(existingFiles)
      
    } else {
      // workSteps の場合
      if (!instruction.workSteps) instruction.workSteps = []
      
      const stepIndex = parseInt(stepNumber) - 1
      if (!instruction.workSteps[stepIndex]) {
        // ステップが存在しない場合はスキップ（エラーにはしない）
        console.warn(`Step ${stepNumber} not found in instruction.json`)
        return
      }
      
      if (!instruction.workSteps[stepIndex][fileType]) {
        instruction.workSteps[stepIndex][fileType] = []
      }
      
      // 既存のファイルリストに追加（重複を除く）
      const existingFiles = new Set(instruction.workSteps[stepIndex][fileType])
      fileNames.forEach(fileName => existingFiles.add(fileName))
      instruction.workSteps[stepIndex][fileType] = Array.from(existingFiles)
    }
    
    // 更新日時を記録
    if (!instruction.metadata) instruction.metadata = {}
    instruction.metadata.lastUpdated = new Date().toISOString()
    
    // ファイルに保存
    await fs.writeFile(instructionPath, JSON.stringify(instruction, null, 2), 'utf-8')
    
  } catch (error) {
    console.error('instruction.json更新エラー:', error)
    // エラーが発生してもアップロード自体は成功とする
  }
}

// ファイル一括アップロード
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawingNumber } = await context.params
    
    if (!drawingNumber) {
      return NextResponse.json(
        { success: false, error: '図番が指定されていません' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const stepNumber = formData.get('stepNumber') as string
    const files = formData.getAll('files') as File[]

    if (!stepNumber) {
      return NextResponse.json(
        { success: false, error: 'ステップ番号が指定されていません' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    // ファイル検証
    const validation = validateFiles(files)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // アップロード結果
    const results: {
      uploaded: { fileName: string; originalName: string; fileType: string }[]
      errors: { fileName: string; error: string }[]
    } = {
      uploaded: [],
      errors: []
    }

    // ファイルタイプ別にグループ化
    const filesByType: Record<string, { file: File; savedName?: string }[]> = {
      images: [],
      videos: [],
      pdfs: [],
      programs: []
    }

    // ファイルタイプ判定とグループ化
    for (const file of files) {
      try {
        const fileType = determineFileType(file)
        filesByType[fileType].push({ file })
      } catch (error) {
        results.errors.push({
          fileName: file.name,
          error: error instanceof Error ? error.message : 'ファイルタイプの判定に失敗しました'
        })
      }
    }

    // 保存先パス
    const dataPath = getDataPath()
    const basePath = path.join(
      dataPath,
      'work-instructions',
      `drawing-${drawingNumber}`
    )

    // ファイルタイプごとに処理
    for (const [fileType, fileList] of Object.entries(filesByType)) {
      if (fileList.length === 0) continue

      const targetDir = path.join(
        basePath,
        fileType,
        stepNumber === '0' ? 'overview' : `step_${stepNumber.padStart(2, '0')}`
      )

      // ディレクトリ作成
      await fs.mkdir(targetDir, { recursive: true })

      // ファイル保存
      const savedFileNames: string[] = []
      
      for (const fileInfo of fileList) {
        try {
          const fileName = generateFileName(fileInfo.file, fileType)
          const buffer = await fileInfo.file.arrayBuffer()
          const savedFileName = await saveFileWithDuplicateCheck(
            targetDir,
            fileName,
            Buffer.from(buffer)
          )
          
          fileInfo.savedName = savedFileName
          savedFileNames.push(savedFileName)
          
          results.uploaded.push({
            fileName: savedFileName,
            originalName: fileInfo.file.name,
            fileType
          })
        } catch (error) {
          results.errors.push({
            fileName: fileInfo.file.name,
            error: error instanceof Error ? error.message : 'ファイル保存に失敗しました'
          })
        }
      }

      // instruction.json更新（このファイルタイプの分）
      if (savedFileNames.length > 0) {
        await updateInstructionFile(drawingNumber, stepNumber, fileType, savedFileNames)
      }
    }

    // レスポンス
    const success = results.uploaded.length > 0
    const statusCode = success ? 200 : 400

    return NextResponse.json({
      success,
      message: success 
        ? `${results.uploaded.length}個のファイルがアップロードされました` 
        : 'すべてのファイルのアップロードに失敗しました',
      uploaded: results.uploaded,
      errors: results.errors,
      summary: {
        total: files.length,
        uploaded: results.uploaded.length,
        failed: results.errors.length
      }
    }, { status: statusCode })

  } catch (error) {
    console.error('ファイル一括アップロードエラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'アップロードに失敗しました' 
      },
      { status: 500 }
    )
  }
}