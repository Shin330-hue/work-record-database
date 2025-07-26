# UI改善記録

**作成日**: 2025年7月15日  
**バージョン**: 2.0  
**改善対象**: モバイル・タブレット対応UI、管理画面UI  

---

## 📋 改善概要

モバイル・タブレット環境でのユーザビリティ向上を目的とした、包括的なUI改善を実施。  
特に「タップしやすさ」「視認性」「統一感」を重視した改善を行った。

---

## 🎨 主要な改善内容

### 1. 統一ボタンシステムの構築

**カスタムCSSクラス `.custom-rect-button`** を新規作成し、全ボタンの見た目を統一。

#### 基本仕様
```css
.custom-rect-button {
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", "Meiryo", sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 20px 48px;
  color: white;
  border-radius: 12px;
  transition: all 0.2s ease-out;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.05em;
  touch-action: manipulation;
  user-select: none;
  text-decoration: none;
}
```

#### 色バリエーション
- **`.blue`**: ブルー系グラデーション（デフォルト、アクション用）
- **`.gray`**: グレー系グラデーション（戻るボタン用）
- **`.emerald`**: エメラルド系グラデーション（タブ用）
- **`.purple`**: パープル系グラデーション（ファイル用）

#### サイズバリエーション
- **通常サイズ**: デフォルト（20px 48px）
- **`.small`**: 小さめ（12px 24px、ファイルダウンロード用）

### 2. 適用したボタン一覧

#### 戻るボタン系（グレー）
- ✅ 会社一覧に戻る（`src/app/category/[companyId]/page.tsx`）
- ✅ カテゴリ一覧に戻る（`src/app/drawings/[companyId]/[category]/page.tsx`）
- ✅ 検索に戻る（`src/components/WorkInstructionResults.tsx`）

#### タブボタン系（エメラルド/グレー）
- ✅ 作業ステップ（`src/components/WorkInstructionResults.tsx`）
- ✅ 関連図番（`src/components/WorkInstructionResults.tsx`）
- ✅ 加工アイデア（`src/components/WorkInstructionResults.tsx`）

#### ファイル系（パープル・小サイズ）
- ✅ プログラムファイルダウンロード（`src/components/WorkStep.tsx`）
- ✅ PDFリンク（`src/components/WorkInstructionResults.tsx`）

#### その他（ブルー）
- ✅ 全ての追記を見る（`src/components/RecentContributions.tsx`）
- ✅ 追記フォーム投稿/キャンセル（`src/components/ContributionForm.tsx`）

### 3. 「＋概要に追記」ボタンの特別対応

**カスタムCSSクラス `.custom-add-button`** を作成し、オレンジ系グラデーションで目立つデザインに。

```css
.custom-add-button {
  background: linear-gradient(to right, #ff8c00, #ffa500);
  font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", "Meiryo", sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 20px 48px;
  /* ...その他のスタイル */
}
```

### 4. フォーム要素の改善

**カスタムCSSクラス群** を作成し、追記フォームの全要素を大型化。

#### 作成したクラス
- **`.custom-form-textarea`**: テキストエリア（20pxパディング、120px最小高さ）
- **`.custom-form-input`**: 入力フィールド（16px 20pxパディング）
- **`.custom-form-select`**: セレクトボックス（16px 20pxパディング）
- **`.custom-file-input`**: ファイル選択（点線ボーダー、グラデーションボタン）

#### 適用箇所（`src/components/ContributionForm.tsx`）
- ✅ お名前テキストボックス
- ✅ 追記タイプセレクト
- ✅ 内容テキストエリア
- ✅ ファイル選択ボタン
- ✅ 投稿・キャンセルボタン

### 5. レイアウト調整

#### トップページ（`src/app/page.tsx`）
- ✅ ヘッダー追加（`src/components/Header.tsx`）
- ✅ 検索バーの位置調整（左揃え）
- ✅ 検索バーの幅拡大（min-width: 400px）
- ✅ 間隔統一（カスタムCSS `.custom-top-spacing`）

#### 検索バー（`src/app/globals.css`）
- ✅ 枠色改善（rgba(255,215,0,0.3) → rgba(255,215,0,0.6)）
- ✅ フォーカス時の色強化（rgba(255,215,0,0.8)）

---

