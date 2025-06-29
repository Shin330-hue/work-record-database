// src/lib/dataLoader.ts - 案件記録データベース用に完全書き換え

// 会社マスターデータ
export interface Company {
  id: string
  name: string
  shortName: string
  description: string
  priority: number
  products: Product[]
}

// 部品データ
export interface Product {
  id: string
  name: string
  category: string
  description: string
  drawingCount: number
  drawings: string[]
}

// 検索インデックス
export interface SearchIndex {
  drawings: DrawingSearchItem[]
  metadata: SearchMetadata
}

export interface SearchMetadata {
  totalDrawings: number
  lastIndexed: string
  version: string
}

// 検索用図番アイテム
export interface DrawingSearchItem {
  drawingNumber: string
  productName: string
  companyName: string
  companyId: string
  productId: string
  title: string
  category: string
  keywords: string[]
  folderPath: string
  hasImages: boolean
  hasVideos: boolean
  hasDrawing: boolean
  stepCount: number
  difficulty: string
  estimatedTime: string
  machineType: string
}

// 作業手順メタデータ
export interface InstructionMetadata {
  drawingNumber: string
  title: string
  companyId: string
  productId: string
  version: string
  createdDate: string
  updatedDate: string
  author: string
  difficulty: string
  estimatedTime: string
  machineType: string
  toolsRequired: string[]
}

// 作業手順概要
export interface InstructionOverview {
  description: string
  warnings: string[]
  preparationTime: string
  processingTime: string
}

// 作業ステップ
export interface WorkStep {
  stepNumber: number
  title: string
  description: string
  detailedInstructions: string[]
  images?: string[]
  videos?: string[]
  timeRequired: string
  tools?: string[]
  notes?: string[]
  warningLevel: 'normal' | 'caution' | 'important' | 'critical'
  cuttingConditions?: CuttingConditions
  qualityCheck?: QualityCheck
}

// 切削条件
export interface CuttingConditions {
  tool: string
  spindleSpeed: string
  feedRate: string
  depthOfCut?: string
  stepOver?: string
}

// 品質チェック
export interface QualityCheck {
  checkPoints: string[]
  tolerance?: string
  surfaceRoughness?: string
  inspectionTools?: string[]
}

// 関連図番
export interface RelatedDrawing {
  drawingNumber: string
  relation: string
  description: string
}

// トラブルシューティング
export interface TroubleshootingItem {
  problem: string
  cause: string
  solution: string
}

// 改訂履歴
export interface RevisionHistory {
  version: string
  date: string
  author: string
  changes: string
}

// 作業手順データ
export interface WorkInstruction {
  metadata: InstructionMetadata
  overview: InstructionOverview
  workSteps: WorkStep[]
  relatedDrawings: RelatedDrawing[]
  troubleshooting: TroubleshootingItem[]
  revisionHistory: RevisionHistory[]
}

// データ読み込み関数
export const loadCompanies = async (): Promise<Company[]> => {
  try {
    const response = await fetch('/data/companies.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.companies || []
  } catch (error) {
    console.error('会社データの読み込みに失敗:', error)
    return []
  }
}

export const loadSearchIndex = async (): Promise<SearchIndex> => {
  try {
    const response = await fetch('/data/search-index.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('検索インデックスの読み込みに失敗:', error)
    return { 
      drawings: [], 
      metadata: { 
        totalDrawings: 0, 
        lastIndexed: new Date().toISOString(), 
        version: '1.0' 
      } 
    }
  }
}

export const loadWorkInstruction = async (drawingNumber: string): Promise<WorkInstruction | null> => {
  try {
    // 図番をファイル名安全な形式に変換
    const safeDrawingNumber = drawingNumber.replace(/[^a-zA-Z0-9-]/g, '-')
    const response = await fetch(`/data/work-instructions/drawing-${safeDrawingNumber}/instruction.json`)
    
    if (!response.ok) {
      throw new Error(`図番 ${drawingNumber} の作業手順が見つかりません`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`作業手順の読み込みに失敗 (${drawingNumber}):`, error)
    return null
  }
}

// 図番をファイル名安全な形式に変換する関数
export const sanitizeDrawingNumber = (drawingNumber: string): string => {
  return drawingNumber.replace(/[^a-zA-Z0-9-]/g, '-')
}

// 会社IDから会社情報を取得
export const getCompanyById = (companies: Company[], companyId: string): Company | null => {
  return companies.find(company => company.id === companyId) || null
}

// 部品IDから部品情報を取得
export const getProductById = (company: Company, productId: string): Product | null => {
  return company.products.find(product => product.id === productId) || null
}

// 図番から検索アイテムを取得
export const getDrawingSearchItem = (searchIndex: SearchIndex, drawingNumber: string): DrawingSearchItem | null => {
  return searchIndex.drawings.find(drawing => drawing.drawingNumber === drawingNumber) || null
}