'use client'

import React, { useState, useEffect } from 'react'
import { WorkInstruction, loadRelatedIdeas } from '@/lib/dataLoader'
import { Idea } from '@/types/idea'

interface RelatedDrawingsSectionProps {
  instruction: WorkInstruction
  onRelatedDrawingClick: (drawingNumber: string) => void
}

export default function RelatedDrawingsSection({ 
  instruction, 
  onRelatedDrawingClick 
}: RelatedDrawingsSectionProps) {
  const [showRelatedDrawings, setShowRelatedDrawings] = useState(false)
  const [showIdeas, setShowIdeas] = useState(false)
  const [relatedIdeas, setRelatedIdeas] = useState<Idea[]>([])

  // 関連アイデアの読み込み
  useEffect(() => {
    const loadIdeas = async () => {
      if (instruction.metadata.keywords && instruction.metadata.keywords.length > 0) {
        try {
          const ideas = await loadRelatedIdeas(instruction.metadata.keywords)
          setRelatedIdeas(ideas)
        } catch (error) {
          console.error('関連アイデアの読み込みに失敗:', error)
        }
      }
    }
    loadIdeas()
  }, [instruction.metadata.keywords])

  return (
    <>
      {/* 関連情報（控えめに表示） */}
      <div style={{ 
        marginBottom: '30px',
        marginTop: '20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowRelatedDrawings(!showRelatedDrawings)}
          className="text-emerald-300 hover:text-emerald-200 transition-colors text-sm flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-emerald-500/20"
        >
          <span>📐</span>
          <span>関連図番 ({instruction.relatedDrawings?.length || 0}件)</span>
        </button>
        <button
          onClick={() => setShowIdeas(!showIdeas)}
          className="text-emerald-300 hover:text-emerald-200 transition-colors text-sm flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-emerald-500/20"
        >
          <span>💡</span>
          <span>加工アイデア ({relatedIdeas.length}件)</span>
        </button>
      </div>

      {/* 関連図番表示 */}
      {showRelatedDrawings && instruction.relatedDrawings && instruction.relatedDrawings.length > 0 && (
        <div style={{ 
          marginBottom: '30px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <h3 className="text-lg font-semibold text-emerald-200 mb-3">関連図番</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {instruction.relatedDrawings.map((related, index) => (
              <button
                key={index}
                onClick={() => onRelatedDrawingClick(related.drawingNumber)}
                className="text-left p-3 bg-white/5 rounded-lg border border-emerald-500/10 hover:bg-white/10 transition-all text-sm"
              >
                <div className="font-mono text-emerald-300 mb-1">{related.drawingNumber}</div>
                <div className="text-emerald-200/70 text-xs">{related.relation}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* アイデア表示 */}
      {showIdeas && relatedIdeas.length > 0 && (
        <div style={{ 
          marginBottom: '30px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <h3 className="text-lg font-semibold text-emerald-200 mb-3">加工アイデア</h3>
          <div className="space-y-3">
            {relatedIdeas.map((idea, index) => (
              <div
                key={index}
                className="p-3 bg-white/5 rounded-lg border border-emerald-500/10"
              >
                <div className="font-medium text-emerald-300 mb-1">{idea.title}</div>
                <div className="text-emerald-200/70 text-sm">{idea.description}</div>
                <div className="flex gap-2 mt-2">
                  {idea.tags?.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-emerald-500/20 text-emerald-200 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}