## 🎯 技術的な改善点

### 1. カスタムCSSの活用
TailwindCSSの制約を超えるため、具体的なピクセル値をカスタムCSSで指定。

### 2. 統一デザインシステム
色・サイズ・フォントを体系化し、一貫性のあるUI/UXを実現。

### 3. レスポンシブ対応
デスクトップとモバイルで適切なサイズ分けを実装。

### 4. アクセシビリティ向上
- `touch-action: manipulation` でタッチ遅延削減
- `user-select: none` で誤選択防止
- 十分なコントラスト比の確保

---

## 📁 変更ファイル一覧

### 新規作成
- `src/components/Header.tsx`
- `doc/UI改善記録_v1.0.md`（本ファイル）

### 主要変更
- `src/app/globals.css`（大幅追加）
- `src/app/layout.tsx`（タイトル変更）
- `src/app/page.tsx`（レイアウト調整）
- `src/components/ContributionForm.tsx`（フォーム改善）
- `src/components/WorkInstructionResults.tsx`（ボタン統一）
- `src/components/RecentContributions.tsx`（ボタン統一）
- `src/components/WorkStep.tsx`（ボタン統一）
- `src/app/category/[companyId]/page.tsx`（ボタン統一）
- `src/app/drawings/[companyId]/[category]/page.tsx`（ボタン統一）

---

## 🔧 今後の拡張案

### 1. 色の追加
新しいボタンカテゴリが必要な場合、以下のパターンで色を追加可能：
```css
.custom-rect-button.新色名 {
  background: linear-gradient(to right, #色1, #色2);
}
```

### 2. サイズの追加
新しいサイズが必要な場合、以下のパターンで追加可能：
```css
.custom-rect-button.新サイズ名 {
  padding: 新しいパディング;
  font-size: 新しいフォントサイズ;
}
```

### 3. フォーム要素の追加
新しいフォーム要素が必要な場合、`.custom-form-*` パターンで追加可能。

---

## 🎨 デザイン原則

### 1. 統一性
- 同じ機能のボタンは同じ色
- 同じ重要度のボタンは同じサイズ
- 全体で統一されたフォントファミリー

### 2. 使いやすさ
- 44px以上のタッチターゲット（Apple HIG準拠）
- 明確な視覚的フィードバック
- 直感的な色分け

### 3. 美しさ
- 適度な角丸（12px）
- 滑らかなアニメーション（0.2s ease-out）
- 上品なグラデーション

---

## 📊 効果測定

### 改善前の課題
- ボタンが小さくタップしにくい
- デザインが不統一
- フォーム要素が小さい
- 検索バーが使いにくい

### 改善後の効果
- タッチしやすい大きなボタン
- 統一感のあるデザイン
- 大きくて使いやすいフォーム
- 見やすい検索バー
- モバイル・タブレット対応完了

---

## 🆕 管理画面UI改善（v2.0追加）

### 実施日: 2025年7月24日

### 1. 管理画面での課題と解決策

#### 課題
- カスタムCSSクラスが見た目に反映されない問題
- フォーム要素の幅が画面いっぱいに広がる問題
- 中央揃えが効かない問題

#### 解決策と学んだテクニック

##### 1. **幅の制御**
```html
<!-- ❌ 悪い例：w-fullで全幅になってしまう -->
<button className="custom-rect-button blue w-full">

<!-- ✅ 良い例：w-fullを削除し、デフォルトのパディングを活用 -->
<button className="custom-rect-button blue">
```

##### 2. **custom-form-inputの幅調整**
```html
<!-- custom-form-inputには width: 100% が設定されているため -->
<!-- !importantで幅を上書きする必要がある -->
<FormInput className="!w-80" />  <!-- 320px幅に固定 -->
```

##### 3. **中央揃えレイアウト**
```html
<!-- フォーム全体を中央揃え -->
<form className="flex flex-col items-center">
  <FormInput className="!w-80" />
  <button className="custom-rect-button blue">
    <span>ログイン</span>
  </button>
</form>
```

### 2. 重要な発見

#### spanタグの重要性
メインサイトのボタンでは必ず`<span>`でテキストをラップしている：
```html
<!-- ContributionFormなどの実装例 -->
<button className="custom-rect-button blue">
  <span>投稿</span>
</button>
```

