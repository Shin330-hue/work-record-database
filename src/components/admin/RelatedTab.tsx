'use client'

import React from 'react'

interface RelatedDrawing {
  drawingNumber: string
  relation: string
  description: string
}

interface RelatedTabProps {
  relatedDrawings: RelatedDrawing[]
  onAddRelatedDrawing: () => void
  onRemoveRelatedDrawing: (index: number) => void
  onUpdateRelatedDrawing: (index: number, field: keyof RelatedDrawing, value: string) => void
}

export default function RelatedTab({
  relatedDrawings,
  onAddRelatedDrawing,
  onRemoveRelatedDrawing,
  onUpdateRelatedDrawing
}: RelatedTabProps) {
  
  return (
    <div className="space-y-6">
      {/* 関連図番セクション */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">📋 関連図番</h2>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              関連図番一覧 ({relatedDrawings.length}件)
            </h3>
            <button
              type="button"
              onClick={onAddRelatedDrawing}
              className="custom-rect-button emerald small"
            >
              <span>+ 関連図番を追加</span>
            </button>
          </div>
          
          {relatedDrawings.length > 0 ? (
            <div className="space-y-4">
              {relatedDrawings.map((related, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-900">関連図番 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => onRemoveRelatedDrawing(index)}
                      className="custom-rect-button red tiny"
                    >
                      削除
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="custom-form-label">
                        図番 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={related.drawingNumber}
                        onChange={(e) => onUpdateRelatedDrawing(index, 'drawingNumber', e.target.value)}
                        className="custom-form-input"
                        placeholder="例: DRAW-2024-001"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-1">
                      <label className="custom-form-label">
                        説明
                      </label>
                      <input
                        type="text"
                        value={related.description}
                        onChange={(e) => onUpdateRelatedDrawing(index, 'description', e.target.value)}
                        className="custom-form-input"
                        placeholder="この図番との関係性を説明..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              関連図番がありません。「+ 関連図番を追加」ボタンで追加してください。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}