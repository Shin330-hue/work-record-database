# UI改善ガイドライン

**作成日**: 2025年8月9日  
**目的**: 今後のUI改善作業で参照すべき基本方針とカスタムCSSクラスの仕様

---

## 📌 基本方針

### カスタムCSSクラスの活用
TailwindCSSの制約を超えるため、`globals.css`にカスタムCSSクラスを定義して使用する。
具体的なピクセル値、グラデーション、複雑なアニメーションが必要な場合に活用。

### モバイルファースト
- タップエリアは最小44px以上
- フォントサイズはPC/スマホで分ける
- `active:scale-[0.99]`でタップ反応を明確に

---

## 🎨 定義済みカスタムCSSクラス

### ボタンシステム
```css
.custom-rect-button         /* 基本ボタン（20px 48px） */
.custom-rect-button.blue    /* ブルー系（デフォルト） */
.custom-rect-button.gray    /* グレー系（戻るボタン） */
.custom-rect-button.emerald /* エメラルド系（タブ） */
.custom-rect-button.purple  /* パープル系（ファイル） */
.custom-rect-button.small   /* 小サイズ（12px 24px） */
```

### 作業手順アコーディオン
```css
.work-step-accordion        /* アコーディオン本体 */
.work-step-header           /* ヘッダー部分 */
.work-step-badge            /* 工程番号バッジ */
.work-step-chevron          /* 展開アイコン */
.work-step-content          /* 手順説明テキスト（18px/16px） */
.work-step-section-title    /* セクション見出し（20px/18px） */
.work-step-detail-list      /* リスト項目（16px） */
.cutting-condition-title    /* 切削条件見出し（18px/16px、黒） */
```

### フォーム要素
```css
.custom-form-textarea       /* テキストエリア（大型） */
.custom-form-input          /* 入力フィールド */
.custom-form-select         /* セレクトボックス */
.custom-file-input          /* ファイル選択 */
```

---

## 🎯 UI改善のチェックリスト

### 新規UI実装時の確認項目
- [ ] スマホでタップしやすいか（最小44px）
- [ ] 状態変化が明確か（色・アニメーション）
- [ ] 既存のカスタムCSSクラスを活用できるか
- [ ] レスポンシブ対応（`sm:`プレフィックス）
- [ ] アクセシビリティ（コントラスト比、フォーカス）

### カラーパレット
- **エメラルド**: アクティブ状態、成功
- **パープル**: 展開状態、特殊操作
- **グレー**: 非アクティブ、戻る操作
- **黄色**: 警告、品質確認
- **白**: 基本テキスト
- **黒**: 明るい背景上のテキスト

---

## 💡 実装例

### ボタンの実装
```jsx
<button className="custom-rect-button emerald">
  タブボタン
</button>
```

### レスポンシブテキスト
```jsx
<div className="text-base sm:text-lg">
  スマホ16px、PC18px
</div>
```

### カスタムCSSの追加方法
```css
/* globals.css に追加 */
.custom-新機能 {
  font-size: 1.125rem;
  padding: 16px 32px;
}

@media (max-width: 640px) {
  .custom-新機能 {
    font-size: 1rem;
    padding: 12px 24px;
  }
}
```

---

## 📚 参考資料
詳細な実装履歴は `doc/bk/UI改善記録_v2.0.md` を参照