// src/app/api/admin/contributions/[drawingNumber]/route.ts - 追記管理API

import { NextRequest, NextResponse } from 'next/server'
import { getDataPath } from '@/lib/admin/utils'
import path from 'path'
import fs from 'fs/promises'
import { ContributionFile, ContributionData } from '@/types/contribution'

// 追記ファイルのパスを取得
function getContributionFilePath(drawingNumber: string): string {
  const dataPath = getDataPath()
  return path.join(dataPath, 'work-instructions', `drawing-${drawingNumber}`, 'contributions', 'contributions.json')
}

// 追記データを読み込み
async function loadContributions(drawingNumber: string): Promise<ContributionFile | null> {
  try {
    const filePath = getContributionFilePath(drawingNumber)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('追記データ読み込みエラー:', error)
    return null
  }
}

// 追記データを保存
async function saveContributions(drawingNumber: string, data: ContributionFile): Promise<void> {
  const filePath = getContributionFilePath(drawingNumber)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// 追記に関連するファイルを削除
async function deleteContributionFiles(drawingNumber: string, contribution: ContributionData): Promise<void> {
  if (!contribution.content.files || contribution.content.files.length === 0) {
    return
  }

  const dataPath = getDataPath()
  const contributionsDir = path.join(dataPath, 'work-instructions', `drawing-${drawingNumber}`, 'contributions')

  for (const file of contribution.content.files) {
    try {
      const filePath = path.join(contributionsDir, file.filePath)
      await fs.unlink(filePath)
    } catch (error) {
      console.error(`ファイル削除エラー: ${file.filePath}`, error)
    }
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { drawingNumber: string } }
) {
  try {
    const { drawingNumber } = params
    const body = await request.json()
    const { action, contributionId, contributionIndex, status } = body

    // 追記データを読み込み
    const contributionFile = await loadContributions(drawingNumber)
    if (!contributionFile) {
      return NextResponse.json(
        { error: '追記データが見つかりません' },
        { status: 404 }
      )
    }

    let updated = false

    switch (action) {
      case 'updateStatus':
        // ステータス更新
        if (!contributionId || !status) {
          return NextResponse.json(
            { error: 'contributionIdとstatusが必要です' },
            { status: 400 }
          )
        }

        for (let i = 0; i < contributionFile.contributions.length; i++) {
          if (contributionFile.contributions[i].id === contributionId) {
            contributionFile.contributions[i].status = status
            updated = true
            
            // mergedCountを更新
            contributionFile.metadata.mergedCount = contributionFile.contributions
              .filter(c => c.status === 'merged').length
            
            break
          }
        }
        break

      case 'delete':
        // 削除処理
        if (contributionId) {
          // IDで削除
          const index = contributionFile.contributions.findIndex(c => c.id === contributionId)
          if (index !== -1) {
            const deletedContribution = contributionFile.contributions[index]
            await deleteContributionFiles(drawingNumber, deletedContribution)
            contributionFile.contributions.splice(index, 1)
            updated = true
          }
        } else if (contributionIndex !== undefined) {
          // インデックスで削除（後方互換性のため）
          if (contributionIndex >= 0 && contributionIndex < contributionFile.contributions.length) {
            const deletedContribution = contributionFile.contributions[contributionIndex]
            await deleteContributionFiles(drawingNumber, deletedContribution)
            contributionFile.contributions.splice(contributionIndex, 1)
            updated = true
          }
        } else {
          return NextResponse.json(
            { error: 'contributionIdまたはcontributionIndexが必要です' },
            { status: 400 }
          )
        }
        
        // メタデータを更新
        if (updated) {
          contributionFile.metadata.totalContributions = contributionFile.contributions.length
          contributionFile.metadata.mergedCount = contributionFile.contributions
            .filter(c => c.status === 'merged').length
        }
        break

      default:
        return NextResponse.json(
          { error: '不正なアクションです' },
          { status: 400 }
        )
    }

    if (!updated) {
      return NextResponse.json(
        { error: '該当する追記が見つかりません' },
        { status: 404 }
      )
    }

    // 更新日時を記録
    contributionFile.metadata.lastUpdated = new Date().toISOString()

    // ファイルに保存
    await saveContributions(drawingNumber, contributionFile)

    return NextResponse.json({
      success: true,
      message: action === 'delete' ? '追記を削除しました' : 'ステータスを更新しました',
      metadata: contributionFile.metadata
    })

  } catch (error) {
    console.error('追記管理APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}