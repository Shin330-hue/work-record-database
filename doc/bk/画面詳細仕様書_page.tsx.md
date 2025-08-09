# 画面詳細仕様書 - page.tsx（トップページ）

## 1. 画面概要

### 基本情報
- **ファイルパス**: `src/app/page.tsx`
- **URL**: `/`（ルート）
- **画面名**: 会社選択画面（メインエントリーポイント）
- **役割**: 作業記録データベースへの入口。会社選択と図番検索の2つのルートを提供

### 画面の目的
1. **会社選択ルート**: 会社 → 製品 → 図番という階層的なナビゲーション
2. **図番検索ルート**: 図番を直接検索して作業手順へショートカット
3. **最新追記表示**: システム全体の最新活動を表示

## 2. コンポーネント構造

### 使用コンポーネント
```typescript
- Header: ヘッダーコンポーネント
- SearchBar: 図番検索コンポーネント
- RecentContributions: 最新追記表示コンポーネント
```

### 状態管理（useState）
```typescript
const [companies, setCompanies] = useState<Company[]>([])              // 会社データ一覧
const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null) // 検索インデックス
const [searchResults, setSearchResults] = useState<DrawingSearchItem[]>([]) // 検索結果
const [showSearchResults, setShowSearchResults] = useState(false)       // 検索結果表示フラグ
const [loading, setLoading] = useState(true)                          // ローディング状態
const [error, setError] = useState<string | null>(null)                // エラー状態
```

### データフロー
```
[初期表示]
1. useEffect → Promise.all([loadCompanies(), loadSearchIndex()])
2. データ取得成功 → companies, searchIndexを設定
3. データ取得失敗 → errorを設定

[検索実行]
SearchBar → handleSearch → searchResults設定 → 検索結果表示

[画面遷移]
- 会社選択 → /category/{companyId}
- 図番選択 → /instruction/{drawingNumber}
```

## 3. API連携

### データ取得API
| 関数名 | 取得データ | 取得元 | タイミング |
|--------|------------|--------|------------|
| loadCompanies() | 会社一覧 | /data/companies.json | 初期表示時 |
| loadSearchIndex() | 検索インデックス | /data/search-index.json | 初期表示時 |

### エラーハンドリング
- Promise.all()のcatchブロックで一括エラー処理
- エラー時は「データの読み込みに失敗しました」を表示
- 部分的な失敗は許容しない（all or nothing）

## 4. 画面遷移フロー

### 遷移元（この画面への流入）
- 直接アクセス（ブックマーク、URL入力）
- 管理画面からの「メインサイトに戻る」リンク
- 各詳細画面からの「戻る」操作

### 遷移先（この画面からの流出）
```mermaid
graph LR
    A[トップページ] --> B[/category/{companyId}]
    A --> C[/instruction/{drawingNumber}]
    
    B --> D[会社選択時]
    C --> E[図番検索・選択時]
    C --> F[最新追記クリック時]
```

### パラメータ受け渡し
- 会社選択: `company.id`をURLパラメータとして渡す
- 図番選択: `drawingNumber`をURLエンコードして渡す

## 5. UI/UX仕様

### レイアウト構造
```
[Header]
[検索結果セクション]※検索時のみ表示
[会社選択セクション]
  - タイトル + 検索バー（横並び/レスポンシブ）
  - 会社カードグリッド
[最新追記セクション]※検索結果非表示時のみ
```

### 表示条件
1. **検索結果セクション**: `showSearchResults && searchResults.length > 0`
2. **会社一覧**: `!loading && !error`
3. **最新追記**: `!showSearchResults`

### スタイリング
- 背景: グラデーション（slate-900 → purple-900 → slate-900）
- 最大幅: 800px（中央寄せ）
- カードレイアウト: グリッド表示（selection-grid）

## 6. 機能詳細

### 検索機能
- SearchBarコンポーネントに検索処理を委譲
- 検索結果は図番カードとして表示
- 各カードには図番、タイトル、会社名、製品名、推定時間を表示

### 会社選択機能
- 会社カードをグリッド表示
- 各カードにアイコン（🏢）、会社名、説明を表示
- クリックで製品選択画面へ遷移

### 最新追記表示
- RecentContributionsコンポーネントで実装
- 図番クリックで作業手順詳細へ直接遷移

## 7. データ構造

### Company型
```typescript
interface Company {
  id: string
  name: string
  description: string
  products: Product[]
}
```

### DrawingSearchItem型
```typescript
interface DrawingSearchItem {
  drawingNumber: string
  title: string
  companyName: string
  productName: string
  estimatedTime: string
  // その他のフィールド...
}
```

## 8. 特記事項

### パフォーマンス
- 初期データ読み込みを並列実行（Promise.all）
- 検索インデックスをメモリに保持してクライアントサイド検索

### アクセシビリティ
- ローディング中は明示的な表示
- エラー時は分かりやすいメッセージ
- ボタンには適切なaria-labelを付与（改善の余地あり）

### 今後の改善点
- エラー時のリトライ機能
- 検索履歴の保存
- キーボードナビゲーション対応