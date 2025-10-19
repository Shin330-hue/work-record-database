# Work Record Database API仕様書

## 概要
本ドキュメントは、作業記録データベースシステムのAPIエンドポイント一覧と詳細仕様を記載しています。

## APIエンドポイント一覧

| エンドポイント | メソッド | 説明 |
|---|---|---|
| `/api/files` | GET | ファイル一覧取得・単一ファイル配信 |
| `/api/contribution` | POST, GET | 追加投稿の作成・取得 |
| `/api/admin/drawings` | POST, GET | 図番の一括登録・一覧取得（管理者用） |
| `/api/admin/drawings/[id]` | PUT | 図番詳細情報の更新（管理者用） |
| `/api/admin/drawings/[id]/files` | POST, DELETE | 図番ファイルのアップロード・削除（管理者用） |
| `/api/admin/drawings/[id]/files/batch` | POST | 図番ファイルの一括アップロード（管理者用） |

## API詳細仕様

### 1. ファイル配信API

#### GET `/api/files`
ファイル一覧の取得または単一ファイルの配信を行います。

**リクエストパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `drawingNumber` | string | 条件付き | 図番（作業手順用） |
| `folderType` | string | ○ | フォルダタイプ: 'images', 'videos', 'pdfs', 'programs' |
| `subFolder` | string | - | サブフォルダ |
| `machineType` | string[] | - | 機械種別: 'machining', 'turning', 'yokonaka', 'radial', 'other' |
| `ideaCategory` | string | 条件付き | 加工アイデアカテゴリ |
| `ideaId` | string | 条件付き | 加工アイデアID |
| `contributionFile` | string | - | 追加投稿ファイル名（単一ファイル配信用） |

**レスポンス例（ファイル一覧）**
```json
{
  "success": true,
  "data": {
    "files": ["file1.jpg", "file2.png"],
    "folderPath": "/data/work-instructions/drawing-ABC-123/images",
    "count": 2
  },
  "timestamp": "2025-07-21T02:00:00.000Z"
}
```

**単一ファイル配信時**
`fileName`パラメータが指定された場合、ファイルの内容を直接返します（バイナリレスポンス）。

### 2. 追加投稿API

#### POST `/api/contribution`
作業手順への追加投稿（コメント・画像・動画）を作成します。

**リクエストボディ（FormData）**
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `drawingNumber` | string | ○ | 図番 |
| `userId` | string | ○ | ユーザーID |
| `userName` | string | ○ | ユーザー名 |
| `type` | string | ○ | 投稿タイプ: 'comment', 'image', 'video' |
| `targetSection` | string | ○ | 対象セクション: 'overview', 'workStep', 'nearMiss' |
| `stepNumber` | string | 条件付き | ステップ番号（workStepの場合必須） |
| `text` | string | - | テキスト内容 |
| `files` | File[] | - | アップロードファイル（最大10ファイル） |

**制限事項**
- 単一ファイルサイズ上限: 50MB
- 合計ファイルサイズ上限: 100MB
- 最大ファイル数: 10

**レスポンス例**
```json
{
  "success": true,
  "contributionId": "1737363600000_abc123def"
}
```

#### GET `/api/contribution`
指定図番の追加投稿を取得します。

**リクエストパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `drawingNumber` | string | ○ | 図番 |

**レスポンス例**
```json
{
  "drawingNumber": "ABC-123",
  "contributions": [
    {
      "id": "1737363600000_abc123def",
      "timestamp": "2025-07-20T10:00:00.000Z",
      "userId": "user123",
      "userName": "山田太郎",
      "type": "comment",
      "targetSection": "workStep",
      "stepNumber": "1",
      "text": "ここの加工は特に注意が必要です",
      "files": []
    }
  ],
  "metadata": {
    "totalContributions": 5,
    "lastUpdated": "2025-07-20T10:00:00Z",
    "version": "1.0",
    "mergedCount": 0
  }
}
```

### 3. 管理画面API

#### POST `/api/admin/drawings`
複数図番の一括登録を行います。

**認証**
- Authorization: Bearer {ADMIN_TOKEN}

**リクエストボディ（FormData）**
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `drawings` | string | ○ | 図番データ配列のJSON文字列 |
| `pdf_{図番}` | File | - | 各図番のPDFファイル |

