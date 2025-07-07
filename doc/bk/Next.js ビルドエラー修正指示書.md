# Next.js ビルドエラー修正指示書（Cursor向け）

## 🎯 目標
`npm run build` と `npm run start` でエラーなく動作するように修正する

## 🔍 現在発生しているエラー

```
❌ Invalid next.config.js options detected: Unrecognized key(s) in object: 'turbo'
❌ Module not found: Can't resolve 'fs' in './src/lib/dataLoader.ts'
❌ Build failed because of webpack errors
```

## 🛠️ 修正手順

### 1. next.config.js の修正

**ファイル**: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境用設定
  output: 'standalone',
  
  // 静的アセット最適化
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  
  // 実験的機能（Next.js 15対応）
  experimental: {
    // turbo設定は削除（まだ安定していないため）
  },
  
  // Webpack設定
  webpack: (config, { isServer }) => {
    // クライアントサイドでfsモジュールを無効化
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    return config
  },
  
  // 環境変数設定
  env: {
    // 必要に応じて追加
  }
}

module.exports = nextConfig
```

### 2. src/lib/dataLoader.ts の完全書き換え

**ファイル**: `src/lib/dataLoader.ts`

```typescript
// src/lib/dataLoader.ts - クライアントサイド対応版

// 実行環境の判定
const isServerSide = (): boolean => typeof window === 'undefined'

// 環境に応じたデータパス取得（サーバーサイドのみ）
const getServerDataPath = (): string => {
  if (!isServerSide()) return '' // クライアントサイドでは空文字を返す

  // サーバーサイドでのみ環境変数を参照
  const USE_NAS = process.env.USE_NAS
  const DATA_ROOT_PATH = process.env.DATA_ROOT_PATH
  const DEV_DATA_ROOT_PATH = process.env.DEV_DATA_ROOT_PATH
  const DEBUG_DATA_LOADING = process.env.DEBUG_DATA_LOADING

  // デバッグ用ログ（サーバーサイドのみ）
  if (DEBUG_DATA_LOADING === 'true') {
    console.log('🔍 getServerDataPath 呼び出し:', {
      NODE_ENV: process.env.NODE_ENV,
      USE_NAS: USE_NAS,
      DATA_ROOT_PATH: DATA_ROOT_PATH,
      DEV_DATA_ROOT_PATH: DEV_DATA_ROOT_PATH
    })
  }

  // 本番環境
  if (process.env.NODE_ENV === 'production') {
    const path = DATA_ROOT_PATH || '/mnt/nas/project-data'
    if (DEBUG_DATA_LOADING === 'true') {
      console.log('🏭 本番環境パス:', path)
    }
    return path
  }
  
  // NAS使用開発環境
  if (USE_NAS === 'true') {
    const path = DATA_ROOT_PATH || 'Z:\\project-data'
    if (DEBUG_DATA_LOADING === 'true') {
      console.log('💾 NAS使用パス:', path)
    }
    return path
  }
  
  // ローカル開発環境
  const path = DEV_DATA_ROOT_PATH || './public/data_test'
  if (DEBUG_DATA_LOADING === 'true') {
    console.log('🖥️ ローカル開発パス:', path)
  }
  return path
}

// クライアントサイド用のパス取得
const getClientDataPath = (): string => {
  if (isServerSide()) return '' // サーバーサイドでは空文字を返す

  // window.USE_NAS を参照（layout.tsxで設定される）
  const USE_NAS = (window as any).USE_NAS
  
  if (USE_NAS === 'true') {
    return '/data' // NAS使用時はシンボリックリンク経由
  }
  return '/data_test' // ローカル開発時
}

