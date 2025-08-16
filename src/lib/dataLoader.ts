// src/lib/dataLoader.ts - データローダー統合エントリーポイント

// 型定義をエクスポート
export * from './types'

// ファイルユーティリティ
export * from './fileUtils'

// 企業・製品ローダー
export * from './companyLoader'

// 検索インデックスローダー
export * from './searchLoader'

// 作業手順ローダー
export * from './instructionLoader'

// 追記情報ローダー
export * from './contributionLoader'

// 注意: 上記の export * from でほぼ全てのエクスポートが提供されるため、
// 既存のimport文（例: import { WorkStep } from '@/lib/dataLoader'）は
// 変更なしで継続して動作します。