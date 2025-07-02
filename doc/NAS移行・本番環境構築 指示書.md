# NAS移行・本番環境構築 指示書

## 📋 概要

案件記録データベースプロジェクトのデータを、ローカルからNASに移行し、本番環境での運用を開始します。また、将来的なシステム拡張に向けた基盤を構築します。

---

## 🎯 実行計画

### Phase 1: 開発環境のNAS移行 ⭐⭐⭐⭐⭐
**目標**: 開発環境でNAS上のデータにアクセスできるよう修正し、動作確認

### Phase 2: 本番環境構築 ⭐⭐⭐⭐⭐  
**目標**: 本番サーバーにプロジェクトをデプロイし、NAS連携で稼働確認

### Phase 3: デプロイメント体制構築 ⭐⭐⭐⭐
**目標**: 開発→本番への継続的デプロイ体制を確立

### Phase 4: 拡張基盤準備 ⭐⭐⭐
**目標**: 将来のGUIツール・生産管理アプリに向けた共通基盤を整備

---

## 🚀 Phase 1: 開発環境のNAS移行

### 1.1 NASマウント設定

#### **手順1: NAS接続設定ファイル作成**
```bash
# プロジェクトルートに .env.nas を作成
touch .env.nas
```

```bash
# .env.nas の内容
NAS_HOST=192.168.1.100
NAS_SHARE=shared
NAS_USERNAME=nasuser
NAS_PASSWORD=yourpassword
NAS_MOUNT_POINT=/mnt/project-nas
DATA_ROOT_PATH=/mnt/project-nas/project-data
```

#### **手順2: NASマウントスクリプト作成**
```bash
# scripts/mount-nas.sh を作成
mkdir -p scripts
```

```bash
#!/bin/bash
# scripts/mount-nas.sh

set -e

# 環境変数読み込み
source .env.nas

echo "🔗 NAS接続開始: ${NAS_HOST}/${NAS_SHARE}"

# マウントポイント作成
sudo mkdir -p ${NAS_MOUNT_POINT}

# 既存マウントをアンマウント（エラー無視）
sudo umount ${NAS_MOUNT_POINT} 2>/dev/null || true

# NASマウント実行
sudo mount -t cifs //${NAS_HOST}/${NAS_SHARE} ${NAS_MOUNT_POINT} \
  -o username=${NAS_USERNAME},password=${NAS_PASSWORD},uid=$(id -u),gid=$(id -g),file_mode=0755,dir_mode=0755

echo "✅ NASマウント完了: ${NAS_MOUNT_POINT}"
echo "📁 データパス: ${DATA_ROOT_PATH}"

# マウント確認
ls -la ${NAS_MOUNT_POINT}
```

```bash
# 実行権限付与
chmod +x scripts/mount-nas.sh
```

### 1.2 データローダー修正（シンプル版）

#### **修正対象**: `src/lib/dataLoader.ts`

**重要**: APIエンドポイントを新規作成する必要はありません。既存の仕組みを活用します。

```typescript
import { promises as fs } from 'fs'
import path from 'path'

// 環境に応じたデータパス取得
const getDataPath = (): string => {
  // 本番環境（社内ノートPC）
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  
  // NAS使用開発環境
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  
  // ローカル開発環境（既存）
  return './public/data'
}

// Next.js の静的ファイル配信を活用
const setupStaticFiles = async () => {
  const dataPath = getDataPath()
  const publicDataPath = path.join(process.cwd(), 'public', 'data')
  
  // 本番環境またはNAS使用時は、publicフォルダにシンボリックリンクを作成
  if (process.env.NODE_ENV === 'production' || process.env.USE_NAS === 'true') {
    try {
      // 既存のpublic/dataが存在する場合は削除
      if (require('fs').existsSync(publicDataPath)) {
        await fs.rm(publicDataPath, { recursive: true, force: true })
      }
      
      // NASデータへのシンボリックリンクを作成
      await fs.symlink(dataPath, publicDataPath)
      console.log(`✅ シンボリックリンク作成: ${publicDataPath} → ${dataPath}`)
    } catch (error) {
      console.error('⚠️ シンボリックリンク作成失敗:', error)
      // フォールバック: データをコピー
      await fs.cp(dataPath, publicDataPath, { recursive: true })
      console.log(`✅ データコピー完了: ${dataPath} → ${publicDataPath}`)
    }
  }
}

// アプリケーション起動時にセットアップ実行
if (typeof window === 'undefined') {
  setupStaticFiles()
}

// 既存のデータローダー関数はそのまま使用
export const loadCompanies = async (): Promise<Company[]> => {
  try {
    const response = await fetch('/data/companies.json') // 既存のパス
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.companies || []
  } catch (error) {
    console.error('会社データの読み込みに失敗:', error)
    return []
  }
}

export const loadSearchIndex = async (): Promise<SearchIndex> => {
  try {
    const response = await fetch('/data/search-index.json') // 既存のパス
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('検索インデックスの読み込みに失敗:', error)
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
    const safeDrawingNumber = drawingNumber.replace(/[^a-zA-Z0-9-]/g, '-')
    const response = await fetch(`/data/work-instructions/drawing-${safeDrawingNumber}/instruction.json`)
    
    if (!response.ok) {
      throw new Error(`図番 ${drawingNumber} の作業手順が見つかりません`)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`作業手順の読み込みに失敗 (${drawingNumber}):`, error)
    return null
  }
}
```

