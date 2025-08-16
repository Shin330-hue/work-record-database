'use client'

import React, { useState } from 'react'
import { NearMissItem } from '@/lib/dataLoader'

interface NearMissEditorProps {
  item: NearMissItem
  index: number
  onChange: (index: number, field: keyof NearMissItem, value: string) => void
  onRemove: () => void
}

export default function NearMissEditor({ item, index, onChange, onRemove }: NearMissEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const severityOptions = ['low', 'medium', 'high', 'critical'] as const
  const severityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '危険'
  }

  return (
    <div className="border border-gray-600 rounded-lg bg-gray-800">
      {/* ヘッダー */}
      <div className="px-4 py-3 flex justify-between items-center rounded-t-lg border-b-2 border-emerald-500 shadow-lg" style={{ background: 'linear-gradient(to right, #1f2937, #111827)' }}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-3 text-left flex-1"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300" 
               style={{ 
                 backgroundColor: isExpanded ? '#10b981' : 'transparent',
                 transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                 boxShadow: isExpanded ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
               }}>
            <span className="text-white font-bold" style={{ fontSize: '1.125rem' }}>▶</span>
          </div>
          <span className="font-bold text-white" style={{ fontSize: '1.75rem' }}>
            事例 {index + 1}: {item.title || '(未設定)'}
          </span>
        </button>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            item.severity === 'critical' 
              ? 'bg-red-100 text-red-800' 
              : item.severity === 'high'
              ? 'bg-orange-100 text-orange-800'
              : item.severity === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {severityLabels[item.severity as keyof typeof severityLabels]}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            削除
          </button>
        </div>
      </div>

      {/* 編集フォーム */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-gray-900">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={item.title}
              onChange={(e) => onChange(index, 'title', e.target.value)}
              className="custom-form-input"
              placeholder="ヒヤリハット事例のタイトル..."
            />
          </div>

          {/* 重要度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              重要度 <span className="text-red-500">*</span>
            </label>
            <select
              value={item.severity}
              onChange={(e) => onChange(index, 'severity', e.target.value)}
              className="custom-form-select"
            >
              {severityOptions.map(option => (
                <option key={option} value={option}>
                  {severityLabels[option]}
                </option>
              ))}
            </select>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={item.description}
              onChange={(e) => onChange(index, 'description', e.target.value)}
              rows={3}
              className="custom-form-textarea"
              placeholder="どのような事例が発生したかを詳しく説明..."
            />
          </div>

          {/* 原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={item.cause}
              onChange={(e) => onChange(index, 'cause', e.target.value)}
              rows={2}
              className="custom-form-textarea"
              placeholder="事例が発生した原因を記入..."
            />
          </div>

          {/* 予防策 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予防策 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={item.prevention}
              onChange={(e) => onChange(index, 'prevention', e.target.value)}
              rows={2}
              className="custom-form-textarea"
              placeholder="再発防止のための対策を記入..."
            />
          </div>
        </div>
      )}
    </div>
  )
}