// src/app/api/admin/drawings/[id]/route.ts - 図番更新API

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { NearMissItem, WorkStep } from '@/lib/dataLoader'
import { getDataPath } from '@/lib/admin/utils'
import { logAuditEvent, extractAuditActorFromHeaders } from '@/lib/auditLogger'

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
  workSteps: WorkStep[]
  workStepsByMachine?: {
    machining?: WorkStep[]
    turning?: WorkStep[]
    yokonaka?: WorkStep[]
    radial?: WorkStep[]
    other?: WorkStep[]
  }
  nearMiss: NearMissItem[]
  relatedDrawings: Array<{
    drawingNumber: string
    relation: string
    description: string
  }>
}

interface AuditFieldChange {
  field: string
  before: unknown
  after: unknown
}


// 図番データ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawingNumber } = await params

    const actor = extractAuditActorFromHeaders(request.headers)
    
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
      workStepsCount: updateData.workSteps?.length || 0,
      nearMissCount: updateData.nearMiss?.length || 0,
      relatedDrawingsCount: updateData.relatedDrawings?.length || 0
    })

    const dataPath = getDataPath()

    // トランザクション処理
    const transaction = new UpdateTransaction(dataPath)
    
    try {
      await transaction.updateInstruction(drawingNumber, updateData)
      await transaction.updateSearchIndex(drawingNumber, updateData)
      await transaction.commit()

      const changeLog = transaction.getChangeLog()

      await logAuditEvent({
        action: 'drawing.update',
        target: drawingNumber,
        actor,
        metadata: {
          title: updateData.title,
          difficulty: updateData.difficulty,
          companyId: updateData.company?.id,
          companyName: updateData.company?.name,
          productId: updateData.product?.id,
          productName: updateData.product?.name,
          changedFields: changeLog.map(change => change.field),
          changes: changeLog,
          source: 'admin/drawings/update'
        }
      })

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
  private changeLog: AuditFieldChange[] = []

  constructor(dataPath: string) {
    this.dataPath = dataPath
  }

  getChangeLog(): AuditFieldChange[] {
    return this.changeLog
  }

  private recordChange(field: string, before: unknown, after: unknown) {
    if (this.areValuesEqual(before, after)) {
      return
    }

    this.changeLog.push({
      field,
      before: this.cloneValue(before),
      after: this.cloneValue(after),
    })
  }

  private areValuesEqual(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return false
      }
      return a.every((value, index) => this.areValuesEqual(value, b[index]))
    }

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime()
    }

    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      try {
        return JSON.stringify(a) === JSON.stringify(b)
      } catch {
        return false
      }
    }

    return a === b
  }

  private cloneValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.cloneValue(item))
    }
    if (value && typeof value === 'object') {
      try {
        return JSON.parse(JSON.stringify(value))
      } catch {
        return value
      }
    }
    return value
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
    const previousMetadata = instruction.metadata ?? {}
    const previousOverview = instruction.overview ?? {}

    const previousTitle = typeof previousMetadata.title === 'string' ? previousMetadata.title : ''
    const previousDifficulty = typeof previousMetadata.difficulty === 'string' ? previousMetadata.difficulty : ''
    const previousEstimatedTime = typeof previousMetadata.estimatedTime === 'string' ? previousMetadata.estimatedTime : ''
    const previousMachineType = Array.isArray(previousMetadata.machineType)
      ? [...previousMetadata.machineType]
      : typeof previousMetadata.machineType === 'string'
        ? previousMetadata.machineType.split(',').map((m: string) => m.trim()).filter(Boolean)
        : []
    const previousToolsRequired = Array.isArray(previousMetadata.toolsRequired)
      ? [...previousMetadata.toolsRequired]
      : typeof previousMetadata.toolsRequired === 'string'
        ? previousMetadata.toolsRequired.split(',').map((t: string) => t.trim()).filter(Boolean)
        : []

    const previousWarnings = Array.isArray(previousOverview.warnings)
      ? [...previousOverview.warnings]
      : []
    const previousPreparationTime = typeof previousOverview.preparationTime === 'string'
      ? previousOverview.preparationTime
      : ''
    const previousProcessingTime = typeof previousOverview.processingTime === 'string'
      ? previousOverview.processingTime
      : ''
    const previousDescription = typeof previousOverview.description === 'string'
      ? previousOverview.description
      : ''

    const nextEstimatedTime = `${updateData.estimatedTime}分`
    const nextMachineType = updateData.machineType.split(',').map(m => m.trim()).filter(m => m)
    const nextToolsRequired = updateData.toolsRequired.split(',').map(t => t.trim()).filter(t => t)
    const nextWarnings = updateData.overview.warnings ?? []
    const nextPreparationTime = `${updateData.overview.preparationTime}分`
    const nextProcessingTime = `${updateData.overview.processingTime}分`
    const nextDescription = updateData.description ? updateData.description : previousDescription

    this.recordChange('metadata.title', previousTitle, updateData.title)
    this.recordChange('metadata.difficulty', previousDifficulty, updateData.difficulty)
    this.recordChange('metadata.estimatedTime', previousEstimatedTime, nextEstimatedTime)
    this.recordChange('metadata.machineType', previousMachineType, nextMachineType)
    this.recordChange('metadata.toolsRequired', previousToolsRequired, nextToolsRequired)
    this.recordChange('overview.description', previousDescription, nextDescription)
    this.recordChange('overview.warnings', previousWarnings, nextWarnings)
    this.recordChange('overview.preparationTime', previousPreparationTime, nextPreparationTime)
    this.recordChange('overview.processingTime', previousProcessingTime, nextProcessingTime)

    // メタデータ更新
    instruction.metadata = {
      ...instruction.metadata,
      title: updateData.title,
      difficulty: updateData.difficulty,
      estimatedTime: nextEstimatedTime,
      machineType: nextMachineType,
      toolsRequired: nextToolsRequired,
      updatedDate: new Date().toISOString().split('T')[0]
    }

    // 概要更新
    instruction.overview = {
      ...instruction.overview,
      description: nextDescription,
      warnings: nextWarnings,
      preparationTime: nextPreparationTime,
      processingTime: nextProcessingTime
    }

    // 作業ステップ更新
    if (updateData.workSteps && updateData.workSteps.length > 0) {
      instruction.workSteps = updateData.workSteps
    }
    
    // 機械種別ごとの作業ステップ更新
    if (updateData.workStepsByMachine) {
      instruction.workStepsByMachine = updateData.workStepsByMachine
    }

    // ヒヤリハット事例更新
    if (updateData.nearMiss) {
      instruction.nearMiss = updateData.nearMiss
    }

    // 関連図番更新
    if (updateData.relatedDrawings) {
      instruction.relatedDrawings = updateData.relatedDrawings
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
      const previousEntry = searchIndex.drawings[drawingIndex]
      const nextEstimatedTime = `${updateData.estimatedTime}分`
      const nextMachineType = updateData.machineType
      const nextKeywords = updateData.keywords.split(',').map(k => k.trim()).filter(k => k)

      this.recordChange('searchIndex.title', previousEntry.title, updateData.title)
      this.recordChange('searchIndex.difficulty', previousEntry.difficulty, updateData.difficulty)
      this.recordChange('searchIndex.estimatedTime', previousEntry.estimatedTime, nextEstimatedTime)
      this.recordChange('searchIndex.machineType', previousEntry.machineType, nextMachineType)
      this.recordChange('searchIndex.keywords', Array.isArray(previousEntry.keywords) ? [...previousEntry.keywords] : [], nextKeywords)

      searchIndex.drawings[drawingIndex] = {
        ...searchIndex.drawings[drawingIndex],
        title: updateData.title,
        difficulty: updateData.difficulty,
        estimatedTime: nextEstimatedTime,
        machineType: nextMachineType,
        keywords: nextKeywords
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
      this.changeLog = []
    } catch (error) {
      console.error('ロールバックエラー:', error)
      throw new Error('データの復元に失敗しました')
    }
  }
}
