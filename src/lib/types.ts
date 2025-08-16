// src/lib/types.ts - データローダー型定義

// 企業・製品関連
export interface Company {
  id: string
  name: string
  description?: string
  contactInfo?: string
  website?: string
  address?: string
  products: Product[]
}

export interface Product {
  id: string
  name: string
  category: string
  description?: string
  specifications?: string
  modelNumber?: string
  manufacturer?: string
}

// 検索インデックス関連
export interface SearchIndex {
  drawings: DrawingSearchItem[]
  metadata: SearchMetadata
}

export interface SearchMetadata {
  totalCount: number
  lastUpdated: string
  version: string
}

export interface DrawingSearchItem {
  drawingNumber: string
  title: string
  company: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string
  }
  difficulty: '初級' | '中級' | '上級'
  estimatedTime: string
  machineType: string[]
  keywords: string[]
  description: string
  createdAt: string
  updatedAt: string
}

// 作業手順関連
export interface InstructionMetadata {
  drawingNumber: string
  title: string
  company: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string
  }
  difficulty: '初級' | '中級' | '上級'
  estimatedTime: string
  machineType: string[]
  keywords: string[]
  description: string
  createdAt: string
  updatedAt: string
}

export interface InstructionOverview {
  description: string
  warnings: string[]
  preparationTime: string
  processingTime: string
}

export interface WorkStep {
  stepNumber: number
  title: string
  description: string
  images: string[]
  videos: string[]
  warnings: string[]
  cuttingConditions?: CuttingConditions
  qualityCheck?: QualityCheck
  notes?: string
  estimatedTime?: string
  tools?: string[]
  machineSettings?: Record<string, string | number | boolean>
}

export interface CuttingConditions {
  spindleSpeed?: string
  feedRate?: string
  cuttingDepth?: string
  toolType?: string
  coolant?: string
  notes?: string
}

export interface QualityCheckItem {
  dimension: string
  tolerance: string
  measuringTool: string
  frequency: string
  notes?: string
}

export interface QualityCheck {
  items: QualityCheckItem[]
  notes?: string
}

export interface RelatedDrawing {
  drawingNumber: string
  relation: string
  description: string
}

export interface TroubleshootingItem {
  problem: string
  cause: string
  solution: string
  prevention: string
}

export interface RevisionHistory {
  version: string
  date: string
  changes: string[]
  author: string
}

export interface NearMissItem {
  incident: string
  cause: string
  consequence: string
  prevention: string
  severity: '軽微' | '中程度' | '重大'
  reportedBy: string
  date: string
}

export interface WorkInstruction {
  metadata: InstructionMetadata
  overview: InstructionOverview
  workSteps: WorkStep[]
  workStepsByMachine?: {
    machining?: WorkStep[]
    turning?: WorkStep[]
    yokonaka?: WorkStep[]
    radial?: WorkStep[]
    other?: WorkStep[]
  }
  nearMiss: NearMissItem[]
  relatedDrawings: RelatedDrawing[]
  troubleshooting?: TroubleshootingItem[]
  revisionHistory?: RevisionHistory[]
}

// アイデア関連（contributionで使用）
export interface Idea {
  id: string
  title: string
  description: string
  category: string
  status: 'draft' | 'review' | 'approved' | 'implemented' | 'rejected'
  author: string
  createdAt: string
  updatedAt: string
  tags: string[]
  attachments?: string[]
  comments?: Comment[]
}

export interface Comment {
  id: string
  content: string
  author: string
  createdAt: string
}

// 追記情報関連
export interface ContributionData {
  id: string
  drawingNumber: string
  userName: string
  timestamp: string
  status: 'active' | 'merged' | 'archived'
  targetSection: 'overview' | 'step' | 'general'
  stepNumber?: number
  content: {
    text?: string
    files?: ContributionFileData[]
  }
}

export interface ContributionFileData {
  id: string
  originalFileName: string
  filePath: string
  fileType: 'image' | 'video' | 'pdf' | 'other'
  fileSize: number
  uploadedAt: string
}

export interface ContributionFile {
  drawingNumber: string
  contributions: ContributionData[]
}