// src/lib/searchLoader.ts - 検索インデックスローダー

import { SearchIndex, DrawingSearchItem } from './types'

// 検索インデックス読み込み
export const loadSearchIndex = async (): Promise<SearchIndex> => {
  try {
    if (process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('🔍 検索インデックス読み込み情報:', {
        isServerSide: typeof window === 'undefined',
        nodeEnv: process.env.NODE_ENV
      })
    }
    // APIエンドポイントから取得（キャッシュされない）
    const response = await fetch('/api/search-index');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('検索インデックスの読み込みに失敗:', error);
    }
    return {
      drawings: [],
      metadata: {
        totalCount: 0,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      }
    };
  }
}

// 図番から検索アイテムを取得
export const getDrawingSearchItem = (searchIndex: SearchIndex, drawingNumber: string): DrawingSearchItem | null => {
  if (!searchIndex?.drawings) {
    console.warn('検索インデックスが利用できません')
    return null
  }
  
  return searchIndex.drawings.find(drawing => drawing.drawingNumber === drawingNumber) || null
}