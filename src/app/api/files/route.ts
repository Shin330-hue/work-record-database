import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // パブリックフォルダ内のパスを構築
    const basePath = join(process.cwd(), 'public', 'data', 'work-instructions', `drawing-${drawingNumber}`, folderType)
    const folderPath = subFolder ? join(basePath, subFolder) : basePath

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