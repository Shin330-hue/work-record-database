import React, { useState, useEffect } from 'react'
import { WorkInstruction, WorkStep as WorkStepType, getFrontendDataPath } from '@/lib/dataLoader'
import { useTranslation } from '@/hooks/useTranslation'

interface WorkStepProps {
  step: WorkStepType
  instruction: WorkInstruction
  getStepFiles: (stepNumber: number) => Promise<{ images: string[], videos: string[] }>
}

export default function WorkStep({ step, instruction, getStepFiles }: WorkStepProps) {
  const { t } = useTranslation()
  const [stepFiles, setStepFiles] = useState<{ images: string[], videos: string[] }>({ images: [], videos: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStepFiles = async () => {
      try {
        setIsLoading(true)
        const files = await getStepFiles(step.stepNumber)
        setStepFiles(files)
      } catch (error) {
        console.error(`Error loading files for step ${step.stepNumber}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStepFiles()
  }, [step.stepNumber, getStepFiles])

  const dataRoot = getFrontendDataPath();

  return (
    <div className="work-step mb-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 shadow-lg">
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
      {!isLoading && (stepFiles.images.length > 0 || stepFiles.videos.length > 0) && (
        <div className="media-gallery mt-6">
          <h4 className="text-lg font-semibold text-emerald-200 mb-4">{t('media')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 画像ギャラリー */}
            {stepFiles.images.map((image, i) => (
              <div key={`img-${i}`} className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg">
                <div className="p-3 text-xs text-emerald-200 bg-emerald-500/20">
                  {image}
                </div>
                <img
                  src={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/images/step_0${step.stepNumber}/${image}`}
                  alt={`ステップ${step.stepNumber} - ${image}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/file.svg'
                    e.currentTarget.alt = '画像が見つかりません'
                  }}
                />
              </div>
            ))}
            {/* 動画ギャラリー */}
            {stepFiles.videos.map((video, i) => (
              <div key={`vid-${i}`} className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg">
                <div className="p-3 text-xs text-emerald-200 bg-emerald-500/20">
                  {video}
                </div>
                <video 
                  controls 
                  className="w-full h-48 object-cover"
                  preload="metadata"
                >
                  <source 
                    src={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/videos/step_0${step.stepNumber}/${video}`}
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
      )}
      
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
  )
} 