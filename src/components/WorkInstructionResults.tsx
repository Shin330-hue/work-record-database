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
      <button onClick={onBack} className="mb-6 px-4 py-2 bg-gray-700 text-white rounded hover:bg-yellow-500">
        {t('backToSearch')}
      </button>

      {/* ヘッダー */}
      <div className="instruction-header mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-yellow-400 mb-2">{instruction.metadata.drawingNumber}</div>
            <div className="text-xl font-semibold text-white mb-1">{instruction.metadata.title}</div>
            <div className="text-gray-300 text-sm mb-2">{t('author')}: {instruction.metadata.author}</div>
            <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
              <span>{t('difficulty')}: {t(instruction.metadata.difficulty)}</span>
              <span>{t('estimatedTime')}: {instruction.metadata.estimatedTime}</span>
              <span>{t('machineType')}: {instruction.metadata.machineType}</span>
              <span>{t('toolsRequired')}: {instruction.metadata.toolsRequired?.join(', ')}</span>
            </div>
          </div>
          {/* PDF図面表示 */}
          {pdfFile && (
            <div className="min-w-[200px]">
              <a href={pdfFile} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                PDF図面を開く
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 概要 */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('overview')}</h2>
        <p className="text-white mb-2">{instruction.overview.description}</p>
        {instruction.overview.warnings && instruction.overview.warnings.length > 0 && (
          <div className="mb-2">
            <h4 className="text-lg font-semibold text-yellow-400 mb-1">{t('warnings')}</h4>
            <ul className="list-disc pl-6 text-yellow-200">
              {instruction.overview.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-6 text-gray-300 text-sm mt-2">
          <span>{t('preparationTime')}: {instruction.overview.preparationTime}</span>
          <span>{t('processingTime')}: {instruction.overview.processingTime}</span>
        </div>
      </div>

      {/* タブ切替 */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t ${activeTab === 'steps' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
          onClick={() => setActiveTab('steps')}
        >
          {t('workSteps')}
        </button>
        <button
          className={`px-4 py-2 rounded-t ${activeTab === 'related' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
          onClick={() => setActiveTab('related')}
        >
          {t('relatedDrawings')}
        </button>
        <button
          className={`px-4 py-2 rounded-t ${activeTab === 'troubleshooting' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
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
              <div key={idx} className="work-step mb-10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-lg font-bold text-yellow-400">{t('step')} {step.stepNumber}</div>
                  <div className="text-xl font-semibold text-white">{step.title}</div>
                  <span className="ml-4 text-gray-400 text-sm">{t('timeRequired')}: {step.timeRequired}</span>
                  <span className="ml-4 text-gray-400 text-sm">{t(step.warningLevel)}</span>
                </div>
                <div className="text-white mb-2">{step.description}</div>
                {/* 詳細手順 */}
                {step.detailedInstructions && step.detailedInstructions.length > 0 && (
                  <ul className="list-decimal pl-6 text-gray-200 mb-2">
                    {step.detailedInstructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                )}
                {/* 画像・動画 */}
                {(step.images && step.images.length > 0) || (step.videos && step.videos.length > 0) ? (
                  <div className="media-gallery mt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">{t('media')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {step.images && step.images.map((img, i) => (
                        <div key={i} className="media-item bg-black/20 rounded-lg overflow-hidden">
                          <div className="p-2 text-xs text-gray-400 bg-black/50">
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
                        <div key={i} className="media-item bg-black/20 rounded-lg overflow-hidden">
                          <div className="p-2 text-xs text-gray-400 bg-black/50">
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
                            <p className="p-4 text-center text-gray-400">
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
                  <div className="cutting-conditions mt-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{t('cuttingConditions')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(step.cuttingConditions).map(([key, condition]) => (
                        <div key={key} className="bg-black/30 rounded p-3 border border-gray-600">
                          <div className="font-semibold text-yellow-400 mb-2 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          {typeof condition === 'object' && condition !== null ? (
                            <div className="space-y-1 text-sm">
                              {Object.entries(condition).map(([prop, value]) => (
                                <div key={prop} className="flex justify-between">
                                  <span className="text-gray-300">{t(prop) || prop}:</span>
                                  <span className="text-white">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-white">{String(condition)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 品質確認 */}
                {step.qualityCheck && (
                  <div className="quality-check mt-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{t('qualityCheck')}</h4>
                    <div className="text-gray-200 text-sm">
                      <div>{t('checkPoints')}: {step.qualityCheck.checkPoints?.join(', ')}</div>
                      <div>{t('inspectionTools')}: {step.qualityCheck.inspectionTools?.join(', ')}</div>
                    </div>
                  </div>
                )}
                {/* 備考 */}
                {step.notes && step.notes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">{t('notes')}</h4>
                    <div className="space-y-2">
                      {step.notes.map((note, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-blue-200 text-sm">{note}</p>
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
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">{t('relatedDrawings')}</h2>
            {instruction.relatedDrawings.length === 0 ? (
              <p className="text-gray-400">{t('noResults')}</p>
            ) : (
              <ul className="space-y-3">
                {instruction.relatedDrawings.map((rel, idx) => (
                  <li key={idx} className="flex items-center gap-4">
                    <button
                      className="text-yellow-400 hover:underline font-mono"
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
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">{t('troubleshooting')}</h2>
            {instruction.troubleshooting.length === 0 ? (
              <p className="text-gray-400">{t('noResults')}</p>
            ) : (
              <ul className="space-y-4">
                {instruction.troubleshooting.map((item, idx) => (
                  <li key={idx} className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="font-semibold text-red-300 mb-1">{item.problem}</div>
                    <div className="text-white mb-1">{t('cause')}: {item.cause}</div>
                    <div className="text-green-300">{t('solution')}: {item.solution}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 改訂履歴 */}
      {instruction.revisionHistory && instruction.revisionHistory.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-10">
          <h2 className="text-2xl font-bold text-white mb-4">{t('revisionHistory')}</h2>
          <ul className="space-y-2">
            {instruction.revisionHistory.map((rev, idx) => (
              <li key={idx} className="flex items-center gap-4">
                <span className="text-yellow-400 font-mono">{rev.version}</span>
                <span className="text-gray-400">{rev.date}</span>
                <span className="text-white">{rev.author}</span>
                <span className="text-gray-300">{rev.changes}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 