// シンボリックリンク作成（サーバーサイドのみ）
const setupStaticFiles = async () => {
  if (!isServerSide()) return // クライアントサイドでは実行しない

  try {
    // 動的インポートでfsとpathを取得（サーバーサイドのみ）
    const { promises: fs } = await import('fs')
    const { default: path } = await import('path')
    const { existsSync } = await import('fs')

    const dataPath = getServerDataPath()
    const publicDataPath = path.join(process.cwd(), 'public', 'data')

    console.log('🔗 シンボリックリンクチェック:', {
      from: publicDataPath,
      to: dataPath,
      useNas: process.env.USE_NAS,
      nodeEnv: process.env.NODE_ENV
    })

    // NAS使用時のみシンボリックリンクをチェック
    if (process.env.NODE_ENV === 'production' || process.env.USE_NAS === 'true') {
      // Windows環境での特別処理
      if (process.platform === 'win32') {
        console.log('🪟 Windows環境: シンボリックリンクチェック')
        
        if (existsSync(publicDataPath)) {
          const stats = await fs.lstat(publicDataPath)
          if (stats.isSymbolicLink()) {
            console.log('✅ シンボリックリンクが存在します')
            return
          }
        }

        console.log('⚠️ シンボリックリンクが見つかりません')
        console.log('🛠️ 管理者権限で以下のコマンドを実行してください:')
        console.log(`mklink /D "${publicDataPath}" "${dataPath}"`)
        return
      }

      // Unix系での自動作成（Linux, macOS）
      if (existsSync(publicDataPath)) {
        const stats = await fs.lstat(publicDataPath)
        if (!stats.isSymbolicLink()) {
          await fs.rm(publicDataPath, { recursive: true, force: true })
        }
      }

      await fs.symlink(dataPath, publicDataPath)
      console.log(`✅ シンボリックリンク作成完了: ${publicDataPath} → ${dataPath}`)
    }
  } catch (error) {
    console.error('❌ シンボリックリンク処理エラー:', error)
  }
}

// アプリケーション起動時にセットアップ実行（サーバーサイドのみ）
if (isServerSide()) {
  setupStaticFiles()
}

// 型定義
export interface Company {
  id: string
  name: string
  shortName: string
  description: string
  priority: number
  products: Product[]
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  materials: string[]
  dimensions: string
  weight: string
  features: string[]
  specifications: Record<string, any>
  images: string[]
  drawing: string
}

export interface SearchIndex {
  drawings: DrawingSearchItem[]
  metadata: {
    totalDrawings: number
    lastIndexed: string
    version: string
  }
}

export interface DrawingSearchItem {
  drawingNumber: string
  productName: string
  companyName: string
  category: string
  description: string
  hasWorkInstruction: boolean
  hasImages: boolean
  hasVideos: boolean
  hasPdfs: boolean
  keywords: string[]
}

export interface WorkInstruction {
  drawingNumber: string
  productName: string
  version: string
  lastUpdated: string
  steps: WorkStep[]
  materials: Material[]
  tools: Tool[]
  safetyNotes: string[]
  qualityCheckpoints: QualityCheckpoint[]
}

export interface WorkStep {
  stepNumber: number
  title: string
  description: string
  imageUrls: string[]
  videoUrls: string[]
  estimatedTime: number
  difficulty: 'easy' | 'medium' | 'hard'
  notes: string[]
  qualityCheckpoints: string[]
}

export interface Material {
  name: string
  quantity: string
  supplier: string
  partNumber: string
  notes: string
}

export interface Tool {
  name: string
  type: string
  size: string
  notes: string
}

export interface QualityCheckpoint {
  id: string
  description: string
  checkMethod: string
  acceptanceCriteria: string
  frequency: string
}