**図番データ構造**
```json
{
  "drawingNumber": "ABC-123",
  "title": "部品タイトル",
  "company": {
    "id": "company1",
    "name": "会社名"
  },
  "product": {
    "id": "product1",
    "name": "製品名",
    "category": "カテゴリ"
  },
  "difficulty": "初級",
  "estimatedTime": "30",
  "machineType": ["turning"],
  "description": "説明文",
  "warnings": ["注意事項1", "注意事項2"]
}
```

**レスポンス例**
```json
{
  "success": true,
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": [
    {
      "drawingNumber": "ABC-123",
      "success": true,
      "message": "登録成功"
    }
  ],
  "validation": {
    "invalidDrawings": [],
    "duplicates": [],
    "validDrawings": ["ABC-123", "DEF-456", "GHI-789"]
  }
}
```

#### GET `/api/admin/drawings`
図番一覧をページネーション付きで取得します。

**認証**
- Authorization: Bearer {ADMIN_TOKEN}

**リクエストパラメータ**
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `page` | number | - | 1 | ページ番号 |
| `limit` | number | - | 20 | 取得件数 |
| `search` | string | - | - | 検索キーワード |

**レスポンス例**
```json
{
  "drawings": [
    {
      "drawingNumber": "ABC-123",
      "title": "部品タイトル",
      "company": { "id": "company1", "name": "会社A" },
      "product": { "id": "product1", "name": "製品1", "category": "カテゴリ1" },
      "updatedAt": "2025-07-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "companies": [
    { "id": "company1", "name": "会社A" }
  ]
}
```

#### PUT `/api/admin/drawings/[id]`
図番の詳細情報を更新します。

**認証**
- Authorization: Bearer {ADMIN_TOKEN}

**パスパラメータ**
- `id`: 更新対象の図番

**リクエストボディ（JSON）**
```json
{
  "drawingNumber": "ABC-123",
  "title": "更新後タイトル",
  "company": {
    "id": "company1",
    "name": "会社名"
  },
  "product": {
    "id": "product1",
    "name": "製品名",
    "category": "カテゴリ"
  },
  "difficulty": "中級",
  "estimatedTime": "45",
  "machineType": ["turning", "machining"],
  "description": "詳細説明",
  "keywords": "キーワード1,キーワード2",
  "toolsRequired": "工具1,工具2",
  "overview": {
    "warnings": ["注意1", "注意2"],
    "preparationTime": "10",
    "processingTime": "35"
  },
  "workSteps": [
    {
      "stepNumber": 1,
      "title": "ステップタイトル",
      "description": "ステップ説明",
      "duration": "10",
      "toolsUsed": "使用工具",
      "qualityPoints": ["品質ポイント1"],
      "safetyPoints": ["安全ポイント1"]
    }
  ],
  "nearMiss": [
    {
      "id": "nm1",
      "description": "ヒヤリハット内容",
      "category": "safety"
    }
  ]
}
```

**レスポンス例**
```json
{
  "success": true,
  "message": "図番情報が正常に更新されました",
  "drawingNumber": "ABC-123"
}
```

#### POST `/api/admin/drawings/[id]/files`
図番の画像・動画ファイルをアップロードします。

**認証**
- Authorization: Bearer {ADMIN_TOKEN}

**パスパラメータ**
- `id`: 対象図番

**リクエストボディ（FormData）**
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `file` | File | ○ | アップロードファイル |
| `stepNumber` | string | ○ | ステップ番号（0=概要） |
| `fileType` | string | ○ | ファイルタイプ: 'images', 'videos' |
| `machineType` | string[] | - | 機械種別: 'machining', 'turning', 'yokonaka', 'radial', 'other' |

**制限事項**
- 最大ファイルサイズ: 50MB
- 対応形式（画像）: jpg, jpeg, png, gif, webp
- 対応形式（動画）: mp4, avi, mov, wmv, webm

**レスポンス例**
```json
{
  "success": true,
  "fileName": "2025-07-20T10-00-00-000Z-image.jpg",
  "message": "ファイルがアップロードされました"
}
```

#### DELETE `/api/admin/drawings/[id]/files`
図番のファイルを削除します。

**認証**
- Authorization: Bearer {ADMIN_TOKEN}

**パスパラメータ**
- `id`: 対象図番

**リクエストボディ（JSON）**
```json
{
  "fileName": "2025-07-20T10-00-00-000Z-image.jpg",
  "stepNumber": "1",
  "fileType": "images",
  "machineType": ["machining"]
}
```

