'use client'

import React from 'react'

interface ContributionFile {
  id: string
  originalFileName: string
  filePath: string
  fileType: 'image' | 'video' | 'pdf' | 'other'
  fileSize: number
  uploadedAt: string
}

interface Contribution {
  id: string
  drawingNumber: string
  userName: string
  timestamp: string
  status: 'active' | 'merged' | 'archived'
  targetSection: 'overview' | 'step' | 'general'
  stepNumber?: number
  content: {
    text?: string
    files?: ContributionFile[]
  }
}

interface ContributionsData {
  drawingNumber: string
  contributions: Contribution[]
}

interface ContributionsTabProps {
  contributions: ContributionsData | null
  drawingNumber: string
  copyToClipboard: (text: string) => void
  handleMergeContribution: (index: number) => void
  setCurrentImages: (urls: string[]) => void
  setCurrentImageIndex: (index: number) => void
  setLightboxOpen: (open: boolean) => void
}

export default function ContributionsTab({
  contributions,
  drawingNumber,
  copyToClipboard,
  handleMergeContribution,
  setCurrentImages,
  setCurrentImageIndex,
  setLightboxOpen
}: ContributionsTabProps) {
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">💬 追記情報管理</h2>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              追記一覧 【{contributions?.contributions.length || 0}件】
            </h3>
            <button
              type="button"
              onClick={() => window.open(`/instruction/${drawingNumber}`, '_blank')}
              className="custom-rect-button blue small"
            >
              <span>作業手順を確認</span>
            </button>
          </div>
    
          {contributions && contributions.contributions.filter(c => c.status === 'active').length > 0 ? (
            <div className="space-y-4">
              {contributions.contributions
                .filter(c => c.status === 'active')
                .map((contribution) => {
                  // 元の配列でのインデックスを取得
                  const originalIndex = contributions.contributions.findIndex(c => c.id === contribution.id)
                  return (
                <div key={contribution.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-white">
                        {contribution.userName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(contribution.timestamp).toLocaleString('ja-JP')}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        contribution.status === 'merged' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {contribution.status === 'merged' ? 'マージ済み' : '未処理'}
                      </span>
                      <span className="text-xs text-gray-400">
                        対象: {contribution.targetSection === 'overview' ? '概要' : 
                               contribution.targetSection === 'step' ? `ステップ ${contribution.stepNumber}` : 
                               '全般'}
                      </span>
                    </div>
                  </div>
                  
                  <div 
                    className="text-sm text-gray-300 mb-3 rounded-lg"
                    style={{ 
                      padding: '16px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '2px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {contribution.content.text && (
                      <>
                        <div className="whitespace-pre-wrap mb-2">
                          {contribution.content.text}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(contribution.content.text || '')}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                          title="テキストをコピー"
                        >
                          📋 コピー
                        </button>
                      </>
                    )}
                    {!contribution.content.text && (
                      <div className="text-gray-500">（テキストなし）</div>
                    )}
                  </div>
                  
                  {contribution.content.files && contribution.content.files.length > 0 && (
                    <div className="mt-3">
                      {/* 画像ファイル */}
                      {contribution.content.files.filter(f => f.fileType === 'image').length > 0 && (
                        <div className="mb-3">
                          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {contribution.content.files.filter(f => f.fileType === 'image').map((file, fileIndex) => (
                              <div
                                key={`img-${fileIndex}`}
                                className="bg-black/30 rounded-lg overflow-hidden border border-emerald-500/20 shadow-lg aspect-square flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                                onClick={() => {
                                  // この追記の全画像URLを収集
                                  const imageUrls = (contribution.content.files || [])
                                    .filter(f => f.fileType === 'image')
                                    .map(f => `/api/files?drawingNumber=${drawingNumber}&contributionFile=${encodeURIComponent(f.filePath)}`);
                                  const currentIndex = (contribution.content.files || [])
                                    .filter(f => f.fileType === 'image')
                                    .findIndex(f => f.filePath === file.filePath);
                                  setCurrentImages(imageUrls);
                                  setCurrentImageIndex(currentIndex);
                                  setLightboxOpen(true);
                                }}
                              >
                                <img
                                  src={`/api/files?drawingNumber=${drawingNumber}&contributionFile=${encodeURIComponent(file.filePath)}`}
                                  alt={file.originalFileName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 動画ファイル */}
                      {contribution.content.files.filter(f => f.fileType === 'video').length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {contribution.content.files.filter(f => f.fileType === 'video').map((file, fileIndex) => (
                            <a
                              key={`vid-${fileIndex}`}
                              href={`/api/files?drawingNumber=${drawingNumber}&contributionFile=${encodeURIComponent(file.filePath)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 text-xs rounded bg-purple-600 text-white hover:opacity-80"
                            >
                              🎥 {file.originalFileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-3">
                    {contribution.status !== 'merged' && (
                      <button
                        type="button"
                        className="custom-rect-button emerald small"
                        onClick={() => handleMergeContribution(originalIndex)}
                      >
                        <span>作業手順に転記済み</span>
                      </button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              追記はありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}