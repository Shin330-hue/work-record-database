# 社内AI・RAG機能実装仕様書

**作成日**: 2025年1月10日  
**バージョン**: 1.0  
**ステータス**: 設計段階  
**対象システム**: 田中工業AI（作業記録データベース統合）

---

## 📋 概要

### システム名
**田中工業AI with RAG** (Retrieval-Augmented Generation)

### 目的
現在の作業記録データベースと田中工業AIチャット機能を統合し、社内の製造ノウハウを活用したインテリジェントなAIアシスタントを構築する。

### コンセプト
- **継続的な会話**: チャット形式で自然な対話
- **社内データ活用**: 既存の図番・作業手順・追記データを検索・参照
- **コンテキスト維持**: 会話履歴を踏まえた関連情報の提示
- **現場知見統合**: 追記情報による実践的なアドバイス

---

## 🎯 機能要件

### Phase 1: 基本RAG機能（推定実装時間: 2-3時間）

#### 1.1 データ検索API
- **エンドポイント**: `/api/knowledge`
- **機能**: キーワードベースの社内データ検索
- **対象データ**:
  - companies.json（会社・製品情報）
  - instruction.json（作業手順メタデータ）
  - contributions.json（追記情報・現場知見）

#### 1.2 チャット統合
- **既存APIの拡張**: `/api/chat`
- **機能**: ユーザーの質問から自動的に関連データを検索・統合
- **プロンプト拡張**: 検索結果をコンテキストとしてAIに送信

#### 1.3 基本検索ロジック
```javascript
// キーワード抽出
materials: ['SS400', 'SUS304', 'アルミ', 'S45C']
machines: ['マシニング', 'ターニング', '横中', 'ラジアル']  
processes: ['切削', '穴あけ', 'タップ', 'あり溝']
companies: ['中央鉄工所', 'サンエイ工業']
```

### Phase 2: 継続的会話機能（推定実装時間: 3-4時間）

#### 2.1 会話コンテキスト管理
- **機能**: 全会話履歴からキーワード抽出・累積
- **対象**:
  - 言及された図番の記憶
  - 話題の材質・機械種別の継続
  - 関連データの自動追加

#### 2.2 関連データ自動提示
- **類似事例検索**: 同じ材質・機械種別の他の図番
- **関連追記表示**: 該当する現場知見の提示
- **統計情報生成**: 「○○社で△△件の作業手順があります」

#### 2.3 代名詞対応
- **自然言語処理**: 「それ」「その図番」「同じ材質で」などに対応
- **コンテキスト参照**: 前回言及した図番・材質を記憶

### Phase 3: 高度なRAG機能（推定実装時間: 1-2日）

#### 3.1 ベクトル検索（将来拡張）
- **埋め込みモデル**: OpenAI text-embedding-3-small
- **意味検索**: キーワードマッチングを超えた類似度検索
- **ハイブリッド検索**: キーワード + ベクトル検索の組み合わせ

#### 3.2 画像データ統合
- **画像解析**: 作業手順画像の内容を検索対象に追加
- **視覚的情報**: 「この画像のような加工方法」への対応

---

## 🏗️ システム構成

### データフロー
```
ユーザー質問 
↓
キーワード抽出
↓  
社内データ検索（companies.json, instruction.json, contributions.json）
↓
関連データ統合
↓
拡張プロンプト生成
↓
AI（Ollama/Gemini）
↓
回答生成
```

### API設計

#### `/api/knowledge` (新規)
```typescript
// GET: データ検索
interface KnowledgeSearchRequest {
  query: string
  context?: string[] // 会話履歴
  filters?: {
    companies?: string[]
    materials?: string[]
    machines?: string[]
  }
}

interface KnowledgeSearchResponse {
  companies: CompanyInfo[]
  drawings: DrawingInfo[]
  contributions: ContributionInfo[]
  statistics: SearchStatistics
}
```

#### `/api/chat` (既存拡張)
```typescript
// POST: チャット（RAG統合）
interface ChatRequest {
  messages: Message[]
  model: string
  enableRAG?: boolean // RAG機能の有効/無効
}
```

---

## 💾 データ構造

### 検索対象データ

#### 会社・製品情報
```json
{
  "companyName": "有限会社中央鉄工所",
  "productName": "チェーンソー", 
  "category": "ブラケット",
  "drawingCount": 1,
  "drawings": ["0D127100014"]
}
```

#### 作業手順メタデータ
```json
{
  "drawingNumber": "sanei_24K022",
  "title": "フランジ（アリ溝_SS400_リング）加工手順",
  "machineType": ["ターニング"],
  "difficulty": "中級",
  "estimatedTime": "180分",
  "materials": ["SS400"]
}
```

#### 追記情報（現場知見）
```json
{
  "contributor": "古川達久",
  "content": "あり溝 送り0.10 切込み0.2",
  "imageCount": 8,
  "timestamp": "2025-07-22",
  "targetDrawing": "sanei_24K022"
}
```

---

## 🔧 実装詳細

### ファイル構成
```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts (既存修正)
│   │   └── knowledge/route.ts (新規)
│   └── chat/page.tsx (既存修正)
├── lib/
│   ├── knowledge-search.ts (新規)
│   ├── context-manager.ts (新規)
│   └── data-aggregator.ts (新規)
└── types/
    └── knowledge.ts (新規)
```

