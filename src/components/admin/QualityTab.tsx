'use client'

import React from 'react'
import NearMissEditor from './NearMissEditor'
import { NearMissItem } from '@/lib/dataLoader'

interface QualityTabProps {
  formData: {
    nearMiss: NearMissItem[]
  }
  handleNearMissChange: (index: number, field: keyof NearMissItem, value: string) => void
  addNearMiss: () => void
  removeNearMiss: (index: number) => void
}

export default function QualityTab({
  formData,
  handleNearMissChange,
  addNearMiss,
  removeNearMiss
}: QualityTabProps) {
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
      <h2 className="text-xl font-semibold text-white mb-6">⚠️ ヒヤリハット</h2>
      
      {/* ヒヤリハット事例セクション */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            ヒヤリハット事例 ({formData.nearMiss.length}件)
          </h3>
          <button
            type="button"
            onClick={addNearMiss}
            className="custom-rect-button emerald small"
          >
            <span>+ 事例追加</span>
          </button>
        </div>
        
        {formData.nearMiss.length > 0 ? (
          <div className="space-y-4">
            {formData.nearMiss.map((item, index) => (
              <NearMissEditor
                key={index}
                item={item}
                index={index}
                onChange={handleNearMissChange}
                onRemove={() => removeNearMiss(index)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            ヒヤリハット事例がありません。「+ 事例追加」ボタンで追加してください。
          </div>
        )}
      </div>
    </div>
  )
}