#### カスタムCSSクラスの直接使用
複雑なコンポーネント化よりも、シンプルにカスタムCSSクラスを直接使用する方が確実：
```html
<!-- シンプルで確実な実装 -->
<button className="custom-rect-button blue">
```

### 3. 管理画面共通コンポーネント

作成したコンポーネント：
- `FormInput`: 入力フィールド（custom-form-inputクラス使用）
- `FormButton`: ボタン（custom-rect-buttonクラス使用）
- `LoadingSpinner`: ローディング表示

### 4. デバッグテクニック

#### 開発者ツールでの確認方法
1. **要素の選択**: F12 → 矢印アイコン → 要素をクリック
2. **CSSの確認**: Stylesタブでカスタムクラスが読み込まれているか確認
3. **ネットワーク**: NetworkタブでCSSファイルの読み込みを確認

### 5. 管理画面トップページの改善

#### 実施内容
1. **レイアウトの統一**
   - すべてのテキストを中央揃えに統一
   - ボタンを中央配置（`flex flex-col items-center`）

2. **最新追記セクションの完全統一**
   - メインページのRecentContributionsと同じデザイン実装
   - 黒背景にエメラルドグリーンのテーマ
   - Linkタグを使わず、`onClick`ハンドラーで実装
   ```jsx
   <div 
     className="bg-black/40 rounded-xl p-4 border border-emerald-500/30 hover:bg-black/50 transition-colors cursor-pointer"
     onClick={() => router.push(`/instruction/${item.drawingNumber}`)}
   >
   ```

3. **カスタムボタンの色使い分け**
   - 主要アクション（新規登録）: `blue`
   - 副次アクション（一覧、チェック）: `gray`
   - 特定機能: `emerald`（会社管理）、`purple`（追記管理）

#### 重要な学び
- **Linkタグ vs onClick**: Linkタグを使うとデフォルトのリンクスタイルが適用されるため、統一感が失われる
- **管理画面の背景色**: 実際の表示は黒背景だったため、メインページと同じ色使いが必要
- **中央揃えの重要性**: ボタンだけでなく、テキストも中央揃えにすることで統一感が生まれる

### 6. 背景色の謎について

#### 問題
- コード上では管理画面のlayout.tsxで`bg-gray-50`（薄いグレー）を設定
- しかし、実際の表示は黒背景

#### 原因
`globals.css`で`body`タグに以下の設定がされている：
```css
body {
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
```

ここで、CSS変数が黒色に設定されている：
```css
:root {
  --background-start-rgb: 0, 0, 0;
  --background-end-rgb: 0, 0, 0;
}
```

#### 結果
- `body`の背景色がすべてのページに適用される
- 管理画面の`bg-gray-50`は、bodyの黒背景の上に配置されるが、透明度や優先度の関係で見えない
- そのため、管理画面も黒背景として表示される

#### 教訓
- グローバルなCSS設定は、個別ページの設定より優先される場合がある
- 背景色を変更する場合は、`body`レベルの設定も確認する必要がある
- 開発時は実際の表示を確認し、コードの設定と異なる場合は上位のCSS設定を疑う

### 7. 図番新規登録画面の改善

#### 実施日: 2025年7月24日

#### 改善内容

##### 1. 共通コンポーネントの作成と適用
- **FormTextarea**: 説明欄用のテキストエリアコンポーネント
- **FormSelect**: 難易度選択用のセレクトコンポーネント
- すべての入力フィールドにカスタムスタイルを適用

##### 2. レイアウトの大幅改善
1. **見出しの統一**
   - ページタイトル: 【新規図番登録】（中央揃え）
   - 中見出し: ＜図番 1＞形式
   - すべての見出しをカスタムスタイルで統一

2. **フォーム項目の間隔改善**
   - グリッドレイアウト: `gap-x-8 gap-y-12`
   - 各項目に `space-y-2` でラベルと入力欄の間隔を設定
   - 項目間に区切り線（`border-b border-gray-600`）を追加
   - 視覚的に各項目が独立して見えるように改善

3. **ラベルスタイルの改善**
   - `custom-form-label` クラスを作成
   - フォントサイズ: 1.1rem（約1.5倍）
   - 色: 白（黒背景に対応）
   - フォントウェイト: 600