### 主要関数

#### キーワード抽出
```javascript
function extractKeywords(text: string): ExtractedKeywords {
  return {
    materials: findMaterials(text),
    machines: findMachines(text), 
    processes: findProcesses(text),
    drawings: findDrawingNumbers(text),
    companies: findCompanies(text)
  }
}
```

#### データ検索
```javascript  
function searchWorkInstructions(
  keywords: ExtractedKeywords,
  context?: ConversationContext
): SearchResults {
  const results = {
    directMatches: [], // 直接マッチ
    relatedDrawings: [], // 関連図番
    contributions: [], // 追記データ
    statistics: {} // 統計情報
  }
  // 実装詳細...
}
```

#### コンテキスト管理
```javascript
function buildConversationContext(
  messages: Message[]
): ConversationContext {
  return {
    mentionedDrawings: extractAllDrawings(messages),
    discussedMaterials: extractAllMaterials(messages),
    activeTopics: identifyTopics(messages),
    searchHistory: buildSearchHistory(messages)
  }
}
```

---

## 🎬 動作例

### シナリオ1: 基本検索
```
ユーザー: 「SS400のターニング加工で注意点ある？」

【内部処理】
1. キーワード抽出: materials=['SS400'], machines=['ターニング']
2. データ検索: 2件の図番がマッチ
3. 追記検索: 3件の現場知見がマッチ

AI: 「SS400のターニング加工について、社内データから2件の事例があります。
特にsanei_24K022では古川さんから『溶接部注意』『送り0.10 切込み0.2』
という現場知見が寄せられています...」
```

### シナリオ2: 継続会話
```
ユーザー: 「その図番の詳細教えて」

【内部処理】  
1. 前回会話から図番特定: sanei_24K022
2. 詳細データ検索: 作業手順、画像、追記全て
3. 関連データ追加: 同じ材質の他事例

AI: 「図番sanei_24K022の詳細です。
フランジ（アリ溝_SS400_リング）の加工手順で、推定時間180分...
関連する類似事例として図番12750800122もあります」
```

### シナリオ3: 統計・分析
```
ユーザー: 「うちの会社でSUS304の事例どのくらいある？」

【内部処理】
1. 会社特定: 会話履歴から推定 or 全社検索
2. 材質フィルタ: SUS304
3. 統計生成: 件数、機械種別分布、難易度分布

AI: 「SUS304の加工事例は全5件あります。
内訳はマシニング3件、ターニング2件で、
難易度は中級が多く、平均所要時間は120分です...」
```

---

## 🚀 実装フェーズ

### Phase 1: 最小実装（2-3時間）
- [ ] `/api/knowledge` エンドポイント作成
- [ ] 基本キーワード抽出機能
- [ ] チャットAPIにRAG統合
- [ ] 簡単なUI表示（検索中インジケータ）

### Phase 2: 継続会話（3-4時間）  
- [ ] 会話コンテキスト管理
- [ ] 関連データ自動提示
- [ ] 代名詞・参照解決
- [ ] 統計情報生成

### Phase 3: 高度機能（1-2日）
- [ ] ベクトル検索導入
- [ ] 画像データ統合
- [ ] パフォーマンス最適化
- [ ] 詳細ログ・分析機能

---

## 🔒 技術的考慮事項

### パフォーマンス
- **キャッシュ機能**: 検索結果の一時保存
- **インデックス**: よく使われるキーワードのインデックス化
- **バッチ処理**: 大量データ検索の最適化

### セキュリティ
- **アクセス制御**: 社内ネットワーク限定（既存と同様）
- **データ検証**: 検索クエリの入力検証
- **ログ管理**: 検索履歴の適切な管理

### 拡張性
- **モジュール設計**: 検索エンジンの交換可能性
- **データソース追加**: 新しいデータ形式への対応
- **多言語対応**: 英語・ベトナム語への拡張準備

---

## 📊 期待効果

### 業務効率化
- **検索時間短縮**: 自然言語で複雑な条件検索
- **知見活用**: 散在する現場知識の統合活用
- **学習促進**: 関連事例の自動提示による知識拡大

### 技術的価値
- **RAG技術習得**: 最新AI技術の実践的導入
- **データ活用**: 既存データの価値最大化
- **システム統合**: AI機能と業務システムの融合

### 組織的効果
- **知識共有促進**: AIを介した自然な知識伝達
- **標準化推進**: 類似事例の比較による作業標準化
- **継続改善**: データに基づく作業手順の最適化

---

## 📝 今後の展望

### 短期目標（1ヶ月）
- Phase 1の完全実装
- 基本的なRAG機能の安定稼働
- ユーザーフィードバック収集

### 中期目標（3ヶ月）
- Phase 2の完全実装  
- 継続会話機能の成熟
- 検索精度の向上

### 長期目標（6ヶ月）
- Phase 3の高度機能実装
- 他部門への展開検討
- 外部システム連携の検討

---

**最終更新**: 2025年1月10日  
**次回レビュー**: 実装完了後  
**承認者**: プロジェクトマネージャー  
**実装担当**: 開発チーム