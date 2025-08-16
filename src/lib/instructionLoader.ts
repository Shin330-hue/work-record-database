// src/lib/instructionLoader.ts - 作業手順ローダー

import { WorkInstruction, Idea, InstructionMetadata } from './types'
import { sanitizeDrawingNumber } from './fileUtils'
import { loadSearchIndex } from './searchLoader'

// 作業手順読み込み
export const loadWorkInstruction = async (drawingNumber: string): Promise<WorkInstruction | null> => {
  try {
    if (process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('🔍 作業手順読み込み情報:', {
        drawingNumber,
        isServerSide: typeof window === 'undefined',
        nodeEnv: process.env.NODE_ENV
      })
    }
    // APIエンドポイントから取得（キャッシュされない）
    const response = await fetch(`/api/work-instruction/${encodeURIComponent(drawingNumber)}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`図番 ${drawingNumber} の作業手順が見つかりません`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const workInstruction: WorkInstruction = await response.json();
    
    // 検索インデックスから会社名と製品名を取得
    try {
      const searchIndex = await loadSearchIndex();
      const drawingSearchItem = searchIndex.drawings.find(d => d.drawingNumber === drawingNumber);
      
      if (drawingSearchItem) {
        // 型安全性のためのプロパティ追加チェック
        if ('companyName' in workInstruction.metadata) {
          (workInstruction.metadata as InstructionMetadata & { companyName?: string }).companyName = drawingSearchItem.company.name;
        }
        if ('productName' in workInstruction.metadata) {
          (workInstruction.metadata as InstructionMetadata & { productName?: string }).productName = drawingSearchItem.product.name;
        }
      }
    } catch (error) {
      console.error('会社名・製品名の取得に失敗:', error);
    }
    
    return workInstruction;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`作業手順の読み込みに失敗 (${drawingNumber}):`, error);
    }
    return null;
  }
}

// 関連アイデア読み込み
export const loadRelatedIdeas = async (ideaPaths: string[]): Promise<Idea[]> => {
  if (!ideaPaths || ideaPaths.length === 0) {
    return []
  }

  try {
    // APIエンドポイントからアイデアデータを取得
    const response = await fetch('/api/ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paths: ideaPaths })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.ideas || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('関連アイデアの読み込みに失敗:', error)
    }
    return []
  }
}

// 図番をファイル名安全な形式に変換する関数（外部からも利用可能）
export { sanitizeDrawingNumber }