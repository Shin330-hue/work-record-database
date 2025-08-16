'use client'

import React from 'react'
import WorkStepEditor from './WorkStepEditor'
import { WorkStep } from '@/lib/dataLoader'

interface MachineTypeTabProps {
  machineType: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other'
  machineTypeName: string
  formData: {
    workSteps: WorkStep[]
    workStepsByMachine?: {
      machining?: WorkStep[]
      turning?: WorkStep[]
      yokonaka?: WorkStep[]
      radial?: WorkStep[]
      other?: WorkStep[]
    }
  }
  addWorkStep: (machineType: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => void
  updateWorkStep: (index: number, updatedStep: WorkStep, machineType: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => void
  deleteWorkStep: (index: number, machineType: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => void
  moveWorkStep: (fromIndex: number, toIndex: number, machineType: 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other') => void
  uploadingFiles: {[key: string]: boolean}
  onFileUpload: (stepIndex: number, fileType: 'images' | 'videos', files: FileList | null, machineType?: string) => void
  onFileRemove: (stepIndex: number, fileType: 'images' | 'videos', fileIndex: number, machineType?: string) => void
  actualFiles: {
    overview: { images: string[], videos: string[], pdfs: string[], programs: string[] },
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
  drawingNumber?: string
}

export default function MachineTypeTab({
  machineType,
  machineTypeName,
  formData,
  addWorkStep,
  updateWorkStep,
  deleteWorkStep,
  moveWorkStep,
  uploadingFiles,
  onFileUpload,
  onFileRemove,
  actualFiles,
  onImageClick
}: MachineTypeTabProps) {

  // 機械種別に対応するワークステップを取得
  const getWorkSteps = () => {
    return formData.workStepsByMachine?.[machineType] || formData.workSteps || []
  }

  const workSteps = getWorkSteps()

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 左側: 作業手順 */}
      <div className="space-y-6 overflow-y-auto pr-4" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        {/* 作業ステップセクション */}
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-semibold text-white">
              作業ステップ ({workSteps.length}件)
            </h3>
            <button
              type="button"
              onClick={() => addWorkStep(machineType)}
              className="custom-rect-button emerald small"
            >
              <span>+ ステップ追加</span>
            </button>
          </div>

          <div className="space-y-4">
            {workSteps.map((step, index) => (
              <WorkStepEditor
                key={index}
                step={step}
                index={index}
                onUpdate={(updatedStep) => updateWorkStep(index, updatedStep, machineType)}
                onDelete={() => deleteWorkStep(index, machineType)}
                onMoveUp={index > 0 ? () => moveWorkStep(index, index - 1, machineType) : undefined}
                onMoveDown={index < workSteps.length - 1 ? () => moveWorkStep(index, index + 1, machineType) : undefined}
                uploadingFiles={uploadingFiles}
                onFileUpload={onFileUpload}
                onFileRemove={onFileRemove}
                actualFiles={actualFiles}
                onImageClick={onImageClick}
                machineType={machineType}
              />
            ))}

            {workSteps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {machineTypeName}の作業ステップがありません。「+ ステップ追加」ボタンで追加してください。
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右側: 追記一覧 */}
      <div className="space-y-6 overflow-y-auto pl-4" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h3 className="text-base font-semibold text-white mb-4">📝 追記一覧</h3>
          <p className="text-sm text-gray-400 mb-4">
            {machineTypeName}に関する追記がここに表示されます
          </p>
          
          {/* 追記内容のプレースホルダー */}
          <div className="space-y-3">
            <div className="bg-gray-700 p-3 rounded border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-blue-300 font-medium">ユーザー追記</span>
                <span className="text-xs text-gray-400">2024/01/15</span>
              </div>
              <p className="text-sm text-gray-200">
                {machineTypeName}での加工時の注意点について
              </p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded border-l-4 border-emerald-500">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-emerald-300 font-medium">専門家コメント</span>
                <span className="text-xs text-gray-400">2024/01/10</span>
              </div>
              <p className="text-sm text-gray-200">
                {machineTypeName}の効率的な加工手順について
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-600">
            <button
              type="button"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              追記を投稿
            </button>
          </div>
        </div>

        {/* 関連情報 */}
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h3 className="text-base font-semibold text-white mb-4">🔗 関連情報</h3>
          <div className="space-y-2">
            <div className="bg-gray-700 p-3 rounded">
              <h4 className="text-sm font-medium text-white mb-1">{machineTypeName}の基本操作</h4>
              <p className="text-xs text-gray-400">基本的な操作手順と注意事項</p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <h4 className="text-sm font-medium text-white mb-1">保守・メンテナンス</h4>
              <p className="text-xs text-gray-400">定期点検と清掃方法</p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <h4 className="text-sm font-medium text-white mb-1">トラブルシューティング</h4>
              <p className="text-xs text-gray-400">よくある問題と解決方法</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}