### 1.3 ファイルAPI修正（シンプル版）

#### **修正対象**: `src/app/api/files/route.ts`

APIエンドポイントの新規作成は不要ですが、既存のfiles APIは修正が必要です（画像・動画・PDFファイルアクセス用）。

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const getDataRootPath = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  return join(process.cwd(), 'public', 'data')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const drawingNumber = searchParams.get('drawingNumber')
    const folderType = searchParams.get('folderType')
    const subFolder = searchParams.get('subFolder') || ''

    if (!drawingNumber || !folderType) {
      return NextResponse.json(
        { error: 'drawingNumber と folderType は必須です' },
        { status: 400 }
      )
    }

    // データルートパスを取得
    const dataRoot = getDataRootPath()
    
    // NAS使用時とローカル使用時でパスを分岐
    let folderPath: string
    
    if (process.env.NODE_ENV === 'production' || process.env.USE_NAS === 'true') {
      // NAS使用時: 直接NASパス
      folderPath = join(dataRoot, 'work-instructions', `drawing-${drawingNumber}`, folderType)
      if (subFolder) {
        folderPath = join(folderPath, subFolder)
      }
    } else {
      // ローカル開発時: publicフォルダ
      folderPath = join(process.cwd(), 'public', 'data', 'work-instructions', `drawing-${drawingNumber}`, folderType)
      if (subFolder) {
        folderPath = join(folderPath, subFolder)
      }
    }

    console.log(`📁 ファイル検索パス: ${folderPath}`)

    // フォルダが存在するかチェック
    if (!existsSync(folderPath)) {
      console.log(`⚠️ フォルダが存在しません: ${folderPath}`)
      return NextResponse.json({ files: [] })
    }

    // フォルダ内のファイル一覧を取得
    const files = await readdir(folderPath)
    
    // ファイルのみをフィルタリング
    const fileList = []
    for (const file of files) {
      const filePath = join(folderPath, file)
      const stats = await stat(filePath)
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

    console.log(`✅ ファイル一覧取得完了: ${filteredFiles.length}個のファイル`)

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
```

#### **修正対象**: `src/app/api/files/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const getDataRootPath = (): string => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  return join(process.cwd(), 'public', 'data')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const drawingNumber = searchParams.get('drawingNumber')
    const folderType = searchParams.get('folderType')
    const subFolder = searchParams.get('subFolder') || ''

    if (!drawingNumber || !folderType) {
      return NextResponse.json(
        { error: 'drawingNumber と folderType は必須です' },
        { status: 400 }
      )
    }

    // NAS/ローカルパスに応じたベースパス
    const dataRoot = getDataRootPath()
    const basePath = join(dataRoot, 'work-instructions', `drawing-${drawingNumber}`, folderType)
    const folderPath = subFolder ? join(basePath, subFolder) : basePath

    console.log(`📁 ファイル検索パス: ${folderPath}`)

    // フォルダが存在するかチェック
    if (!existsSync(folderPath)) {
      console.log(`⚠️ フォルダが存在しません: ${folderPath}`)
      return NextResponse.json({ files: [] })
    }

    // フォルダ内のファイル一覧を取得
    const files = await readdir(folderPath)
    
    // ファイルのみをフィルタリング
    const fileList = []
    for (const file of files) {
      const filePath = join(folderPath, file)
      const stats = await stat(filePath)
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

    console.log(`✅ ファイル一覧取得完了: ${filteredFiles.length}個のファイル`)

    return NextResponse.json({
      files: filteredFiles,
      folderPath: folderPath.replace(dataRoot, ''),
      count: filteredFiles.length,
      dataRoot: dataRoot
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
```

### 1.5 環境変数設定

#### **修正対象**: `.env.local`

```bash
# 開発環境設定
NODE_ENV=development

# NAS使用フラグ（true: NAS使用, false: ローカル使用）
USE_NAS=false

# NAS設定（USE_NAS=trueの時に使用）
DATA_ROOT_PATH=/mnt/project-nas/project-data

# ローカル開発設定
DEV_DATA_ROOT_PATH=./public/data

# デバッグモード
DEBUG_DATA_LOADING=true
```

### 1.6 動作確認手順

#### **手順1: ローカル環境での動作確認**
```bash
# 従来通りローカルデータで動作確認
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# すべての機能が正常動作することを確認
```

#### **手順2: NAS接続テスト**
```bash
# NASマウント実行
./scripts/mount-nas.sh

# マウント確認
ls -la /mnt/project-nas/project-data

# 必要に応じてデータをNASにコピー
sudo cp -r ./public/data/* /mnt/project-nas/project-data/
```

#### **手順3: NAS環境での動作確認**
```bash
# NAS使用モードで起動
USE_NAS=true npm run dev

# ブラウザで動作確認
# エラーログをコンソールで確認
```

#### **手順4: デバッグ用ログ追加**
各データローダー関数に以下のログを追加：

```typescript
console.log('🔍 データ読み込み情報:', {
  isServerSide: isServerSide(),
  dataPath: getDataPath(),
  useNAS: process.env.USE_NAS,
  nodeEnv: process.env.NODE_ENV
})
```

---

## 🏭 Phase 2: 本番環境構築

### 2.1 本番環境要件（社内ノートPC）

#### **システム要件**
- OS: Windows 10/11 または Ubuntu 20.04 LTS 以上
- Node.js: 18.x 以上  
- メモリ: 4GB 以上
- ストレージ: 20GB 以上（アプリ用）
- ネットワーク: NASアクセス可能な社内ネットワーク

#### **必要なパッケージ（Ubuntu/WSLの場合）**
```bash
# 社内ノートPCでのセットアップ
sudo apt update
sudo apt install -y cifs-utils nodejs npm git

# Node.js最新版インストール（必要に応じて）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### **Windowsの場合**
- Git for Windows
- Node.js インストーラー
- 必要に応じてWSL2をセットアップ

### 2.2 社内ノートPCセットアップ

#### **手順1: プロジェクトセットアップ**
```bash
# プロジェクトフォルダ作成
mkdir -p /home/user/projects
cd /home/user/projects

# プロジェクトクローン
git clone https://github.com/your-username/project-record-database.git
cd project-record-database
```

#### **手順2: 社内ノートPC用環境設定**
```bash
# .env.production を作成
touch .env.production
```

```bash
# .env.production の内容（社内ノートPC用）
NODE_ENV=production
USE_NAS=true
DATA_ROOT_PATH=/mnt/nas/project-data

# 社内NAS設定
NAS_HOST=192.168.1.100
NAS_SHARE=shared
NAS_USERNAME=company_user
NAS_PASSWORD=company_password
NAS_MOUNT_POINT=/mnt/nas
```

#### **手順3: NAS自動マウント設定（社内ノートPC）**
```bash
# credentialsファイル作成（セキュリティ向上）
sudo mkdir -p /etc/cifs-credentials
echo "username=company_user" | sudo tee /etc/cifs-credentials/nas
echo "password=company_password" | sudo tee -a /etc/cifs-credentials/nas
echo "domain=COMPANY" | sudo tee -a /etc/cifs-credentials/nas
sudo chmod 600 /etc/cifs-credentials/nas

# /etc/fstab に追加（永続マウント）
echo "//192.168.1.100/shared /mnt/nas cifs credentials=/etc/cifs-credentials/nas,uid=1000,gid=1000,file_mode=0755,dir_mode=0755,iocharset=utf8 0 0" | sudo tee -a /etc/fstab

# マウント実行
sudo mkdir -p /mnt/nas
sudo mount -a

# マウント確認
ls -la /mnt/nas/project-data
```

#### **手順4: 開発用起動設定（PM2不要）**
```bash
# 依存関係インストール
npm ci --only=production

# 社内ノートPC用ビルド
npm run build

# package.jsonにスクリプト追加
# "scripts": {
#   "start:company": "NODE_ENV=production USE_NAS=true npm start"
# }

# 起動（バックグラウンド実行）
nohup npm run start:company > app.log 2>&1 &

# または単純起動
USE_NAS=true npm start
```

#### **手順5: 社内アクセス設定（Nginx不要の場合）**
```bash
# ファイアウォール設定（社内からのアクセス許可）
sudo ufw allow from 192.168.1.0/24 to any port 3000

# 起動確認
curl http://localhost:3000/api/files?drawingNumber=test&folderType=images
```

### 2.3 Nginx設定

#### **Nginx設定ファイル作成**
```bash
# /etc/nginx/sites-available/project-record-database
sudo nano /etc/nginx/sites-available/project-record-database
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静的ファイル配信（必要に応じて）
    location /_next/static/ {
        alias /opt/project-record-database/.next/static/;
        expires 365d;
        access_log off;
    }
}
```

```bash
# サイト有効化
sudo ln -s /etc/nginx/sites-available/project-record-database /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2.4 本番環境動作確認

#### **確認項目**
1. **アプリケーション起動確認**
   ```bash
   pm2 status
   pm2 logs project-record-database
   ```

2. **NASアクセス確認**
   ```bash
   curl http://localhost:3000/api/data/companies
   curl http://localhost:3000/api/data/search-index
   ```

3. **ブラウザアクセス確認**
   - http://your-domain.com にアクセス
   - 全機能の動作確認

4. **ログ監視**
   ```bash
   tail -f /var/log/pm2/project-record-database.log
   ```

---

## 🔄 Phase 3: デプロイメント体制構築

### 3.1 Git ワークフロー設定

#### **ブランチ戦略**
```
main (本番環境)
  ↑
develop (開発環境)
  ↑
feature/* (機能開発)
```

#### **本番デプロイスクリプト作成**
```bash
# scripts/deploy-production.sh を作成
```

```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

PRODUCTION_SERVER="your-server.com"
PRODUCTION_USER="deploy"
PROJECT_PATH="/opt/project-record-database"

echo "🚀 本番デプロイ開始"

# 本番サーバーでの作業
ssh ${PRODUCTION_USER}@${PRODUCTION_SERVER} << 'EOF'
  cd /opt/project-record-database
  
  echo "📥 最新コードの取得"
  git pull origin main
  
  echo "📦 依存関係の更新"
  npm ci --only=production
  
  echo "🏗️ アプリケーションビルド"
  npm run build
  
  echo "🔄 アプリケーション再起動"
  pm2 restart project-record-database
  
  echo "✅ デプロイ完了"
  pm2 status
EOF

echo "🎉 本番環境デプロイ完了！"
```

```bash
chmod +x scripts/deploy-production.sh
```

### 3.2 開発環境での更新フロー

#### **日常的な開発フロー**
```bash
# 1. 機能開発
git checkout -b feature/new-search-function
# 開発作業...

# 2. 開発環境での動作確認
USE_NAS=true npm run dev

# 3. developブランチにマージ
git checkout develop
git merge feature/new-search-function

# 4. 本番リリース準備
git checkout main  
git merge develop

# 5. 本番デプロイ
./scripts/deploy-production.sh
```

### 3.3 監視・メンテナンス

#### **日次監視スクリプト**
```bash
# scripts/health-check.sh を作成
```

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🏥 システムヘルスチェック開始"

# アプリケーション状態確認
echo "📱 アプリケーション状態:"
pm2 status

# NASマウント確認
echo "💾 NASマウント状態:"
mount | grep nas

# ディスク使用量確認
echo "💿 ディスク使用量:"
df -h

# メモリ使用量確認
echo "🧠 メモリ使用量:"
free -h

# ログファイルサイズ確認
echo "📄 ログファイルサイズ:"
ls -lh /var/log/pm2/

echo "✅ ヘルスチェック完了"
```

---

## 🔮 Phase 4: 拡張基盤準備

### 4.1 共通データアクセス層の設計

#### **共通ライブラリ作成**
```bash
# 新規プロジェクト: project-data-lib
mkdir ../project-data-lib
cd ../project-data-lib
npm init -y
```

#### **共通データアクセス関数**
```typescript
// project-data-lib/src/index.ts
export interface DataAccessConfig {
  dataRootPath: string
  nasConfig?: {
    host: string
    share: string
    username: string
    password: string
  }
}

export class ProjectDataAccess {
  private config: DataAccessConfig

  constructor(config: DataAccessConfig) {
    this.config = config
  }

  async getCompanies(): Promise<Company[]> {
    // 共通のデータアクセス実装
  }

  async getWorkInstruction(drawingNumber: string): Promise<WorkInstruction | null> {
    // 共通の作業手順取得実装
  }

  async searchDrawings(query: string): Promise<DrawingSearchItem[]> {
    // 共通の検索実装
  }

  // 将来の管理GUI用メソッド
  async updateWorkInstruction(drawingNumber: string, instruction: WorkInstruction): Promise<void> {
    // 作業手順更新
  }

  async addNewDrawing(drawing: NewDrawing): Promise<void> {
    // 新規図番追加
  }
}
```

### 4.2 API Gateway設計

#### **共通API仕様**
```yaml
# api-spec.yaml
openapi: 3.0.0
info:
  title: Project Data API
  version: 1.0.0

paths:
  /api/v1/companies:
    get:
      summary: 会社一覧取得
      
  /api/v1/drawings/search:
    get:
      summary: 図番検索
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            
  /api/v1/drawings/{drawingNumber}/instruction:
    get:
      summary: 作業手順取得
    put:
      summary: 作業手順更新 (管理GUI用)
      
  /api/v1/production/schedule:
    get:
      summary: 生産スケジュール取得 (生産管理アプリ用)
```

### 4.3 将来アプリケーション用の準備

#### **管理GUI (project-admin-gui)**
```typescript
// 将来の管理GUIプロジェクト構成例
project-admin-gui/
├── src/
│   ├── components/
│   │   ├── DrawingEditor.tsx      # 図番編集画面
│   │   ├── InstructionEditor.tsx  # 作業手順編集画面
│   │   └── FileUploader.tsx       # 画像・動画アップロード
│   └── lib/
│       └── dataAccess.ts          # project-data-lib使用
├── package.json
└── .env
```

#### **生産管理アプリ (production-management)**
```typescript
// 将来の生産管理アプリ構成例
production-management/
├── src/
│   ├── components/
│   │   ├── ProductionSchedule.tsx # 生産スケジュール
│   │   ├── WorkOrderList.tsx      # 作業指示一覧
│   │   └── ProgressTracker.tsx    # 進捗管理
│   └── lib/
│       └── dataAccess.ts          # project-data-lib使用
├── package.json
└── .env
```

### 4.4 データ更新権限設計

#### **権限マトリックス**
```typescript
interface UserPermissions {
  // 案件記録データベース（現在のプロジェクト）
  database: {
    read: boolean      // 参照権限
  }
  
  // 管理GUI（将来のプロジェクト）
  admin: {
    read: boolean      // 参照権限
    write: boolean     // 編集権限
    delete: boolean    // 削除権限
    upload: boolean    // ファイルアップロード権限
  }
  
  // 生産管理アプリ（将来のプロジェクト）
  production: {
    read: boolean      // スケジュール参照
    schedule: boolean  // スケジュール編集
    progress: boolean  // 進捗更新
  }
}
```

---

## 📝 作業チェックリスト

### Phase 1: 開発環境NAS移行
- [ ] .env.nas ファイル作成
- [ ] NASマウントスクリプト作成・テスト
- [ ] dataLoader.ts 修正（シンプル版・シンボリックリンク方式）
- [ ] files API 修正
- [ ] ローカル環境での動作確認
- [ ] NAS環境での動作確認

### Phase 2: 社内ノートPC環境構築  
- [ ] 社内ノートPC準備
- [ ] プロジェクトクローン
- [ ] .env.production 設定
- [ ] NAS自動マウント設定
- [ ] アプリケーションビルド
- [ ] 起動設定（PM2またはシンプル起動）
- [ ] 社内ネットワークからのアクセス確認

### Phase 3: デプロイメント体制
- [ ] Git ワークフロー設定
- [ ] デプロイスクリプト作成（社内ノートPC用）
- [ ] 監視スクリプト作成
- [ ] 開発→社内ノートPC環境フロー確立

### Phase 4: 将来の本格サーバー移行準備
- [ ] 共通データアクセス層設計
- [ ] API Gateway仕様策定
- [ ] 権限管理設計
- [ ] 本格サーバー要件定義

---

## 📝 重要な修正点

### APIエンドポイント新規作成について

**結論**: APIエンドポイントの新規作成は**不要**です。

#### **理由**
1. **既存の仕組みが継続利用可能**
   ```typescript
   // 現在のコード（変更不要）
   const response = await fetch('/data/companies.json')
   ```

2. **シンボリックリンクで解決**
   ```bash
   # public/data → NAS上のデータへのリンク
   ln -s /mnt/nas/project-data /path/to/project/public/data
   ```

3. **Next.js静的ファイル配信の活用**
   - `/public/data/*` は自動的に `/data/*` でアクセス可能
   - 既存のフロントエンドコードの修正が不要

#### **必要な修正は最小限**
- `dataLoader.ts`: シンボリックリンク作成ロジックの追加のみ
- `files API`: パス解決ロジックの修正のみ
- その他: 環境変数の追加のみ

---

## 🔧 トラブルシューティング（更新版）

### NAS接続関連

#### **問題: NASマウントに失敗する**
```bash
# エラー確認
dmesg | grep cifs
tail -f /var/log/syslog

# 手動マウントテスト
sudo mount -t cifs //192.168.1.100/shared /mnt/test \
  -o username=nasuser,password=password,vers=2.0

# CIFS-utils確認
sudo apt install cifs-utils
```

#### **問題: シンボリックリンク作成に失敗する**
```bash
# 権限確認
ls -la public/
sudo chown -R $(whoami):$(whoami) public/

# 手動シンボリックリンク作成
rm -rf public/data
ln -s /mnt/nas/project-data public/data

# シンボリックリンク確認
ls -la public/data
```

#### **問題: 権限エラーでファイルアクセスできない**
```bash
# マウント時の権限設定確認
sudo mount -t cifs //nas-host/share /mnt/nas \
  -o username=user,password=pass,uid=$(id -u),gid=$(id -g),file_mode=0755,dir_mode=0755

# 現在の権限確認
ls -la /mnt/nas/project-data/

# Node.js実行ユーザーの確認
whoami
id
```

### 社内ノートPC特有の問題

#### **問題: 社内ネットワークから他PCでアクセスできない**
```bash
# Next.jsを0.0.0.0でバインド
npm start -- -H 0.0.0.0

# または package.json で設定
# "scripts": {
#   "start:company": "next start -H 0.0.0.0 -p 3000"
# }

# ファイアウォール確認
sudo ufw status
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

#### **問題: Windowsでの開発環境セットアップ**
```powershell
# WSL2セットアップ
wsl --install -d Ubuntu-20.04

# Windows側でNASマウント
net use Z: \\192.168.1.100\shared /user:nasuser password

# WSL内からWindowsマウントにアクセス
ln -s /mnt/z/project-data /home/user/project/public/data
```

#### **問題: 社内ノートPCの電源管理**
```bash
# スリープ無効化（開発用ノートPCの場合）
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# 画面のみOFF（必要に応じて）
xset dpms 300 600 900
```

### データ移行関連

#### **問題: 大容量ファイルの移行が遅い**
```bash
# rsyncで差分同期
rsync -av --progress ./public/data/ /mnt/nas/project-data/

# 並列コピー（GNU parallelがある場合）
find ./public/data -type f | parallel -j 4 cp {} /mnt/nas/project-data/{}
```

#### **問題: ファイルパスの文字化け**
```bash
# マウント時にiocharset指定
sudo mount -t cifs //nas-host/share /mnt/nas \
  -o username=user,password=pass,iocharset=utf8

# ファイル名確認
ls -la /mnt/nas/project-data/ | less
```

---

## 📋 運用・保守指針（社内ノートPC版）

### 日次運用作業（社内ノートPC）

#### **毎日の確認項目**
```bash
# 1. アプリケーション状態確認
ps aux | grep node
curl -f http://localhost:3000/data/companies.json

# 2. NASマウント状態確認
df -h | grep nas
ls -la /mnt/nas/project-data/

# 3. ログ確認（PM2使用時）
pm2 status
pm2 logs --lines 50

# 4. ディスク使用量確認
df -h
```

#### **週次メンテナンス（社内ノートPC）**
```bash
# 1. システム更新（業務時間外）
sudo apt update && sudo apt upgrade -y

# 2. ログローテーション
sudo logrotate -f /etc/logrotate.conf

# 3. 開発環境同期
cd /home/user/projects/project-record-database
git pull origin main
npm ci --only=production
npm run build

# 4. 再起動（必要に応じて）
pm2 restart all
# または
sudo reboot
```

### 社内ノートPC運用のベストプラクティス

#### **1. 自動起動設定**
```bash
# systemdサービス作成
sudo tee /etc/systemd/system/project-database.service > /dev/null <<EOF
[Unit]
Description=Project Record Database
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/projects/project-record-database
Environment=NODE_ENV=production
Environment=USE_NAS=true
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# サービス有効化
sudo systemctl daemon-reload
sudo systemctl enable project-database
sudo systemctl start project-database
```

#### **2. バックアップ戦略（社内環境）**
```bash
# 日次バックアップスクリプト
#!/bin/bash
# scripts/backup-company.sh

BACKUP_DATE=$(date +%Y%m%d)
SOURCE_DIR="/mnt/nas/project-data"
BACKUP_DIR="/home/user/backups/project-data-${BACKUP_DATE}"
USB_BACKUP="/media/user/backup-usb/project-data-${BACKUP_DATE}"

# ローカルバックアップ
mkdir -p /home/user/backups
rsync -av ${SOURCE_DIR}/ ${BACKUP_DIR}/

# USBバックアップ（USB接続時）
if [ -d "/media/user/backup-usb" ]; then
    rsync -av ${BACKUP_DIR}/ ${USB_BACKUP}/
    echo "✅ USBバックアップ完了"
fi

# 古いバックアップ削除（7日以上）
find /home/user/backups/ -name "project-data-*" -mtime +7 -exec rm -rf {} \;

echo "✅ バックアップ完了: ${BACKUP_DATE}"
```

#### **3. ネットワーク監視**
```bash
# scripts/check-network.sh
#!/bin/bash

NAS_HOST="192.168.1.100"
APP_PORT="3000"

# NAS接続確認
if ping -c 1 ${NAS_HOST} > /dev/null 2>&1; then
    echo "✅ NAS接続OK: ${NAS_HOST}"
else
    echo "❌ NAS接続NG: ${NAS_HOST}"
    # 自動再マウント試行
    sudo umount /mnt/nas 2>/dev/null
    sudo mount -a
fi

# アプリケーション応答確認
if curl -f http://localhost:${APP_PORT}/data/companies.json > /dev/null 2>&1; then
    echo "✅ アプリケーションOK"
else
    echo "❌ アプリケーション応答なし"
    # 自動再起動
    pm2 restart all 2>/dev/null || systemctl restart project-database
fi
```

---

## 🚀 将来の本格サーバー移行計画

### フェーズ別移行戦略

#### **Phase A: 社内ノートPC（現在）**
```
[開発PC] → [社内ノートPC] ← [NAS]
              ↑
         [社内ユーザー]
```

#### **Phase B: 専用サーバー（将来）**
```
[開発PC] → [専用サーバー] ← [NAS]
              ↑
         [社内ユーザー]
         [外部ユーザー]
```

#### **Phase C: クラウド・ハイブリッド（長期）**
```
[開発PC] → [クラウド] ← [NAS + クラウドストレージ]
              ↑
         [全ユーザー]
```

### 本格サーバー要件（将来）

#### **ハードウェア要件**
- CPU: 4コア以上
- メモリ: 8GB以上
- ストレージ: SSD 100GB以上
- ネットワーク: 1Gbps
- UPS: 停電対策

#### **ソフトウェア要件**
- OS: Ubuntu Server LTS
- 仮想化: Docker + Docker Compose
- リバースプロキシ: Nginx
- 監視: Prometheus + Grafana
- ログ管理: ELK Stack
- バックアップ: 自動化スクリプト

#### **移行時の考慮事項**
```bash
# データベース移行準備
# JSON → PostgreSQL/MySQL 移行計画
# ファイルストレージ → オブジェクトストレージ移行

# セキュリティ強化
# HTTPS化（Let's Encrypt）
# 認証システム導入
# VPN接続対応

# 高可用性対応
# ロードバランサー
# レプリケーション
# 自動フェイルオーバー
```

---

## 🔮 拡張システム設計（更新版）

### データ管理GUI（Phase 4対応）

#### **機能要件**
```typescript
interface DataManagementGUI {
  // 基本CRUD操作
  companies: {
    create: (company: Company) => Promise<void>
    read: () => Promise<Company[]>
    update: (id: string, company: Company) => Promise<void>
    delete: (id: string) => Promise<void>
  }
  
  // 図番管理
  drawings: {
    create: (drawing: DrawingData) => Promise<void>
    update: (drawingNumber: string, drawing: DrawingData) => Promise<void>
    uploadFiles: (drawingNumber: string, files: FileList) => Promise<void>
    generatePDF: (drawingNumber: string) => Promise<Blob>
  }
  
  // バッチ処理
  batch: {
    importFromExcel: (file: File) => Promise<ImportResult>
    exportToExcel: () => Promise<Blob>
    syncWithNAS: () => Promise<SyncResult>
  }
}
```

#### **技術スタック**
- フロントエンド: Next.js + TypeScript
- UI: shadcn/ui + Tailwind CSS
- ファイルアップロード: react-dropzone
- データ検証: zod
- 状態管理: Zustand

### 生産管理アプリ（Phase 4対応）

#### **機能要件**
```typescript
interface ProductionManagement {
  // スケジュール管理
  schedule: {
    createWorkOrder: (order: WorkOrder) => Promise<void>
    getSchedule: (date: string) => Promise<Schedule>
    updateProgress: (orderId: string, progress: Progress) => Promise<void>
  }
  
  // 実績管理
  performance: {
    recordWorkTime: (drawingNumber: string, time: WorkTime) => Promise<void>
    generateReport: (period: Period) => Promise<Report>
    analyzeEfficiency: () => Promise<AnalysisResult>
  }
  
  // リアルタイム監視
  monitoring: {
    getMachineStatus: () => Promise<MachineStatus[]>
    getWorkerLocation: () => Promise<WorkerLocation[]>
    sendAlert: (alert: Alert) => Promise<void>
  }
}
```

### 共通データアクセス層（Phase 4実装）

#### **アーキテクチャ**
```typescript
// project-data-lib/src/core.ts
export class UnifiedDataAccess {
  private config: DataConfig
  private cache: CacheManager
  private validator: DataValidator

  constructor(config: DataConfig) {
    this.config = config
    this.cache = new CacheManager()
    this.validator = new DataValidator()
  }

  // 統一されたデータアクセス
  async getData<T>(path: string, options?: QueryOptions): Promise<T> {
    // キャッシュ確認
    const cached = this.cache.get(path)
    if (cached && !options?.forceRefresh) {
      return cached
    }

    // データ取得（NAS、DB、API等を統一インターフェース）
    const data = await this.fetchData<T>(path)
    
    // バリデーション
    const validated = this.validator.validate(data, options?.schema)
    
    // キャッシュ保存
    this.cache.set(path, validated)
    
    return validated
  }

  // 統一されたデータ更新
  async setData<T>(path: string, data: T, options?: UpdateOptions): Promise<void> {
    // バリデーション
    this.validator.validate(data, options?.schema)
    
    // トランザクション開始
    const transaction = await this.beginTransaction()
    
    try {
      // データ更新
      await this.updateData(path, data)
      
      // インデックス更新
      await this.updateSearchIndex(path, data)
      
      // キャッシュ無効化
      this.cache.invalidate(path)
      
      // トランザクション確定
      await transaction.commit()
      
      // 他システムへの通知
      await this.notifyUpdate(path, data)
      
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }
}
```

---

## 📞 サポート・問い合わせ（更新版）

### 開発関連
- **Git Repository**: [プロジェクトURL]
- **Issue Tracker**: [Issue URL]  
- **Documentation**: [ドキュメントURL]
- **開発者連絡先**: [開発者メール]

### 社内運用関連
- **NAS管理**: [社内IT担当者]
- **ネットワーク**: [ネットワーク管理者]
- **社内ノートPC**: [PC管理者]
- **業務利用問い合わせ**: [業務担当者]

### 緊急時対応
- **アプリケーション停止**: [緊急連絡先]
- **NAS接続障害**: [インフラ担当者]
- **データ破損・消失**: [バックアップ担当者]

---

## 📚 参考資料（更新版）

### 技術ドキュメント
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [CIFS/SMB Mount Guide](https://linux.die.net/man/8/mount.cifs)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Systemd Service Configuration](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

### 社内ドキュメント
- [社内NAS接続ガイド](./doc/社内NAS接続手順.md)
- [ノートPC運用マニュアル](./doc/ノートPC運用指針.md)
- [緊急時対応手順](./doc/緊急時対応マニュアル.md)

### プロジェクト固有ドキュメント
- [データスキーマ仕様書](./doc/データスキーマ仕様書.md)
- [ファイル修正計画](./doc/案件記録データベース%20ファイル修正計画.md)
- [API仕様書](./doc/api-specification.md)
- [運用手順書](./doc/運用手順書.md)

---

**最終更新**: 2025年7月2日  
**作成者**: プロジェクト開発チーム  
**バージョン**: 2.0.0（社内ノートPC対応版）

### 変更履歴
- **v2.0.0**: 社内ノートPC環境に対応、APIエンドポイント新規作成を不要に変更
- **v1.0.0**: 初期版（本格サーバー想定） [ ] 共通データアクセス層設計
- [ ] API Gateway仕様策定
- [ ] 権限管理設計
- [ ] 将来アプリケーション構成計画

---

## 🔧 トラブルシューティング

### NAS接続関連

#### **問題: NASマウントに失敗する**
```bash
# エラー確認
dmesg | grep cifs
tail -f /var/log/syslog

# 手動マウントテスト
sudo mount -t cifs //192.168.1.100/shared /mnt/test \
  -o username=nasuser,password=password,vers=2.0

# CIFS-utils確認
sudo apt install cifs-utils
```

#### **問題: 権限エラーでファイルアクセスできない**
```bash
# マウント時の権限設定確認
sudo mount -t cifs //nas-host/share /mnt/nas \
  -o username=user,password=pass,uid=$(id -u),gid=$(id -g),file_mode=0755,dir_mode=0755

# 現在の権限確認
ls -la /mnt/nas/project-data/
```

#### **問題: ネットワーク接続が不安定**
```bash
# ping テスト
ping 192.168.1.100

# SMB接続テスト
smbclient -L //192.168.1.100 -U nasuser

# autofs設定（自動再マウント）
sudo apt install autofs
```

### アプリケーション関連

#### **問題: サーバーサイドでファイル読み込みエラー**
```typescript
// デバッグ用ログ追加
console.log('ファイルパス確認:', {
  dataPath: getDataPath(),
  filePath: path.join(getDataPath(), 'companies.json'),
  exists: fs.existsSync(path.join(getDataPath(), 'companies.json'))
})
```

#### **問題: クライアントサイドでAPI接続エラー**
```typescript
// API接続確認
const testAPI = async () => {
  try {
    const response = await fetch('/api/data/companies')
    console.log('API Response:', response.status, await response.json())
  } catch (error) {
    console.error('API Error:', error)
  }
}
```

#### **問題: 本番環境でビルドエラー**
```bash
# Node.js バージョン確認
node --version
npm --version

# キャッシュクリア
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### パフォーマンス関連

#### **問題: NASアクセスが遅い**
```typescript
// キャッシュ機能追加
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分

const loadWithCache = async (key: string, loader: () => Promise<any>) => {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const data = await loader()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

---

## 📋 運用・保守指針

### 日次運用作業

#### **毎日の確認項目**
```bash
# 1. システム状態確認
./scripts/health-check.sh

# 2. ログローテーション確認
sudo logrotate -f /etc/logrotate.d/pm2

# 3. NASマウント状態確認
df -h | grep nas

# 4. アプリケーション応答確認
curl -f http://localhost:3000/api/data/companies
```

#### **週次メンテナンス**
```bash
# 1. ログファイルクリーンアップ
find /var/log/pm2/ -name "*.log" -mtime +7 -delete

# 2. システム更新確認
sudo apt update && sudo apt list --upgradable

# 3. バックアップ確認
rsync -av /mnt/nas/project-data/ /backup/project-data/

# 4. パフォーマンス確認
npm run analyze # バンドルサイズ分析
```

### データバックアップ戦略

#### **3-2-1 バックアップルール**
- **3コピー**: 本番、ローカルバックアップ、オフサイトバックアップ
- **2メディア**: NAS + 外部ストレージ  
- **1オフサイト**: クラウドストレージ

```bash
# scripts/backup.sh
#!/bin/bash

BACKUP_DATE=$(date +%Y%m%d)
SOURCE_DIR="/mnt/nas/project-data"
LOCAL_BACKUP="/backup/project-data-${BACKUP_DATE}"
CLOUD_BACKUP="s3://your-bucket/project-data-${BACKUP_DATE}"

# ローカルバックアップ
rsync -av ${SOURCE_DIR}/ ${LOCAL_BACKUP}/

# クラウドバックアップ（AWS CLI使用）
aws s3 sync ${LOCAL_BACKUP}/ ${CLOUD_BACKUP}/

# 古いバックアップ削除（30日以上）
find /backup/ -name "project-data-*" -mtime +30 -exec rm -rf {} \;

echo "✅ バックアップ完了: ${BACKUP_DATE}"
```

### セキュリティ考慮事項

#### **アクセス制御**
```bash
# ファイアウォール設定
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3000   # Next.js直接アクセス拒否
```

#### **認証情報管理**
```bash
# 環境変数の暗号化（sops使用例）
sops -e .env.production > .env.production.encrypted

# 復号化
sops -d .env.production.encrypted > .env.production
```

---

## 🚀 将来拡張のロードマップ

### 短期（3ヶ月以内）
- [ ] **データ管理GUI**
  - 図番追加・編集機能
  - 画像・動画アップロード機能
  - 作業手順テンプレート機能

### 中期（6ヶ月以内）  
- [ ] **生産管理アプリ**
  - 作業スケジュール管理
  - 進捗トラッキング
  - レポート生成機能

### 長期（12ヶ月以内）
- [ ] **高度な機能**
  - AI画像認識による品質チェック
  - 音声入力による作業記録
  - IoTセンサーとの連携

### 拡張アーキテクチャ例

```
                    [NAS Storage]
                         |
                    [API Gateway]
                         |
        +----------------+----------------+
        |                |                |
[案件記録DB]      [データ管理GUI]    [生産管理アプリ]
(現在のプロジェクト)   (新規プロジェクト)   (新規プロジェクト)
        |                |                |
    [参照専用]         [編集権限]       [スケジュール管理]
```

---

## 📞 サポート・問い合わせ

### 開発関連
- **Git Repository**: [プロジェクトURL]
- **Issue Tracker**: [Issue URL]
- **Documentation**: [ドキュメントURL]

### インフラ関連
- **NAS管理**: [NAS管理者連絡先]
- **ネットワーク**: [ネットワーク管理者連絡先]
- **サーバー**: [サーバー管理者連絡先]

---

## 📚 参考資料

### 技術ドキュメント
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [CIFS/SMB Mount Guide](https://linux.die.net/man/8/mount.cifs)

### プロジェクト固有ドキュメント
- [データスキーマ仕様書](./doc/データスキーマ仕様書.md)
- [ファイル修正計画](./doc/案件記録データベース%20ファイル修正計画.md)
- [API仕様書](./doc/api-specification.md)

---

**最終更新**: 2025年7月2日  
**作成者**: プロジェクト開発チーム  
**バージョン**: 1.0.0