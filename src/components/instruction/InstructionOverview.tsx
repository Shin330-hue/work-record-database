'use client'

import React from 'react'
import { WorkInstruction } from '@/lib/dataLoader'
import { ContributionFile } from '@/types/contribution'
import ContributionDisplay from '../ContributionDisplay'

interface InstructionOverviewProps {
  instruction: WorkInstruction
  contributions: ContributionFile | null
  onAddContribution: () => void
}

export default function InstructionOverview({ 
  instruction, 
  contributions, 
  onAddContribution 
}: InstructionOverviewProps) {
  return (
    <div style={{ 
      marginBottom: '0',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0',
      padding: '32px',
      borderTop: '1px solid rgba(16, 185, 129, 0.2)',
      borderLeft: '1px solid rgba(16, 185, 129, 0.2)',
      borderRight: '1px solid rgba(16, 185, 129, 0.2)',
      borderBottom: 'none'
    }}>
      <h2 className="text-4xl font-bold text-white mb-8">【🤝みんなの作業手順】</h2>
      <p style={{ 
        fontSize: '1.5rem', 
        color: 'white', 
        marginTop: '12px',
        marginBottom: '12px', 
        whiteSpace: 'pre-line',
        borderLeft: '4px solid rgba(16, 185, 129, 0.8)',
        paddingLeft: '16px',
        paddingTop: '4px',
        paddingBottom: '4px'
      }}>
        {instruction.overview.description}
      </p>
      {instruction.overview.warnings && instruction.overview.warnings.length > 0 && (
        <div className="mb-2">
          <h4 className="text-lg font-semibold text-emerald-300 mb-1">《注意事項》</h4>
          <ul className="list-none space-y-1 text-emerald-200">
            {instruction.overview.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">❗</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 概要への追記表示 */}
      {contributions && (
        <ContributionDisplay 
          contributions={contributions.contributions.filter(c => c.targetSection === 'overview' && c.status === 'active')}
          drawingNumber={instruction.metadata.drawingNumber}
        />
      )}
      
      {/* 概要追記ボタン */}
      <div style={{ marginTop: '40px' }}>
        <button
          onClick={onAddContribution}
          className="
            custom-add-button
            inline-flex items-center justify-center gap-4
            px-24 py-6
            text-white font-bold text-lg
            rounded-full
            touch-manipulation
            select-none
            shadow-lg hover:shadow-xl
            min-h-[60px]
            sm:min-w-[280px]
          "
        >
          <span className="text-xl font-black">✚</span>
          <span className="font-bold tracking-wider">手順に追記する</span>
        </button>
      </div>
    </div>
  )
}