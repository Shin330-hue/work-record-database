// src/hooks/useTranslation.tsx を完全に置き換え
'use client'
import { useState, useContext, createContext, ReactNode } from 'react'

export type Language = 'ja' | 'en' | 'vi'

// 🔥 翻訳データ（シンプル版）
const translations = {
  ja: {
    whatProblem: 'どのような問題でお困りですか？',
    selectProblem: '問題を選択して、最適な解決策を見つけましょう',
    title: '金属加工トラブルシューター',
    back: '戻る',
    // カテゴリ
    'categories.surface': '表面仕上げ',
    'categories.tool': '工具関連', 
    'categories.dimension': '寸法精度',
    'categories.material': '材料問題',
    'categories.others': 'その他',
    // カテゴリ説明
    'categoryDescriptions.surface': '仕上げ面の粗さや品質に関する問題',
    'categoryDescriptions.tool': '切削工具の摩耗や破損に関する問題',
    'categoryDescriptions.dimension': '寸法のばらつきや精度に関する問題',
    'categoryDescriptions.material': '材料の性質や加工性に関する問題',
    'categoryDescriptions.others': '上記以外の加工に関する問題',
    // その他
    diagnosisAccuracy: '診断精度',
    basicSolutions: '基本対策',
    restartDiagnosis: '新しい診断を開始',
    aiAnalysis: 'AI詳細分析',
    aiLoading: '分析中...',
    aiError: 'エラーが発生しました',
    moreQuestions: '追加質問',
    questionPlaceholder: '具体的な状況や条件を教えてください...',
    askQuestion: '質問する'
  },
  en: {
    whatProblem: 'What kind of problem are you experiencing?',
    selectProblem: 'Select a problem to find the optimal solution',
    title: 'Metal Processing Troubleshooter',
    back: 'Back',
    'categories.surface': 'Surface Quality',
    'categories.tool': 'Tool Issues',
    'categories.dimension': 'Dimensional Accuracy', 
    'categories.material': 'Material Problems',
    'categories.others': 'Others',
    'categoryDescriptions.surface': 'Problems related to surface roughness and quality',
    'categoryDescriptions.tool': 'Issues with cutting tool wear and damage',
    'categoryDescriptions.dimension': 'Problems with dimensional variation and accuracy',
    'categoryDescriptions.material': 'Issues related to material properties and machinability',
    'categoryDescriptions.others': 'Other machining-related problems',
    diagnosisAccuracy: 'Diagnosis Accuracy',
    basicSolutions: 'Basic Solutions',
    restartDiagnosis: 'Start New Diagnosis',
    aiAnalysis: 'AI Detailed Analysis',
    aiLoading: 'Analyzing...',
    aiError: 'An error occurred',
    moreQuestions: 'Additional Questions',
    questionPlaceholder: 'Please describe specific conditions or situations...',
    askQuestion: 'Ask Question'
  },
  vi: {
    whatProblem: 'Bạn đang gặp vấn đề gì?',
    selectProblem: 'Chọn vấn đề để tìm giải pháp tối ưu',
    title: 'Hệ thống Chẩn đoán Gia công Kim loại',
    back: 'Quay lại',
    'categories.surface': 'Chất lượng Bề mặt',
    'categories.tool': 'Vấn đề Dụng cụ',
    'categories.dimension': 'Độ chính xác Kích thước',
    'categories.material': 'Vấn đề Vật liệu', 
    'categories.others': 'Khác',
    'categoryDescriptions.surface': 'Vấn đề về độ nhám và chất lượng bề mặt',
    'categoryDescriptions.tool': 'Vấn đề về mài mòn và hỏng hóc dụng cụ cắt',
    'categoryDescriptions.dimension': 'Vấn đề về sai lệch và độ chính xác kích thước',
    'categoryDescriptions.material': 'Vấn đề liên quan đến tính chất vật liệu và khả năng gia công',
    'categoryDescriptions.others': 'Các vấn đề gia công khác',
    diagnosisAccuracy: 'Độ chính xác Chẩn đoán',
    basicSolutions: 'Giải pháp Cơ bản',
    restartDiagnosis: 'Bắt đầu Chẩn đoán Mới',
    aiAnalysis: 'Phân tích Chi tiết AI',
    aiLoading: 'Đang phân tích...',
    aiError: 'Đã xảy ra lỗi',
    moreQuestions: 'Câu hỏi Bổ sung',
    questionPlaceholder: 'Vui lòng mô tả điều kiện hoặc tình huống cụ thể...',
    askQuestion: 'Đặt câu hỏi'
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
    // 🔥 シンプルな翻訳ロジック
    const value = (translations[language] as any)[key]
    return value || key
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