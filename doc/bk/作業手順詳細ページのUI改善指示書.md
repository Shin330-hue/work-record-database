# 作業手順詳細ページのUI改善指示書

現在のページが文字の羅列で見づらいので、視覚的に美しく機能的なデザインに改善してください。

## 🎯 改善の方向性

### 1. カラーパレットの統一
```
Primary: #FFD700 (Gold) - 重要な情報
Secondary: #4169E1 (Royal Blue) - アクション項目
Success: #32CD32 (Lime Green) - 品質確認・成功状態
Warning: #FF8C00 (Dark Orange) - 注意事項
Critical: #DC143C (Crimson) - 重要度：critical
Background: rgba(255,255,255,0.05) - カード背景
Border: rgba(255,215,0,0.2) - ボーダー
```

### 2. タイポグラフィの階層化
- **H1（図番）**: 2.5rem, font-weight: 700, color: #FFD700
- **H2（ステップタイトル）**: 1.75rem, font-weight: 600, color: #FFFFFF
- **H3（セクション）**: 1.25rem, font-weight: 500, color: #4169E1
- **Body**: 1rem, line-height: 1.6, color: #E0E0E0
- **Caption**: 0.875rem, color: #B0B0B0

### 3. ステップカードのデザイン改善

```jsx
// 各ステップを以下のような構造に
<div className="step-card mb-8 bg-white/5 rounded-2xl border border-yellow-500/20 overflow-hidden">
  {/* ステップヘッダー */}
  <div className="step-header bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-6">
    <div className="flex items-center gap-4">
      <div className="step-number w-12 h-12 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-lg">
        {step.stepNumber}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white">{step.title}</h3>
        <div className="flex gap-4 text-sm text-gray-300 mt-1">
          <span>⏱️ {step.timeRequired}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${getWarningLevelStyle(step.warningLevel)}`}>
            {getWarningIcon(step.warningLevel)} {t(step.warningLevel)}
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* ステップコンテンツ */}
  <div className="step-content p-6 space-y-6">
    {/* 詳細手順 */}
    <div className="detailed-instructions">
      <h4 className="text-lg font-medium text-blue-400 mb-3 flex items-center gap-2">
        📋 詳細手順
      </h4>
      <ol className="space-y-3">
        {step.detailedInstructions.map((instruction, i) => (
          <li key={i} className="flex gap-3">
            <span className="step-counter w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-gray-200">{instruction}</span>
          </li>
        ))}
      </ol>
    </div>
    
    {/* 切削条件 */}
    {step.cuttingConditions && (
      <div className="cutting-conditions bg-black/30 rounded-xl p-4 border-l-4 border-orange-500">
        <h4 className="text-lg font-medium text-orange-400 mb-3 flex items-center gap-2">
          ⚙️ 切削条件
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 切削条件の詳細表示 */}
        </div>
      </div>
    )}
    
    {/* 品質確認 */}
    {step.qualityCheck && (
      <div className="quality-check bg-green-500/10 rounded-xl p-4 border-l-4 border-green-500">
        <h4 className="text-lg font-medium text-green-400 mb-3 flex items-center gap-2">
          ✅ 品質確認
        </h4>
        {/* 品質確認の詳細 */}
      </div>
    )}
    
    {/* 備考 */}
    {step.notes && (
      <div className="notes bg-blue-500/10 rounded-xl p-4 border-l-4 border-blue-500">
        <h4 className="text-lg font-medium text-blue-400 mb-3 flex items-center gap-2">
          💡 備考
        </h4>
        <ul className="space-y-2">
          {step.notes.map((note, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-blue-400 text-sm mt-1">▸</span>
              <span className="text-blue-200 text-sm">{note}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>
```

### 4. 警告レベルの視覚化

```jsx
const getWarningLevelStyle = (level) => {
  const styles = {
    'normal': 'bg-green-500/20 text-green-400 border border-green-500/30',
    'caution': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'important': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'critical': 'bg-red-500/20 text-red-400 border border-red-500/30'
  }
  return styles[level] || styles.normal
}

const getWarningIcon = (level) => {
  const icons = {
    'normal': '✅',
    'caution': '⚠️',
    'important': '🔶',
    'critical': '🚨'
  }
  return icons[level] || '✅'
}
```

### 5. 画像・動画セクションの改善

```jsx
<div className="media-section">
  <h4 className="text-lg font-medium text-purple-400 mb-4 flex items-center gap-2">
    📷 作業画像・動画
  </h4>
  <div className="media-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {step.images?.map((img, i) => (
      <div key={i} className="media-item group">
        <div className="media-preview relative overflow-hidden rounded-xl bg-black/40 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
          <div className="media-label absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-xs text-white font-medium">{img}</span>
          </div>
          <img 
            src={`/data/work-instructions/drawing-${instruction.metadata.drawingNumber}/images/${getActualFileName(instruction.metadata.drawingNumber, 'image')}`}
            alt={`ステップ${step.stepNumber} - ${img}`}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/file.svg'
              e.currentTarget.alt = '画像が見つかりません'
            }}
          />
          <div className="media-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>
    ))}
  </div>
</div>
```

### 6. タブナビゲーションの改善

```jsx
<div className="tab-navigation sticky top-4 z-20 mb-8">
  <div className="tab-container bg-black/80 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/25'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  </div>
</div>
```

### 7. アニメーション・トランジション

```css
/* スムーズなスクロールとアニメーション */
.step-card {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.step-card:nth-child(1) { animation-delay: 0.1s; }
.step-card:nth-child(2) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ホバー効果 */
.step-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(255, 215, 0, 0.1);
}
```

### 8. レスポンシブ対応

```jsx
// モバイル対応の改善
<div className="work-instruction-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* コンテンツ */}
</div>

// グリッドのブレークポイント調整
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

## 🚀 実装の優先順位

1. **最優先**: ステップカードのビジュアル改善
2. **高優先**: カラーパレットの統一と警告レベルの視覚化
3. **中優先**: メディアセクションの改善
4. **低優先**: アニメーション・トランジション

## 💡 追加のアイデア

- プログレスバー（現在のステップ / 全体ステップ）
- ステップ間のナビゲーション（前へ/次へボタン）
- 印刷用CSS（@media print）
- ダークモード/ライトモードの切り替え
- ステップ完了チェックボックス（ローカルストレージ）

この指示に従って `src/components/WorkInstructionResults.tsx` を改善してください。