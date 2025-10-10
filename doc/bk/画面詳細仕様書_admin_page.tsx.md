# 画面詳細仕様書 - admin/page.tsx（管理画面トップ）

## 1. 画面概要

### 基本情報
- **ファイルパス**: `src/app/admin/page.tsx`
- **URL**: `/admin`
- **画面名**: 管理画面ダッシュボード
- **役割**: 管理者向けの統計情報表示と各管理機能への入口

### 画面の目的
1. **統計情報の可視化**: システム全体の状況を一目で把握
2. **管理機能への導線**: 各種管理機能への分かりやすいナビゲーション
3. **最新活動の監視**: 最新の追記情報を確認

## 2. コンポーネント構造

### 使用コンポーネント
```typescript
- Link (Next.js): ページ内遷移用
- 外部コンポーネントは使用せず（セルフコンテインド）
```

### 状態管理（useState）
```typescript
const [stats, setStats] = useState({
  totalDrawings: 0,      // 総図番数
  totalCompanies: 0,     // 会社数
  totalProducts: 0,      // 製品数
  totalContributions: 0  // 最新追記数
})
const [recentContributions, setRecentContributions] = useState<Array<{
  drawingNumber: string;
  contribution: ContributionData;
  drawingTitle?: string;
}>>([])
const [loading, setLoading] = useState(true) // ローディング状態
```

### データフロー
```
[初期表示]
1. useEffect → Promise.all([3つのデータ取得関数])
2. 統計情報を計算
   - 図番数: searchIndex.drawings.length
   - 会社数: companies.length
   - 製品数: 全会社の製品数を合計
3. 最新追記5件を取得
4. loading = false
```

## 3. API連携

### データ取得API
| 関数名 | 取得データ | 取得元 | 用途 |
|--------|------------|--------|------|
| loadSearchIndex() | 検索インデックス | /data/search-index.json | 図番数カウント |
| loadCompanies() | 会社一覧 | /data/companies.json | 会社数・製品数カウント |
| loadRecentContributions(5) | 最新追記5件 | 各図番のcontributions | 最新活動表示 |

### エラーハンドリング
- try-catchでエラーをキャッチ
- console.errorでログ出力のみ
- UIにはエラー表示なし（データが0件として扱われる）

## 4. 画面遷移フロー

### 遷移元（この画面への流入）
- 直接URL入力（/admin）
- 他の管理画面からの戻り
- ※認証後のリダイレクト（将来実装予定）

### 遷移先（この画面からの流出）
```mermaid
graph LR
    A[管理画面トップ] --> B[/admin/drawings/new]
    A --> C[/admin/drawings/list]
    A --> D[/admin/companies]
    A --> E[/admin/contributions]
    A --> F[/admin/tools/validate]
    A --> G[/（メインサイト）]
    A --> H[/instruction/{drawingNumber}]
    
    B --> I[新規図番登録]
    C --> J[図番一覧・編集]
    D --> K[会社・製品管理]
    E --> L[追記管理]
    F --> M[データ整合性チェック]
    H --> N[最新追記の図番詳細]
```

## 5. UI/UX仕様

### レイアウト構造
```
[ヘッダー]
  - タイトル「管理画面」
  - 「メインサイトに戻る」リンク
[統計情報カード（4列グリッド）]
  - 総図番数（青）
  - 会社数（緑）
  - 製品数（黄）
  - 最新追記（紫）
[メイン機能（2列グリッド）]
  - 図番管理セクション
  - データ管理セクション
[最新追記リスト]※データがある場合のみ
```

### レスポンシブ対応
- 統計カード: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- メイン機能: `grid-cols-1 lg:grid-cols-2`
- モバイルでは全て縦並び

### カラースキーム
- 背景: gray-50（薄いグレー）
- カード背景: white
- アクセントカラー:
  - 図番: blue-600
  - 会社: green-600
  - 製品: yellow-600
  - 追記: purple-600

## 6. 機能詳細

### 統計情報表示
- リアルタイムでデータを集計
- 大きな数字で視認性を重視
- カード形式で整理された表示

### 図番管理機能
1. **新規図番登録**: 新しい図番の登録画面へ
2. **図番一覧・編集**: 既存図番の管理画面へ

### データ管理機能\n\n> **補足**: ダッシュボードのデータ管理セクションは2025-10時点で非表示。監査ログ導線の整備後に再検討予定。
1. **会社・製品管理**: マスタデータの管理
2. **追記管理**: ユーザー投稿の管理
3. **データ整合性チェック**: システムの健全性確認

### 最新追記表示
- 最新5件の追記を表示
- 図番、タイトル、投稿者、日付を表示
- 図番クリックで詳細画面へ（閲覧モード）

## 7. データ構造

### 統計情報
```typescript
interface Stats {
  totalDrawings: number    // 総図番数
  totalCompanies: number   // 会社数
  totalProducts: number    // 製品数
  totalContributions: number // 表示中の追記数
}
```

### 最新追記データ
```typescript
interface RecentContribution {
  drawingNumber: string
  contribution: ContributionData
  drawingTitle?: string
}
```

## 8. 特記事項

### セキュリティ
- 現在は認証機能なし
- 将来的には管理者認証が必要
- Bearer tokenによるAPI保護を検討中

### パフォーマンス
- 初期データを並列読み込み（Promise.all）
- 追記データは最新5件のみ取得

### アクセシビリティ
- ローディング中はスピナー表示
- 各ボタンに絵文字アイコンで視認性向上
- リンクには適切なhover効果

### メインサイトとの違い
| 項目 | メインサイト（page.tsx） | 管理画面（admin/page.tsx） |
|------|-------------------------|---------------------------|
| 対象ユーザー | 一般作業者 | 管理者 |
| 主な目的 | 作業手順の閲覧 | データの管理・編集 |
| デザイン | ダークテーマ（紫グラデーション） | ライトテーマ（グレー基調） |
| 機能 | 閲覧・検索のみ | CRUD操作全般 |
