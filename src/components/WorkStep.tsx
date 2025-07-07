import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { WorkInstruction, WorkStep as WorkStepType, getFrontendDataPath } from '@/lib/dataLoader'

interface WorkStepProps {
  step: WorkStepType
  instruction: WorkInstruction
  getStepFiles: (stepNumber: number) => Promise<{ images: string[], videos: string[], programs: string[] }>
}

// 警告レベルの翻訳関数
const getWarningLevelText = (level: string): string => {
  switch (level) {
    case 'normal': return '通常'
    case 'caution': return '注意'
    case 'important': return '重要'
    case 'critical': return '緊急'
    default: return level
  }
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

export default function WorkStep({ step, instruction, getStepFiles }: WorkStepProps) {
  const [stepFiles, setStepFiles] = useState<{ images: string[], videos: string[], programs: string[] }>({ images: [], videos: [], programs: [] })
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

  // ファイルダウンロード関数
  const downloadStepFile = (filename: string) => {
    const drawingNumber = instruction.metadata.drawingNumber
    const filePath = `${dataRoot}/work-instructions/drawing-${drawingNumber}/programs/step_0${step.stepNumber}/${encodeURIComponent(filename)}`
    
    const link = document.createElement('a')
    link.href = filePath
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="work-step mb-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 shadow-lg">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-lg font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg">ステップ {step.stepNumber}</div>
        <div className="text-xl font-semibold text-white">{step.title}</div>
        <span className="ml-4 text-emerald-200/80 text-sm bg-emerald-500/10 px-2 py-1 rounded">所要時間: {step.timeRequired}</span>
        <span className="ml-4 text-emerald-200/80 text-sm bg-emerald-500/10 px-2 py-1 rounded">{getWarningLevelText(step.warningLevel)}</span>
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
      
      {/* 画像・動画・プログラムファイル */}
      {!isLoading && (stepFiles.images.length > 0 || stepFiles.videos.length > 0 || stepFiles.programs.length > 0) && (
        <div className="media-gallery mt-6">
          <h4 className="text-lg font-semibold text-emerald-200 mb-4">メディア</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 画像ギャラリー */}
            {stepFiles.images.map((image, i) => (
              <div key={`img-${i}`} className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg">
                <div className="p-3 text-xs text-emerald-200 bg-emerald-500/20">
                  {image}
                </div>
                <Image
                  src={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/images/step_0${step.stepNumber}/${image}`}
                  alt={`ステップ${step.stepNumber} - ${image}`}
                  width={300}
                  height={192}
                  className="w-full h-48 object-cover"
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
          <h4 className="text-lg font-semibold text-emerald-200 mb-4">切削条件</h4>
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
                        <span className="text-emerald-200">{getPropertyText(prop)}:</span>
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
          <h4 className="text-lg font-semibold text-emerald-200 mb-4">品質確認</h4>
                      <div className="text-emerald-100 text-sm space-y-2">
              <div><span className="font-medium">確認項目:</span> {step.qualityCheck.checkPoints?.join(', ')}</div>
              <div><span className="font-medium">検査工具:</span> {step.qualityCheck.inspectionTools?.join(', ')}            </div>
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
                      className="text-left px-2 py-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors duration-200 hover:text-blue-300 text-sm"
                    >
                      {program}
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
        <div className="mt-6 bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
          <h4 className="text-lg font-semibold text-emerald-200 mb-4">備考</h4>
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