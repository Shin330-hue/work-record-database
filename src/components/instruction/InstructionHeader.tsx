'use client'

import React from 'react'
import { WorkInstruction } from '@/lib/dataLoader'

interface InstructionHeaderProps {
  instruction: WorkInstruction
  onBack: () => void
}

export default function InstructionHeader({ instruction, onBack }: InstructionHeaderProps) {
  return (
    <>
      {/* 戻るボタン */}
      <button onClick={onBack} className="custom-rect-button gray" style={{ marginBottom: '40px' }}>
        <span>←</span>
        <span>検索に戻る</span>
      </button>

      {/* ヘッダー */}
      <div className="instruction-header" style={{ marginBottom: '50px' }}>
        <h1 className="text-4xl font-bold text-white mb-6">【🙋ざっくり説明】</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-300 mb-2">《図番》 {instruction.metadata.drawingNumber}</div>
            <div className="text-lg font-medium text-white mb-1">《会社》 {instruction.metadata.company?.name || '-'}</div>
            <div className="text-lg font-medium text-white mb-2">《製品》 {instruction.metadata.product?.name || '-'}</div>
            <div className="flex flex-col gap-2 text-emerald-200/70 text-sm mt-2">
              <span>《使用機械》 {
                Array.isArray(instruction.metadata.machineType) 
                  ? instruction.metadata.machineType.join(', ')
                  : instruction.metadata.machineType?.toString().split(',').map(type => type.trim()).join(', ') || ''
              }</span>
              <span>《推奨工具》 {instruction.metadata.keywords?.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ヒヤリハット（Near Miss）表示 - タイムライン形式 */}
      {instruction.nearMiss && instruction.nearMiss.length > 0 && (
        <div style={{ 
          marginBottom: '50px',
          backgroundColor: 'rgba(254, 240, 138, 0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(250, 204, 21, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <h3 className="font-bold text-yellow-300 mb-6" style={{ fontSize: '1.5rem' }}>【⚠️ ヒヤリハット】</h3>
          <div className="relative">
            {/* 縦線 */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-yellow-500/30"></div>
            
            {instruction.nearMiss.map((item, idx) => (
              <div key={idx} className="relative flex gap-6 mb-8 last:mb-0">
                {/* 左側のインジケーター */}
                <div className="flex-shrink-0 w-16">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                    item.severity === '重大' ? 'bg-red-600' :
                    item.severity === '中程度' ? 'bg-orange-600' :
                    'bg-yellow-600'
                  }`}>
                    <span className="text-white font-bold text-lg">⚠️</span>
                  </div>
                </div>
                
                {/* 右側のコンテンツ */}
                <div className="flex-1">
                  <div className="bg-yellow-50/10 backdrop-blur-sm p-4 rounded-lg border border-yellow-300/20">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-yellow-200">事例 {idx + 1}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.severity === '重大' ? 'bg-red-600 text-white' :
                        item.severity === '中程度' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-black'
                      }`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-yellow-100 mb-3 leading-relaxed">{item.incident}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold text-yellow-200">原因:</span>
                        <span className="text-yellow-100 ml-2">{item.cause}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-yellow-200">結果:</span>
                        <span className="text-yellow-100 ml-2">{item.consequence}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-yellow-200">予防策:</span>
                        <span className="text-yellow-100 ml-2">{item.prevention}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}