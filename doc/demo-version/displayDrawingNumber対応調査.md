# displayDrawingNumber 対応調査レポート

**調査日**: 2026-02-01
**調査者**: Claude

## 問題の概要

マスキング対応で図番の表示がマスキングされるはずだが、実際にはされていない。

## 原因

1. `search-index.json` には `displayDrawingNumber`（例: `DRW-001`）が設定されている
2. `instruction.json` には `displayDrawingNumber` が設定されていない
3. **UIコード側で `displayDrawingNumber` を一度も参照していない** — 常に実際の `drawingNumber` を表示している

## データの状態確認結果

```
search-index.json:
  drawingNumber: 0D127100014 | displayDrawingNumber: DRW-001
  drawingNumber: 0E260800172 | displayDrawingNumber: DRW-022
  ...

instruction.json:
  metadata.drawingNumber: 02760810650
  overview.displayDrawingNumber: undefined  ← 未設定
```

## 図番が表示される11箇所

### ユーザー向けページ（5箇所）

| ファイル | 行 | コンテキスト |
|---------|-----|-------------|
| `src/app/page.tsx` | 75 | トップページ検索結果 |
| `src/components/SearchBar.tsx` | 194 | 検索サジェスト |
| `src/components/WorkInstructionResults.tsx` | 156 | 作業手順ヘッダー |
| `src/components/WorkInstructionResults.tsx` | 460 | 関連図番セクション |
| `src/components/RecentContributions.tsx` | 106 | 最新追記ウィジェット |
| `src/app/drawings/[companyId]/[category]/page.tsx` | 170 | 図番一覧ページ |

### 管理画面ページ（4箇所）

| ファイル | 行 | コンテキスト |
|---------|-----|-------------|
| `src/app/admin/drawings/list/page.tsx` | 265 | 図番一覧テーブル |
| `src/app/admin/drawings/[id]/edit/page.tsx` | 1159 | 編集ページヘッダー |
| `src/app/admin/contributions/page.tsx` | 243 | 追記管理ページ |
| `src/app/admin/page.tsx` | 236 | ダッシュボード最新追記 |

### 追記関連ページ（1箇所）

| ファイル | 行 | コンテキスト |
|---------|-----|-------------|
| `src/app/contributions/all/page.tsx` | 88 | 全追記一覧ページ |

## 修正方針

各表示箇所で以下のパターンに変更する：

```tsx
// Before
{result.drawingNumber}

// After
{result.displayDrawingNumber || result.drawingNumber}
```

これにより：
- `displayDrawingNumber` が設定されている場合 → マスキング版を表示
- 設定されていない場合 → 実際の図番を表示（フォールバック）

## 追加対応が必要な箇所

### instruction.json への displayDrawingNumber 追加

`WorkInstructionResults.tsx` で使用される `instruction.metadata.drawingNumber` は `instruction.json` から取得されるが、このファイルには `displayDrawingNumber` が未設定。

対応案：
1. マスキングスクリプトで `instruction.json` にも `displayDrawingNumber` を追加
2. または、`search-index.json` から該当図番の `displayDrawingNumber` を取得するAPIを追加

## 変更対象外

以下の用途では `drawingNumber`（実際の値）を使い続ける：
- URLルーティングパラメータ
- APIエンドポイントのパス
- ファイルパス構築
- データ構造のキー

---

**次のアクション**: 上記11箇所のUIコードを修正し、`displayDrawingNumber || drawingNumber` パターンを適用する
