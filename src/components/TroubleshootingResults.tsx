// src/components/TroubleshootingResults.tsx - パス修正版
'use client'
import { DiagnosisContext, Advice } from '@/lib/contextBuilder'
import { useTranslation } from '@/hooks/useTranslation'
import AIDetailedAdvice from './AIDetailedAdvice'

interface TroubleshootingResultsProps {
  advice: Advice
  context: DiagnosisContext
  onRestart: () => void
}

export default function TroubleshootingResults({ advice, context, onRestart }: TroubleshootingResultsProps) {
  const { t } = useTranslation()

  const getLocalizedAdvice = (): Advice => {
    const problemId = context.selectionPath[context.selectionPath.length - 1]
    
    return {
      ...advice,
      title: t(`adviceTitle.${problemId}`) || advice.title,
      text: t(`adviceText.${problemId}`) || advice.text,
      items: advice.items?.map(item => ({
        ...item,
        title: t(`problems.${problemId}`) || item.title,
        description: t(`problemDescriptions.${problemId}`) || item.description
      }))
    }
  }

  const localizedAdvice = getLocalizedAdvice()

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>💡</div>
        <h1 style={{ 
          fontSize: '28px', 
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {localizedAdvice.title}
        </h1>

        <div style={{ 
          background: `rgba(102, 204, 102, 0.2)`,
          border: `1px solid rgba(102, 204, 102, 0.4)`,
          borderRadius: '20px',
          padding: '8px 16px',
          display: 'inline-block',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          🎯 {t('diagnosisAccuracy')}: {(context.confidence * 100).toFixed(0)}% | 
          {t('path')}: {context.selectionPath.join(' → ')}
        </div>

        <p style={{ fontSize: '16px', color: '#e0e0e0', lineHeight: '1.6' }}>
          {localizedAdvice.text}
        </p>
      </div>

      {/* 🔥 画像表示セクション - パス修正 */}
      {localizedAdvice.image && (
        <div style={{ 
          background: 'rgba(30, 30, 50, 0.6)', 
          borderRadius: '15px', 
          padding: '25px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            📸 参考画像
          </h3>
          <div style={{ 
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'inline-block',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <img 
              src={`/media/${localizedAdvice.image}`} // 🔥 /media/に修正
              alt={localizedAdvice.title}
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '400px'
              }}
              onError={(e) => {
                console.log('画像読み込みエラー:', localizedAdvice.image) // 🔥 デバッグ用
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `
                    <div style="
                      padding: 40px; 
                      background: rgba(255,255,255,0.05); 
                      border: 2px dashed rgba(255,255,255,0.2);
                      color: #888;
                      border-radius: 10px;
                    ">
                      📷 探している画像: ${localizedAdvice.image}<br>
                      🔍 実際のパス: /media/${localizedAdvice.image}<br>
                      📁 利用可能なファイル: surface_bad.jpg, tool_broken.jpg<br>
                      <small style="color: #666;">画像ファイルが見つかりません</small>
                    </div>
                  `
                }
              }}
            />
          </div>
        </div>
      )}

      {/* 🔥 動画表示セクション - パス修正 */}
      {localizedAdvice.video && (
        <div style={{ 
          background: 'rgba(30, 30, 50, 0.6)', 
          borderRadius: '15px', 
          padding: '25px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            🎥 解説動画
          </h3>
          <div style={{ 
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'inline-block',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: '100%'
          }}>
            <video 
              controls
              style={{
                maxWidth: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '400px'
              }}
              onError={(e) => {
                const target = e.target as HTMLVideoElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `
                    <div style="
                      padding: 40px; 
                      background: rgba(255,255,255,0.05); 
                      border: 2px dashed rgba(255,255,255,0.2);
                      color: #888;
                      border-radius: 10px;
                    ">
                      🎥 動画: ${localizedAdvice.video}<br>
                      <small>パス: /media/${localizedAdvice.video}</small><br>
                      <small>動画ファイルが見つかりません</small>
                    </div>
                  `
                }
              }}
            >
              <source src={`/media/${localizedAdvice.video}`} type="video/mp4" /> {/* 🔥 /media/に修正 */}
              お使いのブラウザは動画をサポートしていません。
            </video>
          </div>
        </div>
      )}

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
          📋 {t('basicSolutions')}
        </h3>

        {localizedAdvice.items && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {localizedAdvice.items.map((item, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '15px',
                borderLeft: '4px solid #667eea'
              }}>
                <div style={{ 
                  background: 'rgba(102, 126, 234, 0.2)',
                  color: '#667eea',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  ✓
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    margin: '0 0 5px 0',
                    color: '#667eea'
                  }}>
                    {t(item.title)}
                  </h4>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#b0b0b0', 
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    {t(item.description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AIDetailedAdvice context={context} basicAdvice={localizedAdvice} />

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={onRestart}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          🔄 {t('restartDiagnosis')}
        </button>
      </div>
    </div>
  )
}