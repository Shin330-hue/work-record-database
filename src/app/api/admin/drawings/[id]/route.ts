// src/app/api/admin/drawings/[id]/route.ts - 図番更新API

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

// 図番編集用の型定義
interface UpdateDrawingData {
  drawingNumber: string
  title: string
  company: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string
  }
  difficulty: '初級' | '中級' | '上級'
  estimatedTime: string
  machineType: string
  description: string
  keywords: string
  toolsRequired: string
  overview: {
    warnings: string[]
    preparationTime: string
    processingTime: string
  }
  workSteps: any[]
}

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

// 図番データ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawingNumber } = await params
    
    if (!drawingNumber) {
      return NextResponse.json(
        { success: false, error: '図番が指定されていません' },
        { status: 400 }
      )
    }

    // リクエストデータ取得
    const updateData: UpdateDrawingData = await request.json()

    // 入力値検証
    if (!updateData.title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'タイトルが入力されていません' },
        { status: 400 }
      )
    }
    
    if (!updateData.difficulty) {
      return NextResponse.json(
        { success: false, error: '難易度が選択されていません' },
        { status: 400 }
      )
    }
    
    if (!updateData.estimatedTime || isNaN(parseInt(updateData.estimatedTime))) {
      return NextResponse.json(
        { success: false, error: '推定時間が正しく入力されていません' },
        { status: 400 }
      )
    }

    // デバッグ用ログ
    console.log('📝 受信データ:', {
      drawingNumber,
      title: updateData.title,
      difficulty: updateData.difficulty,
      estimatedTime: updateData.estimatedTime,
      machineType: updateData.machineType,
      toolsRequired: updateData.toolsRequired,
      keywords: updateData.keywords,
      overview: updateData.overview,
      workStepsCount: updateData.workSteps?.length || 0
    })

    const dataPath = getDataPath()

    // トランザクション処理
    const transaction = new UpdateTransaction(dataPath)
    
    try {
      await transaction.updateInstruction(drawingNumber, updateData)
      await transaction.updateSearchIndex(drawingNumber, updateData)
      await transaction.commit()

      return NextResponse.json({
        success: true,
        message: '図番情報が正常に更新されました',
        drawingNumber
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }

  } catch (error) {
    console.error('図番更新エラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '更新に失敗しました' 
      },
      { status: 500 }
    )
  }
}

// 更新トランザクション管理クラス
class UpdateTransaction {
  private dataPath: string
  private backupFiles: Map<string, string> = new Map()

  constructor(dataPath: string) {
    this.dataPath = dataPath
  }

  // instruction.json 更新
  async updateInstruction(drawingNumber: string, updateData: UpdateDrawingData) {
    const instructionPath = path.join(
      this.dataPath,
      'work-instructions',
      `drawing-${drawingNumber}`,
      'instruction.json'
    )

    // バックアップ作成
    const originalData = await fs.readFile(instructionPath, 'utf-8')
    this.backupFiles.set(instructionPath, originalData)

    // BOM除去してJSONパース
    const cleanData = originalData.replace(/^\uFEFF/, '') // BOM除去
    const instruction = JSON.parse(cleanData)
    
    // メタデータ更新
    instruction.metadata = {
      ...instruction.metadata,
      title: updateData.title,
      difficulty: updateData.difficulty,
      estimatedTime: `${updateData.estimatedTime}分`,
      machineType: updateData.machineType.split(',').map(m => m.trim()).filter(m => m),
      toolsRequired: updateData.toolsRequired.split(',').map(t => t.trim()).filter(t => t),
      updatedDate: new Date().toISOString().split('T')[0]
    }

    // 概要更新
    instruction.overview = {
      ...instruction.overview,
      description: updateData.description || instruction.overview.description,
      warnings: updateData.overview.warnings,
      preparationTime: `${updateData.overview.preparationTime}分`,
      processingTime: `${updateData.overview.processingTime}分`
    }

    // 作業ステップ更新
    if (updateData.workSteps && updateData.workSteps.length > 0) {
      instruction.workSteps = updateData.workSteps
    }

    // ファイル書き込み
    await fs.writeFile(instructionPath, JSON.stringify(instruction, null, 2))
  }

  // search-index.json 更新
  async updateSearchIndex(drawingNumber: string, updateData: UpdateDrawingData) {
    const searchIndexPath = path.join(this.dataPath, 'search-index.json')

    // バックアップ作成
    const originalData = await fs.readFile(searchIndexPath, 'utf-8')
    this.backupFiles.set(searchIndexPath, originalData)

    // BOM除去してJSONパース
    const cleanData = originalData.replace(/^\uFEFF/, '') // BOM除去
    const searchIndex = JSON.parse(cleanData)
    
    const drawingIndex = searchIndex.drawings.findIndex(
      (d: {drawingNumber: string}) => d.drawingNumber === drawingNumber
    )

    if (drawingIndex >= 0) {
      searchIndex.drawings[drawingIndex] = {
        ...searchIndex.drawings[drawingIndex],
        title: updateData.title,
        difficulty: updateData.difficulty,
        estimatedTime: `${updateData.estimatedTime}分`,
        machineType: updateData.machineType,
        keywords: updateData.keywords.split(',').map(k => k.trim()).filter(k => k)
      }

      // メタデータ更新
      searchIndex.metadata = {
        ...searchIndex.metadata,
        lastIndexed: new Date().toISOString()
      }

      // ファイル書き込み
      await fs.writeFile(searchIndexPath, JSON.stringify(searchIndex, null, 2))
    } else {
      throw new Error(`検索インデックスに図番 ${drawingNumber} が見つかりません`)
    }
  }

  // 変更をコミット（バックアップクリア）
  async commit() {
    this.backupFiles.clear()
  }

  // ロールバック（バックアップから復元）
  async rollback() {
    try {
      for (const [filePath, originalData] of this.backupFiles.entries()) {
        await fs.writeFile(filePath, originalData)
      }
      this.backupFiles.clear()
    } catch (error) {
      console.error('ロールバックエラー:', error)
      throw new Error('データの復元に失敗しました')
    }
  }
}