**レスポンス例**
```json
{
  "success": true,
  "message": "ファイルが削除されました"
}
```

#### POST `/api/admin/drawings/[id]/files/batch`
図番の複数ファイルを一括でアップロードします。画像、動画、PDF、プログラムファイルを自動判定して適切なフォルダに保存します。

**認証**
- Authorization: Bearer {ADMIN_TOKEN}

**パスパラメータ**
- `id`: 対象図番

**リクエストボディ（FormData）**
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `files` | File[] | ○ | アップロードファイル（複数可） |
| `stepNumber` | string | ○ | ステップ番号（0=概要、1以上=各ステップ） |
| `machineType` | string[] | - | 機械種別: 'machining', 'turning', 'yokonaka', 'radial', 'other' |

**対応ファイル形式**
- **画像**: jpg, jpeg, png, gif, webp
- **動画**: mp4, avi, mov, wmv, webm
- **PDF**: pdf
- **プログラム**: nc, txt, tap, pgm, mpf, ptp, gcode, cnc, min, eia

**制限事項**
- 最大ファイル数: 20
- 単一ファイルサイズ上限: 50MB
- 合計ファイルサイズ上限: 100MB

**ファイル名ポリシー**
- **画像・動画**: タイムスタンプを付加（例: `2025-07-22T10-00-00-000Z-image.jpg`）
- **PDF・プログラム**: オリジナルファイル名を保持（例: `ABC-123.pdf`、`O1234.nc`）
- 重複時は番号を付加（例: `ABC-123_1.pdf`）

**フォルダ構造（機械種別対応）**
- **概要**: `overview/`
- **機械種別ステップ（新形式）**: `step_01_machining/`、`step_01_turning/`、`step_01_yokonaka/`、`step_01_radial/`、`step_01_other/`
- **旧形式（後方互換性）**: `step_01/`、`step_02/`

**レスポンス例（成功）**
```json
{
  "success": true,
  "uploaded": [
    "ABC-123.pdf",
    "O1234.nc",
    "2025-07-22T10-00-00-000Z-photo.jpg"
  ],
  "errors": []
}
```

**レスポンス例（部分的エラー）**
```json
{
  "success": true,
  "uploaded": ["ABC-123.pdf"],
  "errors": [
    {
      "file": "large-file.pdf",
      "error": "ファイルサイズが制限を超えています（最大50MB）",
      "code": "SIZE_EXCEEDED"
    }
  ]
}
```

## エラーレスポンス

すべてのAPIで共通のエラーレスポンス形式を使用します。

**エラーレスポンス例**
```json
{
  "error": "エラーメッセージ",
  "details": "詳細なエラー情報（開発環境のみ）"
}
```

**HTTPステータスコード**
- 200: 成功
- 400: リクエストエラー
- 401: 認証エラー
- 403: 権限エラー
- 404: リソースが見つからない
- 413: ファイルサイズ超過
- 500: サーバーエラー

## セキュリティ考慮事項

1. **ファイルアップロード**
   - MIMEタイプと拡張子の検証
   - ファイルサイズ制限の実施
   - 実行可能ファイルの除外

2. **パストラバーサル対策**
   - 相対パス（../, ..\）の除外
   - 特殊文字のサニタイズ

3. **認証・認可**
   - 管理APIはBearer token認証必須
   - 環境変数による秘密情報管理

4. **入力値検証**
   - 必須パラメータの確認
   - データ型・形式の検証
   - 図番形式の制限（英数字、ハイフン、アンダースコアのみ）

## 使用例

### cURLでのAPI呼び出し例

#### ファイル一覧取得
```bash
curl "http://localhost:3000/api/files?drawingNumber=ABC-123&folderType=images"
```

#### 追加投稿作成
```bash
curl -X POST http://localhost:3000/api/contribution \
  -F "drawingNumber=ABC-123" \
  -F "userId=user123" \
  -F "userName=山田太郎" \
  -F "type=comment" \
  -F "targetSection=workStep" \
  -F "stepNumber=1" \
  -F "text=ここは注意が必要です"
```

#### 管理API呼び出し（認証付き）
```bash
curl -X GET http://localhost:3000/api/admin/drawings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 更新履歴

- 2025-07-20: 初版作成
- 2025-07-22: 複数ファイルアップロード対応、管理画面API追加
- 2025-08-08: 機械種別パラメータ追加、フォルダ構造の詳細化
- 2025-08-09: ドキュメント最新化
