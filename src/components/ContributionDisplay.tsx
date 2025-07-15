'use client'
import { useMemo } from 'react'
import { ContributionData } from '@/types/contribution'
import { getFrontendDataPath } from '@/lib/dataLoader'

interface ContributionDisplayProps {
  contributions: ContributionData[]
  drawingNumber: string
}

export default function ContributionDisplay({ contributions, drawingNumber }: ContributionDisplayProps) {
  const dataPath = useMemo(() => getFrontendDataPath(), [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'comment': return '💬'
      case 'image': return '📷'
      case 'video': return '🎥'
      case 'nearmiss': return '⚠️'
      case 'troubleshoot': return '🔧'
      default: return '📝'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comment': return 'コメント'
      case 'image': return '画像'
      case 'video': return '動画'
      case 'nearmiss': return 'ヒヤリハット'
      case 'troubleshoot': return 'トラブル対策'
      default: return '追記'
    }
  }

  if (contributions.length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        👥 コミュニティ追記 ({contributions.length}件)
      </h4>
      
      <div className="space-y-3">
        {contributions.map((contribution) => (
          <div key={contribution.id} className="bg-white p-3 rounded border border-blue-100">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getTypeIcon(contribution.type)}</span>
                <span className="text-xs text-blue-600 font-medium">
                  {getTypeLabel(contribution.type)}
                </span>
                <span className="text-xs text-gray-500">
                  by {contribution.userName}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(contribution.timestamp)}
              </span>
            </div>

            {contribution.content.text && (
              <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                {contribution.content.text}
              </p>
            )}

            {/* 複数ファイル表示（新フォーマット） */}
            {contribution.content.files && contribution.content.files.length > 0 && (
              <div className="mb-2 space-y-2">
                {contribution.content.files.length > 1 && (
                  <p className="text-xs text-gray-600">📎 {contribution.content.files.length}個のファイル</p>
                )}
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  {contribution.content.files.map((file, index) => (
                    <div key={index}>
                      {file.fileType === 'image' && (
                        <div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${dataPath}/work-instructions/drawing-${drawingNumber}/contributions/${file.filePath}`}
                            alt={file.originalFileName}
                            className="w-full rounded border"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                          <p className="text-xs text-gray-500 mt-1">{file.originalFileName}</p>
                        </div>
                      )}
                      {file.fileType === 'video' && (
                        <div>
                          <video
                            controls
                            className="w-full rounded border"
                            style={{ maxHeight: '200px' }}
                          >
                            <source
                              src={`${dataPath}/work-instructions/drawing-${drawingNumber}/contributions/${file.filePath}`}
                              type={file.mimeType}
                            />
                            お使いのブラウザは動画をサポートしていません。
                          </video>
                          <p className="text-xs text-gray-500 mt-1">{file.originalFileName}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 既存フォーマット表示（後方互換性） */}
            {!contribution.content.files && contribution.content.imagePath && (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${dataPath}/work-instructions/drawing-${drawingNumber}/contributions/${contribution.content.imagePath}`}
                  alt="追記画像"
                  className="max-w-xs rounded border"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            )}

            {!contribution.content.files && contribution.content.videoPath && (
              <div className="mb-2">
                <video
                  controls
                  className="max-w-xs rounded border"
                  style={{ maxHeight: '200px' }}
                >
                  <source
                    src={`${dataPath}/work-instructions/drawing-${drawingNumber}/contributions/${contribution.content.videoPath}`}
                    type="video/mp4"
                  />
                  お使いのブラウザは動画をサポートしていません。
                </video>
              </div>
            )}

            {/* 既存フォーマットのファイル名表示（新フォーマットにファイルがない場合のみ） */}
            {!contribution.content.files && contribution.content.originalFileName && (
              <p className="text-xs text-gray-500">
                📎 {contribution.content.originalFileName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}