// データローダー関数（クライアントサイドで実行）
export const loadCompanies = async (): Promise<Company[]> => {
  try {
    // クライアントサイドでのパス取得
    const basePath = isServerSide() ? '' : getClientDataPath()
    const url = `${basePath}/companies.json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('✅ 会社データ読み込み成功:', data.companies?.length || 0, '件')
    return data.companies || []
  } catch (error) {
    console.error('❌ 会社データの読み込みに失敗:', error)
    return []
  }
}

export const loadSearchIndex = async (): Promise<SearchIndex> => {
  try {
    const basePath = isServerSide() ? '' : getClientDataPath()
    const url = `${basePath}/search-index.json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('✅ 検索インデックス読み込み成功')
    return data
  } catch (error) {
    console.error('❌ 検索インデックスの読み込みに失敗:', error)
    return {
      drawings: [],
      metadata: {
        totalDrawings: 0,
        lastIndexed: new Date().toISOString(),
        version: '1.0'
      }
    }
  }
}

export const loadWorkInstruction = async (drawingNumber: string): Promise<WorkInstruction | null> => {
  try {
    const basePath = isServerSide() ? '' : getClientDataPath()
    const safeDrawingNumber = drawingNumber.replace(/[^a-zA-Z0-9-]/g, '-')
    const url = `${basePath}/work-instructions/drawing-${safeDrawingNumber}/instruction.json`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`図番 ${drawingNumber} の作業手順が見つかりません`)
    }
    
    const data = await response.json()
    console.log('✅ 作業手順読み込み成功:', drawingNumber)
    return data
  } catch (error) {
    console.error(`❌ 作業手順の読み込みに失敗 (${drawingNumber}):`, error)
    return null
  }
}
```

### 3. src/app/layout.tsx の修正

**ファイル**: `src/app/layout.tsx`

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.USE_NAS = "${process.env.USE_NAS || 'false'}";`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 4. .env.local の修正

**ファイル**: `.env.local`

```env
# 開発環境設定
NODE_ENV=development

# NAS使用フラグ（true: NAS使用, false: ローカル使用）
USE_NAS=true

# NAS設定（USE_NAS=trueの時に使用）
DATA_ROOT_PATH=Z:\project-data

# ローカル開発設定（USE_NAS=falseの時に使用）
DEV_DATA_ROOT_PATH=./public/data_test

# デバッグモード
DEBUG_DATA_LOADING=true
```

## 🔧 修正後の動作確認手順

### 1. 依存関係のクリーンアップ
```bash
# 既存のビルドファイルを削除
rm -rf .next
rm -rf node_modules

# パッケージを再インストール
npm install
```

### 2. ビルドテスト
```bash
# 本番ビルド実行
npm run build

# ✅ 成功時の出力例:
# ✓ Creating an optimized production build
# ✓ Compiled successfully
```

### 3. 本番モードテスト
```bash
# 本番モードで起動
npm run start

# ブラウザで確認
# http://localhost:3000
```

### 4. ネットワークアクセステスト
```bash
# 外部アクセス可能モードで起動
npm run start -- --hostname 0.0.0.0 --port 3000

# 他のPCから確認
# http://[あなたのIPアドレス]:3000
```

## ⚠️ 注意点

### Windows環境でのシンボリックリンク
管理者権限のコマンドプロンプトで以下を実行：
```cmd
cd C:\path\to\your\project
rmdir /S /Q public\data
mklink /D public\data Z:\project-data
```

### エラーが出た場合
1. **fsエラー**: dataLoader.tsのisServerSide()判定を確認
2. **turboエラー**: next.config.jsからturbo設定を完全削除
3. **環境変数エラー**: .env.localの設定を確認

## 🎯 修正のポイント

1. **サーバーサイド・クライアントサイドの分離**
   - `typeof window === 'undefined'` で実行環境を判定
   - fsモジュールはサーバーサイドのみで使用
   - fetchはクライアントサイドで使用

2. **動的インポートの活用**
   - `await import('fs')` でサーバーサイドのみでfsを読み込み
   - クライアントサイドではimportされない

3. **Webpack設定の追加**
   - クライアントサイドでのfsモジュールを無効化
   - `config.resolve.fallback`でfallback設定

この修正により、開発環境・本番環境の両方で `npm run build` と `npm run start` が正常に動作するようになります。