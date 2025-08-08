import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { WorkInstruction, WorkStep as WorkStepType } from '@/lib/dataLoader'
import { ImageLightbox } from './ImageLightbox'
import { getStepFolderName } from '@/lib/machineTypeUtils'

interface WorkStepProps {
  step: WorkStepType
  instruction: WorkInstruction
  getStepFiles: (stepNumber: number) => Promise<{ images: string[], videos: string[], programs: string[] }>
  machineType?: string  // 機械種別を追加
}


// 切削条件プロパティの翻訳関数
const getPropertyText = (prop: string): string => {
  switch (prop) {
    case 'tool': return '工具'
    case 'spindleSpeed': return '主軸回転数'
    case 'feedRate': return '送り速度'
    case 'depthOfCut': return '切込み深さ'
    case 'stepOver': return '送りピッチ'
    case 'coolant': return '切削油'
    default: return prop
  }
}

export default function WorkStep({ step, instruction, getStepFiles, machineType }: WorkStepProps) {
  const [stepFiles, setStepFiles] = useState<{ images: string[], videos: string[], programs: string[] }>({ images: [], videos: [], programs: [] })
  const [isLoading, setIsLoading] = useState(true)
  // ライトボックス用の状態
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // 切削条件の展開状態
  const [expandedConditions, setExpandedConditions] = useState<{ [key: string]: boolean }>({})
  // 工程の展開/折りたたみ状態
  const [isExpanded, setIsExpanded] = useState(false)

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


  // ファイルダウンロード関数
  const downloadStepFile = (filename: string) => {
    const drawingNumber = instruction.metadata.drawingNumber
    const params = new URLSearchParams({
      drawingNumber,
      folderType: 'programs',
      subFolder: `step_0${step.stepNumber}`,
      fileName: filename
    })
    const filePath = `/api/files?${params}`
    
    const link = document.createElement('a')
    link.href = filePath
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="work-step mb-10 bg-white/10 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-lg overflow-hidden">
      {/* ヘッダー部分（クリックでトグル） */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="text-sm font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg">第{step.stepNumber}工程</div>
          <div className="text-base font-semibold text-white">{step.title}</div>
        </div>
        <div className="text-emerald-300 text-lg">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
      
      {/* 本文部分（展開時のみ表示） */}
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="text-white mb-3 text-sm">{step.description}</div>
      
      {/* 詳細手順 */}
      {step.detailedInstructions && step.detailedInstructions.length > 0 && (
        <div className="bg-emerald-500/10 rounded-xl p-4 mb-3 border border-emerald-500/20">
          <h4 className="text-base font-semibold text-emerald-200 mb-2">詳細手順</h4>
          <ul className="list-decimal pl-5 text-emerald-100 space-y-1.5 text-sm">
            {step.detailedInstructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 画像・動画・プログラムファイル */}
      {!isLoading && (stepFiles.images.length > 0 || stepFiles.videos.length > 0 || stepFiles.programs.length > 0) && (
        <div className="mt-6" style={{ display: 'block' }}>
          <h4 className="text-base font-semibold text-emerald-200 mb-3 block">メディア</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* 画像ギャラリー */}
            {stepFiles.images.map((image, i) => (
              <div key={`img-${i}`} 
                className="media-item bg-black/30 rounded-lg overflow-hidden border border-emerald-500/20 shadow-lg aspect-square flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setCurrentImageIndex(i);
                  setLightboxOpen(true);
                }}>
                <Image
                  src={`/api/files?drawingNumber=${instruction.metadata.drawingNumber}&folderType=images&subFolder=${machineType ? getStepFolderName(step.stepNumber, machineType) : `step_0${step.stepNumber}`}&fileName=${encodeURIComponent(image)}`}
                  alt={`第${step.stepNumber}工程 - ${image}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
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
                    src={`/api/files?drawingNumber=${instruction.metadata.drawingNumber}&folderType=videos&subFolder=${machineType ? getStepFolderName(step.stepNumber, machineType) : `step_0${step.stepNumber}`}&fileName=${encodeURIComponent(video)}`}
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
        <div className="cutting-conditions mt-6 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <h4 className="text-base font-semibold text-emerald-200 mb-2">《切削条件》</h4>
          <div className="space-y-2">
            {Object.entries(step.cuttingConditions).map(([key, condition]) => {
              const isExpanded = expandedConditions[key] ?? false;
              return (
                <div key={key} className="border border-emerald-500/20 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between bg-black/20 hover:bg-black/30 transition-colors"
                    style={{ padding: '10px 14px' }}
                    onClick={() => setExpandedConditions(prev => ({ ...prev, [key]: !prev[key] }))}
                  >
                    <span className="font-semibold text-emerald-300 text-sm">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-emerald-400 text-base">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="p-3 bg-black/10">
                      {typeof condition === 'object' && condition !== null ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {Object.entries(condition).map(([prop, value]) => (
                            <div key={prop} className="flex items-center gap-2">
                              <span className="text-emerald-200/70">{getPropertyText(prop)}:</span>
                              <span className="text-white font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white font-medium text-sm">{String(condition)}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 品質確認 */}
      {step.qualityCheck && (
        <div className="quality-check mt-4 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <h4 className="text-base font-semibold text-emerald-200 mb-3">品質確認</h4>
          <div className="space-y-4">
            {/* 新形式のデータ構造に対応 */}
            {step.qualityCheck.items && step.qualityCheck.items.length > 0 ? (
              step.qualityCheck.items.map((item, index) => (
                <div key={index} className="bg-black/20 rounded-lg p-3 border border-emerald-500/10">
                  <div className="text-emerald-100 space-y-1.5">
                    <div className="text-sm font-medium text-emerald-200">{item.checkPoint}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {item.tolerance && (
                        <div>
                          <span className="text-emerald-300">公差:</span> {item.tolerance}
                        </div>
                      )}
                      {item.surfaceRoughness && (
                        <div>
                          <span className="text-emerald-300">表面粗さ:</span> {item.surfaceRoughness}
                        </div>
                      )}
                      {item.inspectionTool && (
                        <div>
                          <span className="text-emerald-300">検査工具:</span> {item.inspectionTool}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* 旧形式のデータ構造（後方互換性） */
              (() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const oldQualityCheck = step.qualityCheck as any;
                return oldQualityCheck.checkPoints && (
                  <div className="text-emerald-100 text-sm space-y-2">
                    <div><span className="font-medium">確認項目:</span> {oldQualityCheck.checkPoints.join(', ')}</div>
                    <div><span className="font-medium">検査工具:</span> {oldQualityCheck.inspectionTools?.join(', ')}</div>
                  </div>
                );
              })()
            )}
          </div>
          
          {/* プログラムファイル */}
          {stepFiles.programs.length > 0 && (
            <div className="mb-4">
              <h5 className="text-md font-medium text-emerald-300 mb-2">プログラムファイル</h5>
              <div className="bg-black/30 rounded-lg p-3 border border-emerald-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {stepFiles.programs.map((program, i) => (
                    <button
                      key={`step-program-${i}`}
                      onClick={() => downloadStepFile(program)}
                      className="custom-rect-button purple small"
                    >
                      <span>📄</span>
                      <span>{program}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 備考 */}
      {step.notes && step.notes.length > 0 && (
        <div className="mt-4 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <h4 className="text-base font-semibold text-emerald-200 mb-3">備考</h4>
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
      )}
      </div>

      {/* 画像ライトボックス */}
      {stepFiles.images.length > 0 && (
        <ImageLightbox
          images={stepFiles.images.map(image => 
            `/api/files?drawingNumber=${instruction.metadata.drawingNumber}&folderType=images&subFolder=${machineType ? getStepFolderName(step.stepNumber, machineType) : `step_0${step.stepNumber}`}&fileName=${encodeURIComponent(image)}`
          )}
          isOpen={lightboxOpen}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          altText={`${instruction.metadata.title} - ステップ${step.stepNumber}画像`}
        />
      )}
    </>
  )
} 