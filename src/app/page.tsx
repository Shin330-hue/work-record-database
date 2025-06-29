// src/app/page.tsx - TranslationProviderを削除
'use client'
import { useState, useEffect } from 'react'
import { loadAdviceData, AdviceData, AdviceNode } from '@/lib/dataLoader'
import { buildDiagnosisContext, DiagnosisContext, Advice } from '@/lib/contextBuilder'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSelector from '@/components/LanguageSelector'
import TroubleshootingResults from '@/components/TroubleshootingResults'
import Image from "next/image";
import Link from "next/link";
import ParticleBackground from "@/components/ParticleBackground";

interface CategoryOption {
  id: string
  label: string
  icon: string
  description: string
}

function TroubleshootingContent() {
  const { t } = useTranslation()
  const [data, setData] = useState<AdviceData | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectionPath, setSelectionPath] = useState<string[]>([])
  const [currentAdvice, setCurrentAdvice] = useState<Advice | null>(null)
  const [diagnosisContext, setDiagnosisContext] = useState<DiagnosisContext | null>(null)

  useEffect(() => {
    loadAdviceData().then(setData)
  }, [])

  // 🔥 安全な翻訳対応の表示関数
  const getDisplayText = (node: AdviceNode | null, field: 'label' | 'description') => {
    if (!node) return ''
    if (field === 'label') {
      return t(node.label)
    }
    if (field === 'description') {
      return t(node.description || '')
    }
    return node[field] || ''
  }

  // 🔥 カテゴリ表示の修正（安全性向上）
  const getCategoryDisplayText = (category: any, field: 'label' | 'description') => {
    if (!category) return ''
    if (field === 'label') {
      return t(category.label)
    }
    if (field === 'description') {
      return t(category.description)
    }
    return category[field] || ''
  }

  const getCurrentOptions = (): (CategoryOption | AdviceNode)[] => {
    if (!data) return []
    
    if (currentStep === 0) {
      return [...data.mainCategories, data.otherCategory]
    }
    
    // 🔥 現在のカテゴリに属する問題を取得
    if (currentStep === 1) {
      const selectedCategory = selectionPath[0]
      return data.problems.filter(p => p.category === selectedCategory)
    }
    
    // 🔥 現在のノードの子要素を取得（安全性向上）
    const currentNode = getCurrentNode()
    return currentNode?.children || []
  }

  const getCurrentNode = (): AdviceNode | null => {
    if (!data || selectionPath.length === 0) return null
    
    return findNodeByPath(data.problems, selectionPath.slice(1)) // 🔥 カテゴリを除く
  }

  const findNodeByPath = (nodes: AdviceNode[], path: string[]): AdviceNode | null => {
    if (path.length === 0) return null
    
    for (const node of nodes) {
      if (node.id === path[0]) {
        if (path.length === 1) {
          return node
        }
        if (node.children) {
          return findNodeByPath(node.children, path.slice(1))
        }
      }
    }
    return null
  }

  const handleOptionSelect = (option: CategoryOption | AdviceNode) => {
    if (!data) return

    const newPath = [...selectionPath, option.id]
    setSelectionPath(newPath)

    if (currentStep === 0) {
      // カテゴリ選択
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // 問題選択
      const selectedProblem = data.problems.find(p => p.id === option.id)
      if (selectedProblem?.children && selectedProblem.children.length > 0) {
        setCurrentStep(2)
      } else if (selectedProblem?.advice) {
        // 直接アドバイスがある場合
        const context = buildDiagnosisContext(newPath)
        setDiagnosisContext(context)
        setCurrentAdvice(selectedProblem.advice)
      }
    } else {
      // 詳細選択
      const currentNode = getCurrentNode()
      const selectedChild = currentNode?.children?.find(child => child.id === option.id)
      
      if (selectedChild?.advice) {
        const context = buildDiagnosisContext(newPath)
        setDiagnosisContext(context)
        setCurrentAdvice(selectedChild.advice)
      } else if (selectedChild?.children && selectedChild.children.length > 0) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleGoBack = () => {
    if (currentStep > 0) {
      setSelectionPath(selectionPath.slice(0, -1))
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setSelectionPath([])
    setCurrentAdvice(null)
    setDiagnosisContext(null)
  }

  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '18px'
      }}>
        読み込み中...
      </div>
    )
  }

  const renderContent = () => {
    if (currentAdvice && diagnosisContext) {
      return (
        <TroubleshootingResults
          advice={currentAdvice}
          context={diagnosisContext}
          onRestart={handleRestart}
        />
      )
    }

    // 🔥 タイトル表示の安全性向上
    const getTitle = () => {
      if (currentStep === 0) {
        return t('whatProblem')
      } else if (currentStep === 1) {
        const categoryId = selectionPath[0]
        return getCategoryDisplayText({ id: categoryId }, 'label') || '問題を選択'
      } else {
        const currentNode = getCurrentNode()
        return getDisplayText(currentNode, 'label') || '詳細を選択'
      }
    }

    return (
      <div style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '10px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          {getTitle()}
        </h1>

        {currentStep === 0 && (
          <p style={{ fontSize: '16px', color: '#a0a0a0', marginBottom: '40px' }}>
            {t('selectProblem')}
          </p>
        )}

        {currentStep > 0 && (
          <button
            onClick={handleGoBack}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto 30px auto'
            }}
          >
            ← {t('back')}
          </button>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          padding: '0 20px'
        }}>
          {getCurrentOptions().map((option) => (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              style={{
                background: 'rgba(30, 30, 50, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                {option.icon}
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                margin: '0 0 10px 0',
                color: 'white'
              }}>
                {currentStep === 0 
                  ? getCategoryDisplayText(option, 'label')
                  : getDisplayText(option as AdviceNode, 'label')
                }
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#a0a0a0', 
                margin: 0,
                lineHeight: '1.4'
              }}>
                {currentStep === 0 
                  ? getCategoryDisplayText(option, 'description')
                  : getDisplayText(option as AdviceNode, 'description')
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative">
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <LanguageSelector />
        {renderContent()}
      </div>
    </main>
  )
}

// 🔥 ここでTranslationProviderを削除（layout.tsxで行う）
export default function Home() {
  return <TroubleshootingContent />
}