##### 3. 入力要素の幅調整
- すべての入力要素の最大幅を640pxに統一
- ボタンも同じ幅に調整
- フォーム全体のコンテナを `max-w-2xl` に調整

##### 4. ボタンスタイルの統一
- 「＋図番を追加」ボタン: `custom-rect-button emerald`
- キャンセル/登録ボタン: カスタムスタイル適用
- 会社名の新規作成ボタン: エメラルド色で統一

##### 5. 機械種別チェックボックスの改善
- レイアウト: `flex flex-wrap gap-4`（間隔を狭く）
- チェックボックスサイズ: `h-5 w-5`
- テキストサイズ: インラインスタイルで1.25rem
- テキスト色: 白

##### 6. 会社名セレクターの改善
1. **カスタムドロップダウンスタイル**
   - 背景色: `#1f2937`（ダークグレー）
   - ボーダー: 2px solid #374151
   - 角丸: 12px
   - パディング: 12px 20px
   - フォントサイズ: 1.1rem

2. **新規作成ボタンの配置**
   - 入力欄の下に配置（`mt-3`）
   - エメラルド色で「＋新規会社を作成」
   - 既存選択時はグレーボタン

#### 技術的な学び
1. **Tailwindクラスの制限への対応**
   - `text-lg` が効かない場合はインラインスタイルを使用
   - カスタムCSSクラスで詳細な制御を実現

2. **フォーム項目の区別方法**
   - 項目間の間隔（gap-y-12）
   - 区切り線（border-b）
   - ラベルとコンテンツの間隔（space-y-2）

3. **黒背景への対応**
   - すべてのテキストを白に変更
   - グレー系の色は明度を上げて調整
   - ボーダー色も `border-gray-600` で統一

### 8. CSSクラスの優先順位問題と解決策

#### 実施日: 2025年1月26日

#### 発見された問題
作業詳細ページ（WorkInstructionResults.tsx）でTailwindのユーティリティクラス（`bg-emerald-600`など）が効かない問題が発生。

#### 原因の特定プロセス
1. **HTML要素の確認**
   - 開発者ツールでclass属性を確認 → Tailwindクラスは正しく適用されていた
   
2. **スタイルの確認**
   - Stylesパネルで実際の背景色を確認
   - 結果：`background: #ffffff08`（ほぼ透明な白）が適用されていた
   
3. **原因の特定**
   - globals.cssに`.instruction-header`クラスが定義されていた
   - このカスタムCSSがTailwindクラスより優先されていた

#### 問題のコード
```css
/* globals.css */
.instruction-header {
  background: rgba(255, 255, 255, 0.03); /* これがbg-emerald-600を上書き */
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 215, 0, 0.1);
}
```

#### 解決方法
1. **影響範囲の確認**
   - grepで`instruction-header`の使用箇所を検索
   - 結果：WorkInstructionResults.tsxの1箇所のみで使用
   
2. **修正の実施**
   - globals.cssの背景色を変更
   - 不要なTailwindクラスを削除してCSSの競合を回避

```css
/* 修正後 */
.instruction-header {
  background: rgba(16, 185, 129, 0.4); /* エメラルド色 40%透明度 */
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid rgba(16, 185, 129, 0.5); /* エメラルド色のボーダー */
}
```

#### 学んだ教訓
1. **CSSの優先順位**
   - カスタムCSSクラスはTailwindユーティリティクラスより優先される
   - 同じ要素に両方を適用すると予期しない結果になる可能性がある
   
2. **デバッグのベストプラクティス**
   - 開発者ツールでComputedスタイルを確認
   - CSSの出所（どのファイル・ルールから来ているか）を特定
   - grepで影響範囲を事前に確認
   
3. **設計の推奨事項**
   - カスタムCSSクラスとTailwindクラスの混在は避ける
   - カスタムCSSを使う場合は、その要素専用のクラス名を使用
   - または、Tailwindの`@apply`ディレクティブを使用してカスタムクラスを作成

### 9. Tailwindクラスが効かない場合の対処法

#### 実施日: 2025年1月26日

#### 問題
Tailwindのユーティリティクラス（`p-4`, `text-base`など）を適用しても、実際の表示に反映されない場合がある。

