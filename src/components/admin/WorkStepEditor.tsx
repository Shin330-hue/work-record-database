'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { WorkStep } from '@/lib/dataLoader'
import { getStepFolderName } from '@/lib/machineTypeUtils'

// 機械種別のキーを正規化する関数
const getMachineTypeKey = (machineType: string): string => {
  const mapping: { [key: string]: string } = {
    'マシニング': 'machining',
    'ターニング': 'turning', 
    '横中': 'yokonaka',
    'ラジアル': 'radial',
    'その他': 'other',
    'machining': 'machining',
    'turning': 'turning',
    'yokonaka': 'yokonaka', 
    'radial': 'radial',
    'other': 'other'
  }
  return mapping[machineType] || machineType
}

// 作業ステップエディタコンポーネント
interface WorkStepEditorProps {
  step: WorkStep
  index: number
  onUpdate: (step: WorkStep) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  uploadingFiles: {[key: string]: boolean}
  onFileUpload: (stepIndex: number, fileType: 'images' | 'videos', files: FileList | null, machineType?: string) => void
  onFileRemove: (stepIndex: number, fileType: 'images' | 'videos', fileIndex: number, machineType?: string) => void
  actualFiles: {
    overview: { images: string[], videos: string[] },
    steps: { [key: number]: { images: string[], videos: string[] } },
    stepsByMachine?: {
      machining?: { images: string[], videos: string[] }[],
      turning?: { images: string[], videos: string[] }[],
      yokonaka?: { images: string[], videos: string[] }[],
      radial?: { images: string[], videos: string[] }[],
      other?: { images: string[], videos: string[] }[]
    }
  }
  onImageClick: (images: string[], currentIndex: number) => void
  machineType?: string  // 機械種別を追加
}

