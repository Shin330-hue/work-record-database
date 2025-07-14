export interface ContributionData {
  id: string
  userId: string
  userName: string
  timestamp: string
  type: 'comment' | 'image' | 'video' | 'nearmiss' | 'troubleshoot'
  targetSection: 'overview' | 'step' | 'general'
  stepNumber?: number
  content: ContributionContent
  status: 'active' | 'merged' | 'archived'
}

export interface ContributionContent {
  text?: string
  imagePath?: string
  videoPath?: string
  originalFileName?: string
  fileSize?: number
  nearmiss?: NearMissContribution
  troubleshoot?: TroubleshootContribution
}

export interface NearMissContribution {
  title: string
  description: string
  cause: string
  prevention: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface TroubleshootContribution {
  problem: string
  cause: string
  solution: string
  tools?: string[]
  conditions?: string[]
}

export interface ContributionFile {
  drawingNumber: string
  contributions: ContributionData[]
  metadata: ContributionMetadata
}

export interface ContributionMetadata {
  totalContributions: number
  lastUpdated: string
  version: string
  mergedCount: number
}

export interface ContributionStats {
  byUser: Record<string, number>
  byType: Record<string, number>
  bySection: Record<string, number>
  recent: ContributionData[]
}