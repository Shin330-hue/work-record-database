# ESLintエラー修正指示書

## 🎯 目的
Next.js buildを成功させるため、ESLintエラーを修正する

## 📋 修正対象

### ❌ エラー（必須修正）
**未使用変数・引数の削除:**
- `src/app/api/files/route.ts` - 'stat' import削除
- `src/app/page.tsx` - catch文の未使用引数 'e' 削除
- `src/components/AIDetailedAdvice.tsx` - 未使用引数 'context', 'basicAdvice', 'err' 削除
- `src/components/WorkInstructionResults.tsx` - 未使用変数 'getPdfFiles' 削除
- `src/lib/contextBuilder.ts` - 未使用引数 'basicAdvice' 削除
- `src/lib/dataLoader.ts` - 未使用変数 'fs', 'dataPath', 'publicDataPath' 削除

**型定義の修正:**
- `src/components/WorkInstructionResults.tsx` - any型 → 適切な型に変更
- `src/lib/contextBuilder.ts` - any型 → 適切な型に変更

### ⚠️ 警告（推奨修正）
**Image最適化:**
- `src/components/TroubleshootingResults.tsx`
- `src/components/WorkInstructionResults.tsx`
- `src/components/WorkStep.tsx`

`<img>` → `<Image>` (Next.js Image component)

## 🔧 修正方針

### 1. 未使用要素の対処
- import文から未使用モジュールを削除
- 関数引数から未使用パラメータを削除
- 変数宣言から未使用変数を削除

### 2. 型安全性の向上
- `any` → 具体的な型に変更
- イベントハンドラーは適切なReact型を使用

### 3. Next.js最適化
- `<img>` → `<Image>` に変更
- width, height属性を追加

## ⚡ 修正オプション

### Option A: 手動修正（推奨）
各ファイルを開いて上記の方針で修正

### Option B: 自動修正
```bash
npx eslint . --fix
```

### Option C: 一時的にスキップ
```bash
npm run build -- --no-lint
```

## ✅ 完了確認

1. `npx eslint .` - エラーが0件になること
2. `npm run build` - buildが成功すること
3. `npm start` - アプリが正常起動すること

## 📝 チェックリスト

- [ ] 未使用変数・引数の削除完了
- [ ] any型の修正完了
- [ ] Image最適化完了（推奨）
- [ ] ESLintチェック通過
- [ ] Build成功
- [ ] 動作確認完了

**推定時間: 10-15分**