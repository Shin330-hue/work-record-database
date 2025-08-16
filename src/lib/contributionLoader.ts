// src/lib/contributionLoader.ts - 追記情報ローダー

import { ContributionFile, ContributionData } from './types'
import { getDataPath } from './fileUtils'
import { loadSearchIndex } from './searchLoader'

// 追記データ読み込み
export const loadContributions = async (drawingNumber: string): Promise<ContributionFile> => {
  try {
    if (process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('🔍 追記データ読み込み情報:', {
        drawingNumber,
        isServerSide: typeof window === 'undefined',
        dataPath: getDataPath(),
        useNAS: process.env.USE_NAS,
        nodeEnv: process.env.NODE_ENV
      })
    }
    const response = await fetch(`/api/contribution?drawingNumber=${encodeURIComponent(drawingNumber)}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          drawingNumber,
          contributions: []
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`追記データの読み込みに失敗 (${drawingNumber}):`, error)
    }
    return {
      drawingNumber,
      contributions: []
    }
  }
}

// 全図番の最新追記データを取得
export const loadRecentContributions = async (limit: number = 10): Promise<{ drawingNumber: string, contribution: ContributionData, drawingTitle?: string }[]> => {
  try {
    // 検索インデックスから全図番を取得
    const searchIndex = await loadSearchIndex()
    const allContributions: { drawingNumber: string, contribution: ContributionData, drawingTitle?: string }[] = []

    // 各図番の追記データを並列取得
    const contributionPromises = searchIndex.drawings.map(async (drawing) => {
      try {
        const contributionFile = await loadContributions(drawing.drawingNumber)
        // すべてのステータスの追記を返す（管理画面用）
        return contributionFile.contributions
          .map(contribution => ({
            drawingNumber: drawing.drawingNumber,
            contribution,
            drawingTitle: drawing.title
          }))
      } catch {
        return []
      }
    })

    const results = await Promise.all(contributionPromises)
    results.forEach(contributions => {
      allContributions.push(...contributions)
    })

    // 投稿日時でソートして最新順に
    allContributions.sort((a, b) => 
      new Date(b.contribution.timestamp).getTime() - new Date(a.contribution.timestamp).getTime()
    )

    return allContributions.slice(0, limit)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('最新追記データの読み込みに失敗:', error)
    }
    return []
  }
}

// 全図番の全追記データを取得（管理画面用：全ステータス）
export const loadAllContributions = async (limit: number = 1000): Promise<{ drawingNumber: string, contribution: ContributionData, drawingTitle?: string }[]> => {
  try {
    // 検索インデックスから全図番を取得
    const searchIndex = await loadSearchIndex()
    const allContributions: { drawingNumber: string, contribution: ContributionData, drawingTitle?: string }[] = []

    // 各図番の追記データを並列取得
    const contributionPromises = searchIndex.drawings.map(async (drawing) => {
      try {
        const contributionFile = await loadContributions(drawing.drawingNumber)
        // 全ステータスの追記を返す（管理画面用）
        return contributionFile.contributions
          .map(contribution => ({
            drawingNumber: drawing.drawingNumber,
            contribution,
            drawingTitle: drawing.title
          }))
      } catch {
        return []
      }
    })

    const results = await Promise.all(contributionPromises)
    results.forEach(contributions => {
      allContributions.push(...contributions)
    })

    // 投稿日時でソートして最新順に
    allContributions.sort((a, b) => 
      new Date(b.contribution.timestamp).getTime() - new Date(a.contribution.timestamp).getTime()
    )

    return allContributions.slice(0, limit)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('全追記データの読み込みに失敗:', error)
    }
    return []
  }
}