#### 原因
1. **Tailwindの設定や読み込みの問題**
2. **他のCSSとの競合**
3. **動的に生成されるクラス名の問題**
4. **開発環境のキャッシュ**

#### 解決策：インラインスタイルの使用

##### 基本的な対処法
```jsx
// ❌ Tailwindクラスが効かない場合
<button className="p-4 text-base">

// ✅ インラインスタイルで確実に適用
<button style={{ padding: '20px', fontSize: '1.25rem' }}>
```

##### 実際の使用例（WorkStep.tsx）
```jsx
// 切削条件のトグルボタン
<button
  className="w-full flex items-center justify-between bg-black/20 hover:bg-black/30 transition-colors"
  style={{ padding: '20px' }}  // Tailwindのp-4が効かなかったため
  onClick={() => setExpandedConditions(prev => ({ ...prev, [key]: !prev[key] }))}
>
  <span className="font-semibold text-emerald-300" style={{ fontSize: '1.25rem' }}>
    {key.replace(/_/g, ' ')}
  </span>
  <span className="text-emerald-400" style={{ fontSize: '1.5rem' }}>
    {isExpanded ? '−' : '+'}
  </span>
</button>
```

##### よく使うインラインスタイルの対応表
| Tailwindクラス | インラインスタイル |
|---------------|-------------------|
| `p-3` | `style={{ padding: '12px' }}` |
| `p-4` | `style={{ padding: '16px' }}` |
| `p-5` | `style={{ padding: '20px' }}` |
| `text-sm` | `style={{ fontSize: '0.875rem' }}` |
| `text-base` | `style={{ fontSize: '1rem' }}` |
| `text-lg` | `style={{ fontSize: '1.125rem' }}` |
| `text-xl` | `style={{ fontSize: '1.25rem' }}` |

#### 重要なポイント
1. **他のプロジェクトファイルを確認**
   - 多くの箇所で同じパターンが使われている
   - 特にフォントサイズやパディングでインラインスタイルが多用されている

2. **デバッグ方法**
   - 開発者ツールでElementsを確認
   - Computedスタイルで実際に適用されている値を確認
   - Tailwindクラスが適用されているか確認

3. **使い分けの指針**
   - 基本的にはTailwindクラスを使用
   - 効かない場合は即座にインラインスタイルに切り替え
   - 時間をかけてデバッグするより、確実に動く方法を選択

### 10. 作業詳細ページの画像サイズ最適化

#### 実施日: 2025年1月26日

#### 課題
作業詳細ページ（WorkInstructionResults.tsx）の概要メディアセクションで、画像が大きすぎてPC・スマホ両方で見づらい問題が発生。

#### 解決策：レスポンシブな画像サイズ設計

##### 1. グリッドレイアウトの変更
```jsx
// 変更前
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

// 変更後
<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
```

##### 2. アスペクト比の変更
- `aspect-video`（16:9）から`aspect-square`（1:1）へ
- サムネイル表示に適した正方形で統一感を向上

##### 3. 実際の画像サイズ調整
```jsx
// 変更前
width={300} height={200}

// 変更後  
width={200} height={200}
```

##### 4. 各デバイスでの表示サイズ（概算）
| デバイス | 画面幅 | 列数 | 画像サイズ |
|---------|--------|------|-----------|
| スマホ | 375px | 3列 | 約110×110px |
| タブレット | 768px | 4列 | 約170×170px |
| PC | 1200px+ | 6列 | 約180×180px |

#### デザインの考慮点
1. **適切なサムネイルサイズ**
   - 小さすぎず大きすぎない、ちょうど良いサイズ感
   - クリックで拡大表示されるため、サムネイルは概要把握に十分なサイズ

2. **モバイルファースト**
   - スマホでも3列表示で多くの画像を一覧可能
   - タップしやすいサイズを維持（最小でも110px）

3. **統一感のあるレイアウト**
   - 正方形で揃えることで整然とした印象
   - gap-3（12px）で適度な余白を確保

#### 学んだこと
- Tailwindのグリッドシステムとアスペクト比ユーティリティの組み合わせが効果的
- レスポンシブデザインは列数調整が基本
- 画像の実サイズとCSSサイズの両方を考慮する必要がある

---

**最終更新**: 2025年1月26日  
**更新者**: Claude Code  
**次回見直し**: 必要に応じて  