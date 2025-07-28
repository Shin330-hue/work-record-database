// src/app/api/search-index/route.ts - 検索インデックスAPI

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getDataPath } from '@/lib/admin/utils'

export async function GET() {
  try {
    // ファイルパスの構築
    const dataPath = getDataPath()
    const filePath = path.join(dataPath, 'search-index.json')

    // ファイルの読み込み
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const searchIndex = JSON.parse(fileContent)
      
      // キャッシュ制御ヘッダーを設定（キャッシュを無効化）
      return NextResponse.json(searchIndex, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } catch (error) {
      console.error('検索インデックス読み込みエラー:', error)
      return NextResponse.json(
        {
          drawings: [],
          metadata: {
            totalDrawings: 0,
            lastIndexed: new Date().toISOString(),
            version: '1.0'
          }
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }
  } catch (error) {
    console.error('検索インデックス取得エラー:', error)
    return NextResponse.json(
      { error: '検索インデックスの取得に失敗しました' },
      { status: 500 }
    )
  }
}