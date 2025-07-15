import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { WorkInstruction, loadRelatedIdeas } from '@/lib/dataLoader'
import { Idea } from '@/types/idea'
import { ContributionFile } from '@/types/contribution'
import WorkStep from './WorkStep'
import IdeaDisplay from './IdeaDisplay'
import ContributionForm from './ContributionForm'
import ContributionDisplay from './ContributionDisplay'
import { getFrontendDataPath } from '../lib/dataLoader';

interface WorkInstructionResultsProps {
  instruction: WorkInstruction
  contributions: ContributionFile | null
  onBack: () => void
  onRelatedDrawingClick: (drawingNumber: string) => void
}


export default function WorkInstructionResults({ instruction, contributions, onBack, onRelatedDrawingClick }: WorkInstructionResultsProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'related' | 'ideas'>('steps')
  // overview用のファイル状態
  const [overviewFiles, setOverviewFiles] = useState<{ pdfs: string[], images: string[], videos: string[], programs: string[] }>({ pdfs: [], images: [], videos: [], programs: [] })
  // 関連アイデアの状態
  const [relatedIdeas, setRelatedIdeas] = useState<Idea[]>([])
  // 追記フォームの状態
  const [showContributionForm, setShowContributionForm] = useState(false)
  const [contributionTarget, setContributionTarget] = useState<{
    section: 'overview' | 'step' | 'general'
    stepNumber?: number
  }>({ section: 'general' })

  const dataRoot = useMemo(() => getFrontendDataPath(), []);

  // ファイルダウンロード関数
  const downloadFile = (filename: string, folderType: string, subFolder?: string) => {
    const drawingNumber = instruction.metadata.drawingNumber
    const filePath = `${dataRoot}/work-instructions/drawing-${drawingNumber}/${folderType}/${subFolder || ''}/${encodeURIComponent(filename)}`
    const link = document.createElement('a')
    link.href = filePath
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // フォルダ内ファイル一覧を取得する関数
  const getFilesFromFolder = async (drawingNumber: string, folderType: 'images' | 'videos' | 'pdfs' | 'programs', subFolder?: string) => {
    try {
      const params = new URLSearchParams({
        drawingNumber,
        folderType,
        ...(subFolder && { subFolder })
      })
      const response = await fetch(`/api/files?${params}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      // 新しいAPI形式に対応（data.data.files）
      return data.success ? (data.data.files || []) : (data.files || [])
    } catch (error) {
      console.error(`Error loading files from ${folderType}:`, error)
      return []
    }
  }

  // overviewファイルの初期化
  useEffect(() => {
    const loadOverviewFiles = async () => {
      const drawingNumber = instruction.metadata.drawingNumber
      const [pdfs, images, videos, programs] = await Promise.all([
        getFilesFromFolder(drawingNumber, 'pdfs', 'overview'),
        getFilesFromFolder(drawingNumber, 'images', 'overview'),
        getFilesFromFolder(drawingNumber, 'videos', 'overview'),
        getFilesFromFolder(drawingNumber, 'programs', 'overview')
      ])
      setOverviewFiles({ pdfs, images, videos, programs })
    }
    loadOverviewFiles()
  }, [instruction])

  // 関連アイデアの読み込み
  useEffect(() => {
    const loadIdeas = async () => {
      if (instruction.relatedIdeas && instruction.relatedIdeas.length > 0) {
        const ideas = await loadRelatedIdeas(instruction.relatedIdeas)
        setRelatedIdeas(ideas)
      } else {
        setRelatedIdeas([])
      }
    }
    loadIdeas()
  }, [instruction.relatedIdeas])



  // ステップごとのファイル一覧を取得する関数
  const getStepFiles = async (stepNumber: number) => {
    const drawingNumber = instruction.metadata.drawingNumber
    const stepFolder = `step_0${stepNumber}`
    
    const [stepImages, stepVideos, stepPrograms] = await Promise.all([
      getFilesFromFolder(drawingNumber, 'images', stepFolder),
      getFilesFromFolder(drawingNumber, 'videos', stepFolder),
      getFilesFromFolder(drawingNumber, 'programs', stepFolder)
    ])
    
    return { images: stepImages, videos: stepVideos, programs: stepPrograms }
  }



  return (
    <div className="work-instruction-container">
      {/* 戻るボタン */}
      <button onClick={onBack} className="custom-rect-button gray mb-6">
        <span>←</span>
        <span>検索に戻る</span>
      </button>

      {/* ヘッダー */}
      <div className="instruction-header mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-2xl font-bold text-emerald-300 mb-2">{instruction.metadata.drawingNumber}</div>
            <div className="text-xl font-semibold text-white mb-1">{instruction.metadata.title}</div>
            <div className="text-emerald-200/80 text-sm mb-2">作成者: {instruction.metadata.author}</div>
            <div className="flex flex-col gap-2 text-emerald-200/70 text-sm mt-2">
              <span>所要時間: {instruction.metadata.estimatedTime}</span>
              <span>使用機械: {instruction.metadata.machineType}</span>
              <span>必要工具: {instruction.metadata.toolsRequired?.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* overviewメディア群 */}
      {(overviewFiles.pdfs.length > 0 || overviewFiles.images.length > 0 || overviewFiles.videos.length > 0 || overviewFiles.programs.length > 0) && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 mb-8">
          <h2 className="text-2xl font-bold text-emerald-100 mb-4">概要メディア</h2>
          {/* PDF */}
          {overviewFiles.pdfs.length > 0 && (
            <div className="mb-6 bg-white rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">PDF</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overviewFiles.pdfs.map((pdf, i) => (
                  <a
                    key={`overview-pdf-${i}`}
                    href={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/pdfs/overview/${encodeURIComponent(pdf)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="custom-rect-button purple small"
                  >
                    <span>📄</span>
                    <span>{pdf}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* Images */}
          {overviewFiles.images.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-emerald-200 mb-3">画像</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {overviewFiles.images.map((image, i) => (
                  <div key={`overview-img-${i}`}
                    className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg aspect-video flex items-center justify-center">
                    <Image
                      src={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/images/overview/${image}`}
                      alt={`概要 - ${image}`}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Videos */}
          {overviewFiles.videos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-emerald-200 mb-3">動画</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {overviewFiles.videos.map((video, i) => (
                  <div key={`overview-vid-${i}`}
                    className="media-item bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg aspect-video flex items-center justify-center">
                    <video controls className="w-full h-full object-cover">
                      <source src={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/videos/overview/${video}`} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* プログラムファイル */}
          {overviewFiles.programs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-emerald-200 mb-3">プログラムファイル</h3>
              <div className="bg-black/30 rounded-xl p-4 border border-emerald-500/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {overviewFiles.programs.map((program, i) => (
                    <button
                      key={`overview-program-${i}`}
                      onClick={() => downloadFile(program, 'programs', 'overview')}
                      className="custom-rect-button purple small"
                    >
                      <span>📁</span>
                      <span>{program}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ヒヤリハット（Near Miss）表示 */}
      {instruction.nearMiss && instruction.nearMiss.length > 0 && (
        <div className="bg-yellow-100/10 backdrop-blur-md rounded-2xl p-6 border border-yellow-400/30 mb-8">
          <h3 className="text-xl font-bold text-yellow-300 mb-3">⚠️ ヒヤリハット事例</h3>
          <ul className="space-y-4">
            {instruction.nearMiss.map((item, idx) => (
              <li key={idx} className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-400/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-1">
                  <span className="font-semibold text-yellow-200">{item.title}</span>
                  <span className={`text-xs px-2 py-1 rounded ${item.severity === 'high' || item.severity === 'critical' ? 'bg-red-500/60 text-white' : 'bg-yellow-500/40 text-yellow-900'}`}>
                    重大度: {item.severity === 'critical' ? '最重要' : item.severity === 'high' ? '高' : item.severity === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div className="text-yellow-100 mb-1">内容: {item.description}</div>
                <div className="text-yellow-200/80 mb-1">原因: {item.cause}</div>
                <div className="text-yellow-200/80">対策: {item.prevention}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 概要 */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20 mb-8">
        <h2 className="text-2xl font-bold text-emerald-100 mb-2">概要</h2>
        <p className="text-white mb-2 whitespace-pre-line">{instruction.overview.description}</p>
        {instruction.overview.warnings && instruction.overview.warnings.length > 0 && (
          <div className="mb-2">
            <h4 className="text-lg font-semibold text-emerald-300 mb-1">注意事項</h4>
            <ul className="list-disc pl-6 text-emerald-200">
              {instruction.overview.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-6 text-emerald-200/80 text-sm mt-2">
          <span>準備時間: {instruction.overview.preparationTime}</span>
          <span>加工時間: {instruction.overview.processingTime}</span>
        </div>
        
        {/* 概要への追記表示 */}
        {contributions && (
          <ContributionDisplay 
            contributions={contributions.contributions.filter(c => c.targetSection === 'overview')}
            drawingNumber={instruction.metadata.drawingNumber}
          />
        )}
        
        {/* 概要追記ボタン */}
        <div className="mt-6">
          <button
            onClick={() => {
              setContributionTarget({ section: 'overview' })
              setShowContributionForm(true)
            }}
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
              min-w-[280px]
            "
          >
            <span className="text-xl font-black">✚</span>
            <span className="font-bold tracking-wider">概要に追記</span>
          </button>
        </div>
      </div>

      {/* タブ切替 */}
      <div className="flex gap-2 mb-6">
        <button
          className={`custom-rect-button ${activeTab === 'steps' ? 'emerald' : 'gray'}`}
          onClick={() => setActiveTab('steps')}
        >
          作業ステップ
        </button>
        <button
          className={`custom-rect-button ${activeTab === 'related' ? 'emerald' : 'gray'}`}
          onClick={() => setActiveTab('related')}
        >
          関連図番
        </button>
        <button
          className={`custom-rect-button ${activeTab === 'ideas' ? 'emerald' : 'gray'}`}
          onClick={() => setActiveTab('ideas')}
        >
          加工アイデア
        </button>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'steps' && (
        <div className="work-steps">
          {instruction.workSteps.map((step, index) => (
            <WorkStep
              key={index}
              step={step}
              instruction={instruction}
              getStepFiles={getStepFiles}
            />
          ))}
        </div>
      )}

      {activeTab === 'related' && (
        <div className="related-drawings">
          <h2 className="text-2xl font-bold text-emerald-100 mb-6">関連図番</h2>
          {instruction.relatedDrawings && instruction.relatedDrawings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instruction.relatedDrawings.map((related, index) => (
                <button
                  key={index}
                  onClick={() => onRelatedDrawingClick(related.drawingNumber)}
                  className="text-left p-4 bg-white/10 backdrop-blur-md rounded-xl border border-emerald-500/20 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="font-mono text-emerald-300 text-lg mb-2">{related.drawingNumber}</div>
                  <div className="text-white text-sm mb-1">{related.relation}</div>
                  <div className="text-emerald-200/70 text-xs">{related.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-emerald-200/70">該当する図番が見つかりません</p>
          )}
        </div>
      )}

      {activeTab === 'ideas' && (
        <div className="ideas">
          <h2 className="text-2xl font-bold text-emerald-100 mb-6">
            加工アイデア ({relatedIdeas.length}件)
          </h2>
          {relatedIdeas.length > 0 ? (
            <div className="space-y-4">
              {relatedIdeas.map((idea) => (
                <IdeaDisplay key={idea.id} idea={idea} />
              ))}
            </div>
          ) : (
            <p className="text-emerald-200/70">加工アイデアが登録されていません</p>
          )}
        </div>
      )}

      {/* 改訂履歴 */}
      {instruction.revisionHistory && instruction.revisionHistory.length > 0 && (
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/20">
          <h2 className="text-2xl font-bold text-emerald-100 mb-6">改訂履歴</h2>
          <div className="space-y-4">
            {instruction.revisionHistory.map((revision, index) => (
              <div key={index} className="bg-black/40 rounded-xl p-4 border border-emerald-500/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-emerald-300 font-medium">{revision.date}</div>
                  <div className="text-emerald-200/80 text-sm">{revision.author}</div>
                </div>
                <div className="text-emerald-100 text-sm">{revision.changes}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 追記フォーム */}
      {showContributionForm && (
        <ContributionForm
          drawingNumber={instruction.metadata.drawingNumber}
          targetSection={contributionTarget.section}
          stepNumber={contributionTarget.stepNumber}
          onSubmit={() => {
            setShowContributionForm(false)
            // ページをリロードして最新の追記データを取得
            window.location.reload()
          }}
          onCancel={() => setShowContributionForm(false)}
        />
      )}
    </div>
  )
} 