'use client'

import React, { useState, useEffect } from 'react'
import { WorkInstruction } from '@/lib/dataLoader'
import { ContributionFile } from '@/types/contribution'
import ContributionDisplay from '../ContributionDisplay'
import { ImageLightbox } from '../ImageLightbox'

interface InstructionOverviewProps {
  instruction: WorkInstruction
  contributions: ContributionFile | null
  onAddContribution: () => void
}

export default function InstructionOverview({ 
  instruction, 
  contributions, 
  onAddContribution 
}: InstructionOverviewProps) {
  // 概要画像の状態管理
  const [overviewFiles, setOverviewFiles] = useState<{ images: string[], videos: string[] }>({ images: [], videos: [] })
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 概要ファイルを取得する関数
  const getFilesFromFolder = async (drawingNumber: string, fileType: string, folderName: string): Promise<string[]> => {
    try {
      const encodedFolderName = encodeURIComponent(folderName)
      const response = await fetch(`/api/files/list?drawingNumber=${encodeURIComponent(drawingNumber)}&folderType=${fileType}&subFolder=${encodedFolderName}`)
      if (response.ok) {
        const data = await response.json()
        return data.files || []
      }
    } catch (error) {
      console.error(`${fileType}ファイル一覧の取得に失敗:`, error)
    }
    return []
  }

  // 概要ファイルの読み込み
  useEffect(() => {
    const loadOverviewFiles = async () => {
      const drawingNumber = instruction.metadata.drawingNumber
      const [images, videos] = await Promise.all([
        getFilesFromFolder(drawingNumber, 'images', 'overview'),
        getFilesFromFolder(drawingNumber, 'videos', 'overview')
      ])
      setOverviewFiles({ images, videos })
    }
    loadOverviewFiles()
  }, [instruction.metadata.drawingNumber])

  return (
    <div style={{ 
      marginBottom: '0',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      borderBottomLeftRadius: '0',
      borderBottomRightRadius: '0',
      padding: '32px',
      borderTop: '1px solid rgba(16, 185, 129, 0.2)',
      borderLeft: '1px solid rgba(16, 185, 129, 0.2)',
      borderRight: '1px solid rgba(16, 185, 129, 0.2)',
      borderBottom: 'none'
    }}>
      <h2 className="text-4xl font-bold text-white mb-8">【🤝みんなの作業手順】</h2>
      <p style={{ 
        fontSize: '1.5rem', 
        color: 'white', 
        marginTop: '12px',
        marginBottom: '12px', 
        whiteSpace: 'pre-line',
        borderLeft: '4px solid rgba(16, 185, 129, 0.8)',
        paddingLeft: '16px',
        paddingTop: '4px',
        paddingBottom: '4px'
      }}>
        {instruction.overview.description}
      </p>
      {instruction.overview.warnings && instruction.overview.warnings.length > 0 && (
        <div className="mb-2">
          <h4 className="text-lg font-semibold text-emerald-300 mb-1">《注意事項》</h4>
          <ul className="list-none space-y-1 text-emerald-200">
            {instruction.overview.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">❗</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 概要画像・動画表示 */}
      {(overviewFiles.images.length > 0 || overviewFiles.videos.length > 0) && (
        <div className="mt-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* 概要画像 */}
            {overviewFiles.images.map((image, i) => (
              <div 
                key={`overview-img-${i}`} 
                className="bg-black/30 rounded-lg overflow-hidden border border-emerald-500/20 shadow-lg aspect-square flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setCurrentImageIndex(i);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={`/api/files?drawingNumber=${instruction.metadata.drawingNumber}&folderType=images&subFolder=overview&fileName=${encodeURIComponent(image)}`}
                  alt={`${instruction.metadata.title} - 概要画像`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {/* 概要動画 */}
            {overviewFiles.videos.map((video, i) => (
              <div key={`overview-vid-${i}`} className="bg-black/30 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg">
                <div className="p-3 text-xs text-emerald-200 bg-emerald-500/20">
                  {video}
                </div>
                <video 
                  controls 
                  className="w-full h-48 object-cover"
                  preload="metadata"
                >
                  <source 
                    src={`/api/files?drawingNumber=${instruction.metadata.drawingNumber}&folderType=videos&subFolder=overview&fileName=${encodeURIComponent(video)}`}
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

      {/* 概要への追記表示 */}
      {contributions && (
        <ContributionDisplay 
          contributions={contributions.contributions.filter(c => c.targetSection === 'overview' && c.status === 'active')}
          drawingNumber={instruction.metadata.drawingNumber}
        />
      )}
      
      {/* 概要追記ボタン */}
      <div style={{ marginTop: '40px' }}>
        <button
          onClick={onAddContribution}
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
            sm:min-w-[280px]
          "
        >
          <span className="text-xl font-black">✚</span>
          <span className="font-bold tracking-wider">手順に追記する</span>
        </button>
      </div>

      {/* 概要画像用ライトボックス */}
      {overviewFiles.images.length > 0 && (
        <ImageLightbox
          images={overviewFiles.images.map(image => 
            `/api/files?drawingNumber=${instruction.metadata.drawingNumber}&folderType=images&subFolder=overview&fileName=${encodeURIComponent(image)}`
          )}
          isOpen={lightboxOpen}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          altText={`${instruction.metadata.title} - 概要画像`}
        />
      )}
    </div>
  )
}