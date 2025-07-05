import React, { useState, useEffect } from 'react'
import { WorkInstruction } from '@/lib/dataLoader'
import { useTranslation } from '@/hooks/useTranslation'
import WorkStep from './WorkStep'
import { getFrontendDataPath } from '../lib/dataLoader';

interface WorkInstructionResultsProps {
  instruction: WorkInstruction
  onBack: () => void
  onRelatedDrawingClick: (drawingNumber: string) => void
}

interface FileList {
  images: string[]
  videos: string[]
  pdfs: string[]
}

export default function WorkInstructionResults({ instruction, onBack, onRelatedDrawingClick }: WorkInstructionResultsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'steps' | 'related' | 'troubleshooting'>('steps')
  const [fileList, setFileList] = useState<FileList>({ images: [], videos: [], pdfs: [] })

  // overview用のファイル状態
  const [overviewFiles, setOverviewFiles] = useState<{ pdfs: string[], images: string[], videos: string[] }>({ pdfs: [], images: [], videos: [] })

  const dataRoot = getFrontendDataPath();

  // フォルダ内ファイル一覧を取得する関数
  const getFilesFromFolder = async (drawingNumber: string, folderType: 'images' | 'videos' | 'pdfs', subFolder?: string) => {
    try {
      const params = new URLSearchParams({
        drawingNumber,
        folderType,
        ...(subFolder && { subFolder })
      })
      
      const response = await fetch(`/api/files?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error(`Error loading files from ${folderType}:`, error)
      return []
    }
  }

  // overviewファイルの初期化
  useEffect(() => {
    const loadOverviewFiles = async () => {
      const drawingNumber = instruction.metadata.drawingNumber
      const [pdfs, images, videos] = await Promise.all([
        getFilesFromFolder(drawingNumber, 'pdfs', 'overview'),
        getFilesFromFolder(drawingNumber, 'images', 'overview'),
        getFilesFromFolder(drawingNumber, 'videos', 'overview')
      ])
      setOverviewFiles({ pdfs, images, videos })
    }
    
    loadOverviewFiles()
  }, [instruction])

  // ファイル一覧を初期化
  useEffect(() => {
    const loadFiles = async () => {
      const drawingNumber = instruction.metadata.drawingNumber
      const mediaFolders = (instruction as any).mediaFolders || { images: 'overview', videos: 'overview' }
      
      const [images, videos, pdfs] = await Promise.all([
        getFilesFromFolder(drawingNumber, 'images', mediaFolders.images),
        getFilesFromFolder(drawingNumber, 'videos', mediaFolders.videos),
        getFilesFromFolder(drawingNumber, 'pdfs')
      ])
      
      setFileList({ images, videos, pdfs })
    }
    
    loadFiles()
  }, [instruction])

  // ステップごとのファイル一覧を取得する関数
  const getStepFiles = async (stepNumber: number) => {
    const drawingNumber = instruction.metadata.drawingNumber
    const stepFolder = `step_0${stepNumber}`
    
    const [stepImages, stepVideos] = await Promise.all([
      getFilesFromFolder(drawingNumber, 'images', stepFolder),
      getFilesFromFolder(drawingNumber, 'videos', stepFolder)
    ])
    
    return { images: stepImages, videos: stepVideos }
  }

  // PDFファイルパスを生成
  const getPdfFiles = () => {
    return fileList.pdfs.map(pdf => ({
      name: pdf,
      path: `${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/pdf/${pdf}`
    }))
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
        </div>
      </div>

      {/* overviewメディア群 */}
      {(overviewFiles.pdfs.length > 0 || overviewFiles.images.length > 0 || overviewFiles.videos.length > 0) && (
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
                    className="group flex items-center gap-3 px-4 py-3 bg-red-500/10 backdrop-blur-md text-red-400 rounded-xl border border-red-500/30 transition-all duration-200 min-w-0 max-w-xs"
                  >
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{pdf}</div>
                      <div className="text-xs text-red-400/70">PDF文書</div>
                    </div>
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
                    <img
                      src={`${dataRoot}/work-instructions/drawing-${instruction.metadata.drawingNumber}/images/overview/${image}`}
                      alt={`概要 - ${image}`}
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
        </div>
      )}

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
              <WorkStep 
                key={idx} 
                step={step} 
                instruction={instruction}
                getStepFiles={getStepFiles}
              />
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