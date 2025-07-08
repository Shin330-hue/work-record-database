import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const getDataRootPath = (): string => {
  // USE_NASの設定を最優先
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  
  // 開発用データパスを優先
  if (process.env.DEV_DATA_ROOT_PATH) {
    return process.env.DEV_DATA_ROOT_PATH
  }
  
  // 本番環境のデフォルト
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  
  // 開発環境のデフォルト - 修正: data_test → data
  return join(process.cwd(), 'public', 'data')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const drawingNumber = searchParams.get('drawingNumber')
    const folderType = searchParams.get('folderType') // 'images', 'videos', 'pdfs'
    const subFolder = searchParams.get('subFolder') || ''
    
    // 加工アイデア用のパラメータ
    const ideaCategory = searchParams.get('ideaCategory')
    const ideaId = searchParams.get('ideaId')

    // パラメータの検証
    if (!folderType) {
      return NextResponse.json(
        { error: 'folderType は必須です' },
        { status: 400 }
      )
    }

    // 作業手順用と加工アイデア用でパラメータを分岐
    if (ideaCategory && ideaId) {
      // 加工アイデア用のパラメータ検証
      if (!ideaCategory || !ideaId) {
        return NextResponse.json(
          { error: 'ideaCategory と ideaId は必須です' },
          { status: 400 }
        )
      }
    } else {
      // 作業手順用のパラメータ検証
      if (!drawingNumber) {
        return NextResponse.json(
          { error: 'drawingNumber は必須です' },
          { status: 400 }
        )
      }
    }

    // データルートパスを取得
    const dataRoot = getDataRootPath()
    
    // パス構築を分岐
    let basePath: string
    let folderPath: string
    
    if (ideaCategory && ideaId) {
      // 加工アイデア用のパス構築
      basePath = join(dataRoot, 'ideas-library', ideaCategory, ideaId, folderType)
      folderPath = subFolder ? join(basePath, subFolder) : basePath
    } else {
      // 作業手順用のパス構築（既存）
      basePath = join(dataRoot, 'work-instructions', `drawing-${drawingNumber}`, folderType)
      folderPath = subFolder ? join(basePath, subFolder) : basePath
    }

    // デバッグ用ログ
    if (process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('🔍 files API パス情報:', {
        dataRoot: dataRoot,
        basePath: basePath,
        folderPath: folderPath,
        USE_NAS: process.env.USE_NAS,
        DEV_DATA_ROOT_PATH: process.env.DEV_DATA_ROOT_PATH,
        ideaCategory,
        ideaId,
        drawingNumber
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
        case 'programs':
          return ['nc', 'min', 'cam', 'dxf', 'dwg', 'stp'].includes(extension || '')
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