import React, { useState } from 'react'
import { WorkInstruction } from '@/lib/dataLoader'
import { ContributionFile } from '@/types/contribution'
import WorkStep from './WorkStep'
import ContributionForm from './ContributionForm'
import { ImageLightbox } from './ImageLightbox'
import { getStepFolderName, getMachineTypeJapanese } from '@/lib/machineTypeUtils'
import InstructionHeader from './instruction/InstructionHeader'
import InstructionOverview from './instruction/InstructionOverview'
import RelatedDrawingsSection from './instruction/RelatedDrawingsSection'

interface WorkInstructionResultsProps {
  instruction: WorkInstruction
  contributions: ContributionFile | null
  onBack: () => void
  onRelatedDrawingClick: (drawingNumber: string) => void
}

type MachineType = 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other'

export default function WorkInstructionResults({ instruction, contributions, onBack, onRelatedDrawingClick }: WorkInstructionResultsProps) {
  // 機械種別ごとの工程数を計算
  const getStepCountByMachine = (machine: MachineType): number => {
    if (instruction.workStepsByMachine && instruction.workStepsByMachine[machine]) {
      return instruction.workStepsByMachine[machine]!.length
    }
    // 後方互換性: workStepsByMachineがない場合は、既存のworkStepsをマシニングとして扱う
    return machine === 'machining' && instruction.workSteps ? instruction.workSteps.length : 0
  }

  const [activeTab, setActiveTab] = useState<MachineType>('machining')
  // overview用のファイル状態（使用されていない変数を削除）
  // 追記フォームの状態
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [contributionTarget, setContributionTarget] = useState<{
    section: 'overview' | 'step' | 'general'
    stepNumber?: number
  }>({ section: 'general' })
  // ライトボックス用の状態
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // overview用のファイル一覧を取得する関数
  const getFilesFromFolder = async (drawingNumber: string, fileType: string, folderName: string): Promise<string[]> => {
    try {
      const encodedFolderName = encodeURIComponent(folderName)
      const url = `/api/files?drawingNumber=${encodeURIComponent(drawingNumber)}&folderType=${fileType}&subFolder=${encodedFolderName}`
      console.log(`ファイル取得URL: ${url}`) // デバッグログ
      const response = await fetch(url)
      if (response.ok) {
        const responseData = await response.json()
        console.log(`${fileType}ファイル取得成功:`, responseData) // レスポンス全体をログ
        // APIレスポンス構造を正しく処理
        const files = responseData.success ? responseData.data.files : responseData.files
        console.log(`${fileType}ファイル配列:`, files) // ファイル配列をログ
        return files || []
      } else {
        console.error(`${fileType}ファイル取得失敗: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error(`エラー詳細: ${errorText}`)
      }
    } catch (error) {
      console.error(`${fileType}ファイル一覧の取得に失敗:`, error)
    }
    return []
  }

  // ステップごとのファイル一覧を取得する関数（機械種別対応）
  const getStepFiles = async (stepNumber: number, machineType: MachineType) => {
    const drawingNumber = instruction.metadata.drawingNumber
    console.log(`getStepFiles called: stepNumber=${stepNumber}, machineType=${machineType}`)
    
    // 機械種別を日本語に変換してからフォルダ名を生成
    const machineTypeJapanese = getMachineTypeJapanese(machineType)
    const stepFolder = getStepFolderName(stepNumber, machineTypeJapanese)
    console.log(`stepFolder generated: ${stepFolder}, machineTypeJapanese: ${machineTypeJapanese}`)
    
    const [stepImages, stepVideos, stepPrograms, stepPdfs] = await Promise.all([
      getFilesFromFolder(drawingNumber, 'images', stepFolder),
      getFilesFromFolder(drawingNumber, 'videos', stepFolder),
      getFilesFromFolder(drawingNumber, 'programs', stepFolder),
      getFilesFromFolder(drawingNumber, 'pdfs', stepFolder)
    ])
    
    return { images: stepImages, videos: stepVideos, programs: stepPrograms, pdfs: stepPdfs }
  }

  const handleAddContribution = () => {
    setContributionTarget({ section: 'overview' })
    setShowContributionForm(true)
  }

  return (
    <div className="work-instruction-container">
      <InstructionHeader 
        instruction={instruction}
        onBack={onBack}
      />

      <InstructionOverview
        instruction={instruction}
        contributions={contributions}
        onAddContribution={handleAddContribution}
      />

      <RelatedDrawingsSection
        instruction={instruction}
        onRelatedDrawingClick={onRelatedDrawingClick}
      />

      {/* 機械種別タブ */}
      <div style={{ 
        marginBottom: '0',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0',
        padding: '0',
        borderTop: 'none',
        borderLeft: '1px solid rgba(16, 185, 129, 0.2)',
        borderRight: '1px solid rgba(16, 185, 129, 0.2)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        {/* タブボタン */}
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <button
            className={`custom-rect-button ${activeTab === 'machining' ? 'emerald' : 'gray'}`}
            onClick={() => setActiveTab('machining')}
            style={{ borderRadius: '0' }}
          >
            マシニング【{getStepCountByMachine('machining')}件】
          </button>
          <button
            className={`custom-rect-button ${activeTab === 'turning' ? 'emerald' : 'gray'}`}
            onClick={() => setActiveTab('turning')}
            style={{ borderRadius: '0' }}
          >
            ターニング【{getStepCountByMachine('turning')}件】
          </button>
          <button
            className={`custom-rect-button ${activeTab === 'yokonaka' ? 'emerald' : 'gray'}`}
            onClick={() => setActiveTab('yokonaka')}
            style={{ borderRadius: '0' }}
          >
            横中【{getStepCountByMachine('yokonaka')}件】
          </button>
          <button
            className={`custom-rect-button ${activeTab === 'radial' ? 'emerald' : 'gray'}`}
            onClick={() => setActiveTab('radial')}
            style={{ borderRadius: '0' }}
          >
            ラジアル【{getStepCountByMachine('radial')}件】
          </button>
          <button
            className={`custom-rect-button ${activeTab === 'other' ? 'emerald' : 'gray'}`}
            onClick={() => setActiveTab('other')}
            style={{ borderRadius: '0' }}
          >
            その他【{getStepCountByMachine('other')}件】
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'machining' && (
          <div style={{ marginBottom: '50px' }}>
            {(instruction.workStepsByMachine?.machining || instruction.workSteps || []).length > 0 ? (
              <div className="work-steps">
                {(instruction.workStepsByMachine?.machining || instruction.workSteps || []).map((step, index) => (
                  <WorkStep
                    key={index}
                    step={step}
                    instruction={instruction}
                    getStepFiles={(stepNum) => getStepFiles(stepNum, 'machining')}
                    machineType="マシニング"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20">
                マシニングの作業手順はまだ登録されていません
              </div>
            )}
          </div>
        )}

        {/* 他の機械種別のタブコンテンツも同様に処理 */}
        {(['turning', 'yokonaka', 'radial', 'other'] as const).map((machine) => (
          activeTab === machine && (
            <div key={machine} style={{ marginBottom: '50px' }}>
              {(instruction.workStepsByMachine?.[machine] || []).length > 0 ? (
                <div className="work-steps">
                  {(instruction.workStepsByMachine?.[machine] || []).map((step, index) => (
                    <WorkStep
                      key={index}
                      step={step}
                      instruction={instruction}
                      getStepFiles={(stepNum) => getStepFiles(stepNum, machine)}
                      machineType={getMachineTypeJapanese(machine)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-20">
                  {getMachineTypeJapanese(machine)}の作業手順はまだ登録されていません
                </div>
              )}
            </div>
          )
        ))}
      </div>

      {/* 追記フォーム */}
      {showContributionForm && (
        <ContributionForm
          drawingNumber={instruction.metadata.drawingNumber}
          targetSection={contributionTarget.section}
          stepNumber={contributionTarget.stepNumber}
          onCancel={() => setShowContributionForm(false)}
          onSubmit={() => {
            setShowContributionForm(false)
            // ページをリロードして最新の追記データを取得
            window.location.reload()
          }}
        />
      )}

      {/* ライトボックス */}
      {lightboxOpen && (
        <ImageLightbox
          images={currentImages}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)}
          onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)}
          altText={`${instruction.metadata.title} - 概要画像`}
        />
      )}
    </div>
  )
}