export default function WorkStepEditor({ step, index, onUpdate, onDelete, onMoveUp, onMoveDown, uploadingFiles, onFileUpload, onFileRemove, actualFiles, onImageClick, machineType }: WorkStepEditorProps) {
  // 親コンポーネントから渡される図番を取得
  const params = useParams()
  const drawingNumber = params.id as string
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // 機械種別に応じたフォルダ名を生成
  const stepFolderName = machineType 
    ? getStepFolderName(index + 1, machineType)
    : `step_${String(index + 1).padStart(2, '0')}`
  
  // 機械種別に応じたファイルを取得
  const getStepFiles = () => {
    if (machineType && actualFiles.stepsByMachine) {
      const machineKey = getMachineTypeKey(machineType)
      const machineSteps = actualFiles.stepsByMachine[machineKey as keyof typeof actualFiles.stepsByMachine]
      return machineSteps?.[index] || { images: [], videos: [] }
    }
    // 後方互換性のためのフォールバック
    return actualFiles.steps[index] || { images: [], videos: [] }
  }
  
  const stepFiles = getStepFiles()

  // ドラッグ&ドロップハンドラー
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileUpload(index, 'images', files, machineType)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  // ファイル選択ハンドラー
  const handleFileSelect = (fileType: 'images' | 'videos') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = fileType === 'images' ? 'image/*' : 'video/*'
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        onFileUpload(index, fileType, files, machineType)
      }
    }
    
    input.click()
  }

  // 警告レベルの色を取得
  const getWarningLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600'
      case 'important': return 'bg-orange-600'
      case 'caution': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  // 警告レベルのアイコンを取得
  const getWarningLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨'
      case 'important': return '⚠️'
      case 'caution': return '⚡'
      default: return '📝'
    }
  }

  return (
    <div className="border border-gray-600 rounded-lg bg-gray-800 mb-4">
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
            ステップ {step.stepNumber}: {step.title || '(未設定)'}
          </span>
        </button>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${getWarningLevelColor(step.warningLevel)}`}>
            {getWarningLevelIcon(step.warningLevel)} {step.warningLevel}
          </span>
          
          {/* 順序変更ボタン */}
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-white hover:text-emerald-300 transition-colors"
              title="上に移動"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-white hover:text-emerald-300 transition-colors"
              title="下に移動"
            >
              ↓
            </button>
          )}
          
          <button
            type="button"
            onClick={onDelete}
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
              ステップタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={step.title}
              onChange={(e) => onUpdate({ ...step, title: e.target.value })}
              className="custom-form-input"
              placeholder="ステップのタイトルを入力..."
            />
          </div>

          {/* 概要説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              概要説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={step.description}
              onChange={(e) => onUpdate({ ...step, description: e.target.value })}
              rows={3}
              className="custom-form-textarea"
              placeholder="この工程の概要を説明..."
            />
          </div>

          {/* 詳細手順 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              詳細手順
            </label>
            <div className="space-y-2">
              {step.detailedInstructions.map((instruction, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => {
                      const newInstructions = [...step.detailedInstructions]
                      newInstructions[i] = e.target.value
                      onUpdate({ ...step, detailedInstructions: newInstructions })
                    }}
                    className="custom-form-input flex-1"
                    placeholder={`手順 ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newInstructions = step.detailedInstructions.filter((_, idx) => idx !== i)
                      onUpdate({ ...step, detailedInstructions: newInstructions })
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newInstructions = [...step.detailedInstructions, '']
                  onUpdate({ ...step, detailedInstructions: newInstructions })
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                手順を追加
              </button>
            </div>
          </div>

          {/* 時間・警告レベル */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">所要時間</label>
              <input
                type="text"
                value={step.timeRequired}
                onChange={(e) => onUpdate({ ...step, timeRequired: e.target.value })}
                className="custom-form-input"
                placeholder="例: 30分"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">警告レベル</label>
              <select
                value={step.warningLevel}
                onChange={(e) => onUpdate({ ...step, warningLevel: e.target.value as WorkStep['warningLevel'] })}
                className="custom-form-select"
              >
                <option value="normal">通常</option>
                <option value="caution">注意</option>
                <option value="important">重要</option>
                <option value="critical">危険</option>
              </select>
            </div>
          </div>

          {/* 使用工具 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">使用工具</label>
            <div className="space-y-2">
              {(step.tools || []).map((tool, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={tool}
                    onChange={(e) => {
                      const newTools = [...(step.tools || [])]
                      newTools[i] = e.target.value
                      onUpdate({ ...step, tools: newTools })
                    }}
                    className="custom-form-input flex-1"
                    placeholder={`工具 ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newTools = (step.tools || []).filter((_, idx) => idx !== i)
                      onUpdate({ ...step, tools: newTools })
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newTools = [...(step.tools || []), '']
                  onUpdate({ ...step, tools: newTools })
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                工具を追加
              </button>
            </div>
          </div>

          {/* 注意事項 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">注意事項</label>
            <div className="space-y-2">
              {(step.notes || []).map((note, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => {
                      const newNotes = [...(step.notes || [])]
                      newNotes[i] = e.target.value
                      onUpdate({ ...step, notes: newNotes })
                    }}
                    className="custom-form-input flex-1"
                    placeholder={`注意事項 ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newNotes = (step.notes || []).filter((_, idx) => idx !== i)
                      onUpdate({ ...step, notes: newNotes })
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newNotes = [...(step.notes || []), '']
                  onUpdate({ ...step, notes: newNotes })
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                注意事項を追加
              </button>
            </div>
          </div>

          {/* 品質チェック */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">品質チェック項目</label>
            <div className="space-y-2">
              {(step.qualityCheck?.items || []).map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(step.qualityCheck?.items || [])]
                      newItems[i] = e.target.value
                      onUpdate({ 
                        ...step, 
                        qualityCheck: { 
                          ...step.qualityCheck, 
                          items: newItems 
                        } 
                      })
                    }}
                    className="custom-form-input flex-1"
                    placeholder={`チェック項目 ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = (step.qualityCheck?.items || []).filter((_, idx) => idx !== i)
                      onUpdate({ 
                        ...step, 
                        qualityCheck: { 
                          ...step.qualityCheck, 
                          items: newItems 
                        } 
                      })
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newItems = [...(step.qualityCheck?.items || []), '']
                  onUpdate({ 
                    ...step, 
                    qualityCheck: { 
                      ...step.qualityCheck, 
                      items: newItems 
                    } 
                  })
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                チェック項目を追加
              </button>
            </div>
          </div>

          {/* 画像アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像 ({stepFolderName})
            </label>
            
            {/* ドラッグ&ドロップエリア */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => handleFileSelect('images')}
            >
              <p className="text-gray-600 mb-2">
                画像をドラッグ&ドロップするか、クリックしてファイルを選択
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileSelect('images')
                }}
              >
                {uploadingFiles[`step-${index}-images`] ? 'アップロード中...' : '画像を選択'}
              </button>
            </div>

            {/* 画像プレビュー */}
            {stepFiles.images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2">
                {stepFiles.images.map((image, i) => (
                  <div key={i} className="relative group">
                    <Image
                      src={`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=${stepFolderName}&fileName=${encodeURIComponent(image)}`}
                      alt={`Step ${step.stepNumber} - Image ${i + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-20 object-cover rounded cursor-pointer"
                      onClick={() => {
                        const imageUrls = stepFiles.images.map(img => 
                          `/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=${stepFolderName}&fileName=${encodeURIComponent(img)}`
                        )
                        onImageClick(imageUrls, i)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => onFileRemove(index, 'images', i, machineType)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 動画アップロード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              動画 ({stepFolderName})
            </label>
            
            <button
              type="button"
              onClick={() => handleFileSelect('videos')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {uploadingFiles[`step-${index}-videos`] ? 'アップロード中...' : '動画を選択'}
            </button>

            {/* 動画プレビュー */}
            {stepFiles.videos.length > 0 && (
              <div className="mt-4 space-y-2">
                {stepFiles.videos.map((video, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span className="text-sm text-gray-700">{video}</span>
                    <button
                      type="button"
                      onClick={() => onFileRemove(index, 'videos', i, machineType)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}