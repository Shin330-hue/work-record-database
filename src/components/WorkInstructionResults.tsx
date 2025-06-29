import React, { useState } from 'react'
import { WorkInstruction } from '@/lib/dataLoader'
import { useTranslation } from '@/hooks/useTranslation'

interface WorkInstructionResultsProps {
  instruction: WorkInstruction
  onBack: () => void
  onRelatedDrawingClick: (drawingNumber: string) => void
}

export default function WorkInstructionResults({ instruction, onBack, onRelatedDrawingClick }: WorkInstructionResultsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'steps' | 'related' | 'troubleshooting'>('steps')

  // PDFファイル名推定（metadata.drawingNumberから）
  const pdfFile = instruction.metadata.drawingNumber
    ? `/data/work-instructions/drawing-${instruction.metadata.drawingNumber}/pdf/` +
      (instruction.metadata.drawingNumber === 'CS2024001456789'
        ? 'DOC250507-20250507150631.pdf'
        : instruction.metadata.drawingNumber === 'FR2024001237891'
        ? '0A149002911_TK版.pdf'
        : instruction.metadata.drawingNumber === 'RT2024001428365'
        ? 'JD14-A0209_ホッパリング.pdf'
        : '')
    : ''

  // 実際のファイル名にマッピングする関数
  const getActualFileName = (drawingNumber: string, fileType: 'image' | 'video') => {
    const mapping = {
      'CS2024001456789': { image: 'sample3.jpg', video: 'sample3.mp4' },
      'RT2024001428365': { image: 'sample2.jpg', video: 'sample2.mp4' },
      'FR2024001237891': { image: 'sample1.jpg', video: 'sample1.mp4' }
    }
    return mapping[drawingNumber as keyof typeof mapping]?.[fileType] || ''
  }

  return (
    <div className="work-instruction-container">
      {/* 戻るボタン */}
      <button onClick={onBack} className="mb-6 px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 font-medium shadow-lg">
        {t('backToSearch')}
      </button>

      {/* ヘッダー */}
      <div className="instruction-header mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-300 mb-2">{instruction.metadata.drawingNumber}</div>
            <div className="text-xl font-semibold text-white mb-1">{instruction.metadata.title}</div>
            <div className="text-emerald-200/80 text-sm mb-2">{t('author')}: {instruction.metadata.author}</div>
            <div className="flex flex-wrap gap-4 text-emerald-200/70 text-sm">
              <span>{t('difficulty')}: {t(instruction.metadata.difficulty)}</span>
              <span>{t('estimatedTime')}: {instruction.metadata.estimatedTime}</span>
              <span>{t('machineType')}: {instruction.metadata.machineType}</span>
              <span>{t('toolsRequired')}: {instruction.metadata.toolsRequired?.join(', ')}</span>
            </div>
          </div>
          {/* PDF図面表示 */}
          {pdfFile && (
            <div className="min-w-[200px]">
              <a href={pdfFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-[#E60023] rounded-lg border border-[#E60023]/50 font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF図面を開く
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 概要 */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 mb-8">
        <h2 className="text-2xl font-bold text-emerald-100 mb-2">{t('overview')}</h2>
        <p className="text-white mb-2">{instruction.overview.description}</p>
        {instruction.overview.warnings && instruction.overview.warnings.length > 0 && (
          <div className="mb-2">
            <h4 className="text-lg font-semibold text-emerald-300 mb-1">{t('warnings')}</h4>
            <ul className="list-disc pl-6 text-emerald-200">
              {instruction.overview.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-6 text-emerald-200/80 text-sm mt-2">
          <span>{t('preparationTime')}: {instruction.overview.preparationTime}</span>
          <span>{t('processingTime')}: {instruction.overview.processingTime}</span>
        </div>
      </div>

      {/* タブ切替 */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'steps' 
              ? 'bg-emerald-500 text-white shadow-lg' 
              : 'bg-white/10 backdrop-blur-md text-emerald-200 hover:bg-white/15 border border-emerald-500/30'
          }`}
          onClick={() => setActiveTab('steps')}
        >
          {t('workSteps')}
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'related' 
              ? 'bg-emerald-500 text-white shadow-lg' 
              : 'bg-white/10 backdrop-blur-md text-emerald-200 hover:bg-white/15 border border-emerald-500/30'
          }`}
          onClick={() => setActiveTab('related')}
        >
          {t('relatedDrawings')}
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'troubleshooting' 
              ? 'bg-emerald-500 text-white shadow-lg' 
              : 'bg-white/10 backdrop-blur-md text-emerald-200 hover:bg-white/15 border border-emerald-500/30'
          }`}
          onClick={() => setActiveTab('troubleshooting')}
        >
          {t('troubleshooting')}
        </button>
      </div>

      {/* タブ内容 */}
      <div>
        {activeTab === 'steps' && (
          <div>
            {instruction.workSteps.map((step, idx) => (
              <div key={idx} className="work-step mb-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-lg font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg">{t('step')} {step.stepNumber}</div>
                  <div className="text-xl font-semibold text-white">{step.title}</div>
                  <span className="ml-4 text-emerald-200/80 text-sm bg-emerald-500/10 px-2 py-1 rounded">{t('timeRequired')}: {step.timeRequired}</span>
                  <span className="ml-4 text-emerald-200/80 text-sm bg-emerald-500/10 px-2 py-1 rounded">{t(step.warningLevel)}</span>
                </div>
                <div className="text-white mb-4 text-lg">{step.description}</div>
                {/* 詳細手順 */}
                {step.detailedInstructions && step.detailedInstructions.length > 0 && (
                  <div className="bg-emerald-500/10 rounded-xl p-6 mb-4 border border-emerald-500/20">
                    <h4 className="text-lg font-semibold text-emerald-200 mb-3">詳細手順</h4>
                    <ul className="list-decimal pl-6 text-emerald-100 space-y-2">
                      {step.detailedInstructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* 画像・動画 */}
                {(step.images && step.images.length > 0) || (step.videos && step.videos.length > 0) ? (
                  <div className="media-gallery mt-6">
                    <h4 className="text-lg font-semibold text-emerald-200 mb-4">{t('media')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {step.images && step.images.map((img, i) => (
                        <div key={i} className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg">
                          <div className="p-3 text-xs text-emerald-200 bg-emerald-500/20">
                            {img}
                          </div>
                          <img
                            src={`/data/work-instructions/drawing-${instruction.metadata.drawingNumber}/images/${getActualFileName(instruction.metadata.drawingNumber, 'image')}`}
                            alt={`ステップ${step.stepNumber} - ${img}`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/file.svg'
                              e.currentTarget.alt = '画像が見つかりません'
                            }}
                          />
                        </div>
                      ))}
                      {step.videos && step.videos.map((vid, i) => (
                        <div key={i} className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg">
                          <div className="p-3 text-xs text-emerald-200 bg-emerald-500/20">
                            {vid}
                          </div>
                          <video 
                            controls 
                            className="w-full h-48 object-cover"
                            preload="metadata"
                          >
                            <source 
                              src={`/data/work-instructions/drawing-${instruction.metadata.drawingNumber}/videos/${getActualFileName(instruction.metadata.drawingNumber, 'video')}`} 
                              type="video/mp4"
                            />
                            <p className="p-4 text-center text-emerald-200">
                              動画を再生できません。ブラウザが動画形式をサポートしていないか、ファイルが見つかりません。
                            </p>
                          </video>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {/* 切削条件 */}
                {step.cuttingConditions && (
                  <div className="cutting-conditions mt-6 bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
                    <h4 className="text-lg font-semibold text-emerald-200 mb-4">{t('cuttingConditions')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(step.cuttingConditions).map(([key, condition]) => (
                        <div key={key} className="bg-black/40 rounded-xl p-4 border border-emerald-500/30">
                          <div className="font-semibold text-emerald-300 mb-3 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          {typeof condition === 'object' && condition !== null ? (
                            <div className="space-y-2 text-sm">
                              {Object.entries(condition).map(([prop, value]) => (
                                <div key={prop} className="flex justify-between">
                                  <span className="text-emerald-200">{t(prop) || prop}:</span>
                                  <span className="text-white font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-white font-medium">{String(condition)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 品質確認 */}
                {step.qualityCheck && (
                  <div className="quality-check mt-6 bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
                    <h4 className="text-lg font-semibold text-emerald-200 mb-4">{t('qualityCheck')}</h4>
                    <div className="text-emerald-100 text-sm space-y-2">
                      <div><span className="font-medium">{t('checkPoints')}:</span> {step.qualityCheck.checkPoints?.join(', ')}</div>
                      <div><span className="font-medium">{t('inspectionTools')}:</span> {step.qualityCheck.inspectionTools?.join(', ')}</div>
                    </div>
                  </div>
                )}
                {/* 備考 */}
                {step.notes && step.notes.length > 0 && (
                  <div className="mt-6 bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
                    <h4 className="text-lg font-semibold text-emerald-200 mb-4">{t('notes')}</h4>
                    <div className="space-y-3">
                      {step.notes.map((note, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-emerald-100 text-sm">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20">
            <h2 className="text-2xl font-bold text-emerald-100 mb-6">{t('relatedDrawings')}</h2>
            {instruction.relatedDrawings.length === 0 ? (
              <p className="text-emerald-200/70">{t('noResults')}</p>
            ) : (
              <ul className="space-y-4">
                {instruction.relatedDrawings.map((rel, idx) => (
                  <li key={idx} className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <button
                      className="text-emerald-300 hover:text-emerald-200 font-mono hover:underline transition-colors"
                      onClick={() => onRelatedDrawingClick(rel.drawingNumber)}
                    >
                      {rel.drawingNumber}
                    </button>
                    <span className="text-white">{rel.description}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'troubleshooting' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20">
            <h2 className="text-2xl font-bold text-emerald-100 mb-6">{t('troubleshooting')}</h2>
            {instruction.troubleshooting.length === 0 ? (
              <p className="text-emerald-200/70">{t('noResults')}</p>
            ) : (
              <ul className="space-y-4">
                {instruction.troubleshooting.map((item, idx) => (
                  <li key={idx} className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="font-semibold text-emerald-200 mb-2">{item.problem}</div>
                    <div className="text-white mb-2"><span className="text-emerald-200/80">{t('cause')}:</span> {item.cause}</div>
                    <div className="text-emerald-100"><span className="text-emerald-200/80">{t('solution')}:</span> {item.solution}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 改訂履歴 */}
      {instruction.revisionHistory && instruction.revisionHistory.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 mt-10">
          <h2 className="text-2xl font-bold text-emerald-100 mb-6">{t('revisionHistory')}</h2>
          <ul className="space-y-3">
            {instruction.revisionHistory.map((rev, idx) => (
              <li key={idx} className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-300 font-mono bg-emerald-500/20 px-2 py-1 rounded">{rev.version}</span>
                <span className="text-emerald-200/70">{rev.date}</span>
                <span className="text-white font-medium">{rev.author}</span>
                <span className="text-emerald-100">{rev.changes}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 