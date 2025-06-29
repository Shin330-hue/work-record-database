'use client'
import { useState } from 'react'
import { DiagnosisContext, Advice } from '@/lib/contextBuilder'
import { useTranslation } from '@/hooks/useTranslation'

interface Props {
  context: DiagnosisContext
  basicAdvice: Advice
}

export default function AIDetailedAdvice({ context, basicAdvice }: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<string>('')
  const [error, setError] = useState<string>('')

  const generateAIAdvice = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // 実際のAI分析はここで実装
      // 今は仮の応答を返す
      await new Promise(resolve => setTimeout(resolve, 2000))
      setAiAdvice('AI分析結果：切削条件を最適化することで、この問題を効果的に解決できます。')
    } catch (err) {
      setError(t('aiError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      background: 'rgba(30, 30, 50, 0.6)', 
      borderRadius: '15px', 
      padding: '25px',
      marginBottom: '25px'
    }}>
      <h3 style={{ 
        fontSize: '20px', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🤖 {t('aiAnalysis')}
      </h3>

      {!aiAdvice && !isLoading && (
        <button
          onClick={generateAIAdvice}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          AI詳細分析を開始
        </button>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>🔄 {t('aiLoading')}</div>
        </div>
      )}

      {error && (
        <div style={{ color: '#ff6b6b', padding: '10px' }}>
          {error}
        </div>
      )}

      {aiAdvice && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '15px',
          borderRadius: '8px',
          borderLeft: '4px solid #667eea'
        }}>
          {aiAdvice}
        </div>
      )}
    </div>
  )
}