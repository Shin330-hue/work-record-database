# デモ版データマスキング作業記録

## 概要
WBS（ワールドビジネスサテライト）取材用のデモ版を作成するため、機密情報をマスキングしました。

## 作業日
2026年2月1日

## マスキング対象
以下の情報をマスキング（テレ東(株)とワールドビジネスサテライト(株)のデータは除外）：

### 1. 作業者名・ユーザー名
- **対象ファイル**: contributions.json, instruction.json, auth/passwords.json
- **変換形式**: 実名 → 作業者A, 作業者B, ... 作業者AL
- **スクリプト**: `mask-all-names.js`
- **結果**: 40名をマスキング

### 2. 製品名
- **対象ファイル**: companies.json, search-index.json, instruction.json
- **変換形式**: 実際の製品名 → 部品ユニットA, パーツセットE, コンポーネントI, etc.
- **スクリプト**: `mask-product-names.js`
- **結果**: 59種類の製品名をマスキング

### 3. カテゴリ名
- **対象ファイル**: companies.json, search-index.json, instruction.json
- **変換形式**: 実際のカテゴリ → シャフト部品, ギア部品, ハウジング, etc.
- **スクリプト**: `mask-category-and-drawing.js`
- **結果**: 30種類のカテゴリをマスキング

### 4. 図番（表示用）
- **対象ファイル**: instruction.json (overview.description, displayDrawingNumber)
- **変換形式**: 実際の図番 → DRW-001, DRW-002, ...
- **スクリプト**: `mask-category-and-drawing.js`
- **結果**: 82件の図番をマスキング
- **注意**: フォルダ名（drawing-XXXXX）は変更なし

## 環境設定変更
`.env.local`を以下のように変更し、デモ用データを使用するよう設定：

```
DATA_ROOT_PATH=C:\work\projects\work-record-database\public\data_demo
DEV_DATA_ROOT_PATH=./public/data_demo
AUTH_FILE_PATH=./public/data_demo/auth/passwords.json
```

## APIルート修正
`src/app/api/contribution/route.ts`のハードコードされたパスを環境変数対応に修正。

## スクリプト一覧
| ファイル | 用途 |
|---------|------|
| mask-all-names.js | 作業者名のマスキング |
| mask-product-names.js | 製品名のマスキング |
| mask-category-and-drawing.js | カテゴリ名・図番のマスキング |

## 元に戻す方法
1. `public/data`フォルダから`public/data_demo`にデータをコピーし直す
2. `.env.local`のパスを`./public/data`に戻す
3. または、このコミット以前の状態にリバートする

## 注意事項
- スキップ対象会社ID: `tvtokyo`, `wbs`
- これらの会社のデータはマスキングされていません
