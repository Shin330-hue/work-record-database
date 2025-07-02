import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const getDataRootPath = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  return process.env.DEV_DATA_ROOT_PATH || join(process.cwd(), 'public', 'data_test')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const drawingNumber = searchParams.get('drawingNumber')
    const folderType = searchParams.get('folderType') // 'images', 'videos', 'pdfs'
    const subFolder = searchParams.get('subFolder') || ''

    if (!drawingNumber || !folderType) {
      return NextResponse.json(
        { error: 'drawingNumber と folderType は必須です' },
        { status: 400 }
      )
    }

    // データルートパスを取得
    const dataRoot = getDataRootPath()
    const basePath = join(dataRoot, 'work-instructions', `drawing-${drawingNumber}`, folderType)
    const folderPath = subFolder ? join(basePath, subFolder) : basePath

    // デバッグ用ログ
    if (process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('🔍 files API パス情報:', {
        dataRoot: dataRoot,
        basePath: basePath,
        folderPath: folderPath,
        USE_NAS: process.env.USE_NAS,
        DEV_DATA_ROOT_PATH: process.env.DEV_DATA_ROOT_PATH
      })
    }

    // フォルダが存在するかチェック
    if (!existsSync(folderPath)) {
      return NextResponse.json({ files: [] })
    }

    // フォルダ内のファイル一覧を取得
    const files = await readdir(folderPath)
    
    // ファイルのみをフィルタリング（ディレクトリは除外）
    const fileList = []
    for (const file of files) {
      const filePath = join(folderPath, file)
      const stats = await import('fs').then(fs => fs.promises.stat(filePath))
      if (stats.isFile()) {
        fileList.push(file)
      }
    }

    // ファイルタイプに応じてフィルタリング
    const filteredFiles = fileList.filter(file => {
      const extension = file.toLowerCase().split('.').pop()
      switch (folderType) {
        case 'images':
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')
        case 'videos':
          return ['mp4', 'webm', 'avi', 'mov'].includes(extension || '')
        case 'pdfs':
          return extension === 'pdf'
        default:
          return true
      }
    })

    console.log(`📁 ファイル一覧取得: ${folderPath} → ${filteredFiles.length}個のファイル`)

    return NextResponse.json({
      files: filteredFiles,
      folderPath: folderPath.replace(process.cwd(), ''),
      count: filteredFiles.length
    })

  } catch (error) {
    console.error('❌ ファイル一覧取得エラー:', error)
    return NextResponse.json(
      { 
        error: 'ファイル一覧の取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
} 