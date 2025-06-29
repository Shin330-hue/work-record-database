// src/hooks/useTranslation.tsx - 案件記録データベース用に完全書き換え
'use client'
import { useState, useContext, createContext, type ReactNode } from 'react'

export type Language = 'ja' | 'en' | 'vi'

// 案件記録データベース用翻訳データ
const translations = {
  ja: {
    // メイン画面
    title: '案件記録データベース',
    searchPlaceholder: '図番を入力してください（例: ABC-001）',
    selectCompany: '会社を選択してください',
    selectProduct: '部品を選択してください', 
    selectDrawing: '図番を選択してください',
    
    // 検索関連
    searchResults: '検索結果',
    noResults: '該当する図番が見つかりません',
    exactMatch: '完全一致',
    partialMatch: '部分一致',
    recentSearches: '最近の検索',
    clearSearch: '検索をクリア',
    
    // 作業手順表示
    workInstruction: '作業手順',
    overview: '概要',
    estimatedTime: '所要時間',
    difficulty: '難易度',
    machineType: '使用機械',
    toolsRequired: '必要工具',
    workSteps: '作業ステップ',
    step: 'ステップ',
    cuttingConditions: '切削条件',
    qualityCheck: '品質確認',
    relatedDrawings: '関連図番',
    troubleshooting: 'トラブルシューティング',
    revisionHistory: '改訂履歴',
    
    // ナビゲーション
    backToSearch: '検索に戻る',
    backToCompanies: '会社選択に戻る',
    backToProducts: '部品選択に戻る',
    breadcrumbHome: 'ホーム',
    
    // 難易度
    beginner: '初級',
    intermediate: '中級', 
    advanced: '上級',
    
    // 警告レベル
    normal: '通常',
    caution: '注意',
    important: '重要',
    critical: '緊急',
    
    // その他
    totalDrawings: '総図番数',
    totalCompanies: '総会社数',
    lastUpdated: '最終更新',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    retry: '再試行',
    
    // 作業手順詳細
    preparationTime: '準備時間',
    processingTime: '加工時間',
    timeRequired: '所要時間',
    warnings: '注意事項',
    notes: '備考',
    tool: '工具',
    spindleSpeed: '主軸回転数',
    feedRate: '送り速度',
    depthOfCut: '切込み深さ',
    stepOver: '送りピッチ',
    coolant: '切削油',
    checkPoints: '確認項目',
    tolerance: '公差',
    surfaceRoughness: '表面粗さ',
    inspectionTools: '検査工具',
    relation: '関連',
    problem: '問題',
    cause: '原因',
    solution: '解決策',
    version: 'バージョン',
    author: '作成者',
    changes: '変更内容',
    createdDate: '作成日',
    updatedDate: '更新日',
    media: 'メディア'
  },
  en: {
    // Main screen
    title: 'Project Record Database',
    searchPlaceholder: 'Enter drawing number (e.g. ABC-001)',
    selectCompany: 'Select Company',
    selectProduct: 'Select Product',
    selectDrawing: 'Select Drawing',
    
    // Search related
    searchResults: 'Search Results',
    noResults: 'No matching drawings found',
    exactMatch: 'Exact Match',
    partialMatch: 'Partial Match',
    recentSearches: 'Recent Searches',
    clearSearch: 'Clear Search',
    
    // Work instruction display
    workInstruction: 'Work Instruction',
    overview: 'Overview',
    estimatedTime: 'Estimated Time',
    difficulty: 'Difficulty',
    machineType: 'Machine Type',
    toolsRequired: 'Required Tools',
    workSteps: 'Work Steps',
    step: 'Step',
    cuttingConditions: 'Cutting Conditions',
    qualityCheck: 'Quality Check',
    relatedDrawings: 'Related Drawings',
    troubleshooting: 'Troubleshooting',
    revisionHistory: 'Revision History',
    
    // Navigation
    backToSearch: 'Back to Search',
    backToCompanies: 'Back to Companies',
    backToProducts: 'Back to Products',
    breadcrumbHome: 'Home',
    
    // Difficulty levels
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    
    // Warning levels
    normal: 'Normal',
    caution: 'Caution',
    important: 'Important',
    critical: 'Critical',
    
    // Others
    totalDrawings: 'Total Drawings',
    totalCompanies: 'Total Companies',
    lastUpdated: 'Last Updated',
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    
    // Work instruction details
    preparationTime: 'Preparation Time',
    processingTime: 'Processing Time',
    timeRequired: 'Time Required',
    warnings: 'Warnings',
    notes: 'Notes',
    tool: 'Tool',
    spindleSpeed: 'Spindle Speed',
    feedRate: 'Feed Rate',
    depthOfCut: 'Depth of Cut',
    stepOver: 'Step Over',
    coolant: 'Coolant',
    checkPoints: 'Check Points',
    tolerance: 'Tolerance',
    surfaceRoughness: 'Surface Roughness',
    inspectionTools: 'Inspection Tools',
    relation: 'Relation',
    problem: 'Problem',
    cause: 'Cause',
    solution: 'Solution',
    version: 'Version',
    author: 'Author',
    changes: 'Changes',
    createdDate: 'Created Date',
    updatedDate: 'Updated Date',
    media: 'Media'
  },
  vi: {
    // Màn hình chính
    title: 'Cơ sở dữ liệu Hồ sơ Dự án',
    searchPlaceholder: 'Nhập số bản vẽ (ví dụ: ABC-001)',
    selectCompany: 'Chọn Công ty',
    selectProduct: 'Chọn Sản phẩm',
    selectDrawing: 'Chọn Bản vẽ',
    
    // Liên quan đến tìm kiếm
    searchResults: 'Kết quả Tìm kiếm',
    noResults: 'Không tìm thấy bản vẽ phù hợp',
    exactMatch: 'Khớp chính xác',
    partialMatch: 'Khớp một phần',
    recentSearches: 'Tìm kiếm Gần đây',
    clearSearch: 'Xóa Tìm kiếm',
    
    // Hiển thị hướng dẫn công việc
    workInstruction: 'Hướng dẫn Công việc',
    overview: 'Tổng quan',
    estimatedTime: 'Thời gian Ước tính',
    difficulty: 'Độ khó',
    machineType: 'Loại Máy',
    toolsRequired: 'Công cụ Cần thiết',
    workSteps: 'Các bước Công việc',
    step: 'Bước',
    cuttingConditions: 'Điều kiện Cắt',
    qualityCheck: 'Kiểm tra Chất lượng',
    relatedDrawings: 'Bản vẽ Liên quan',
    troubleshooting: 'Xử lý Sự cố',
    revisionHistory: 'Lịch sử Sửa đổi',
    
    // Điều hướng
    backToSearch: 'Quay lại Tìm kiếm',
    backToCompanies: 'Quay lại Công ty',
    backToProducts: 'Quay lại Sản phẩm',
    breadcrumbHome: 'Trang chủ',
    
    // Mức độ khó
    beginner: 'Người mới bắt đầu',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
    
    // Mức độ cảnh báo
    normal: 'Bình thường',
    caution: 'Cẩn thận',
    important: 'Quan trọng',
    critical: 'Khẩn cấp',
    
    // Khác
    totalDrawings: 'Tổng số Bản vẽ',
    totalCompanies: 'Tổng số Công ty',
    lastUpdated: 'Cập nhật Cuối',
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi',
    retry: 'Thử lại',
    
    // Chi tiết hướng dẫn công việc
    preparationTime: 'Thời gian Chuẩn bị',
    processingTime: 'Thời gian Gia công',
    timeRequired: 'Thời gian Cần thiết',
    warnings: 'Cảnh báo',
    notes: 'Ghi chú',
    tool: 'Công cụ',
    spindleSpeed: 'Tốc độ Trục chính',
    feedRate: 'Tốc độ Tiến dao',
    depthOfCut: 'Độ sâu Cắt',
    stepOver: 'Bước Tiến dao',
    coolant: 'Dầu cắt',
    checkPoints: 'Điểm Kiểm tra',
    tolerance: 'Dung sai',
    surfaceRoughness: 'Độ nhám Bề mặt',
    inspectionTools: 'Công cụ Kiểm tra',
    relation: 'Quan hệ',
    problem: 'Vấn đề',
    cause: 'Nguyên nhân',
    solution: 'Giải pháp',
    version: 'Phiên bản',
    author: 'Tác giả',
    changes: 'Thay đổi',
    createdDate: 'Ngày Tạo',
    updatedDate: 'Ngày Cập nhật',
    media: 'Media'
  }
}

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja')
  
  const t = (key: string): string => {
    const langData = translations[language] as Record<string, string>
    return langData[key] || key
  }
  
  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}