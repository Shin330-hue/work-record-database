'use client'
import { useState } from 'react'

interface ContributionFormProps {
  drawingNumber: string
  targetSection: 'overview' | 'step' | 'general'
  stepNumber?: number
  onSubmit: () => void
  onCancel: () => void
}

export default function ContributionForm({ 
  drawingNumber, 
  targetSection, 
  stepNumber, 
  onSubmit, 
  onCancel 
}: ContributionFormProps) {
  const [userName, setUserName] = useState('')
  const [type, setType] = useState<'comment' | 'image' | 'video' | 'nearmiss' | 'troubleshoot'>('comment')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (selectedFile.type.startsWith('image/')) {
        setType('image')
      } else if (selectedFile.type.startsWith('video/')) {
        setType('video')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || (!text && !file)) {
      alert('👤 お名前と内容（またはファイル）を入力してください！\n\nあなたの貴重な経験をみんなで共有しましょう✨')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('drawingNumber', drawingNumber)
      formData.append('userId', userName) // userNameをuserIdとして使用
      formData.append('userName', userName)
      formData.append('type', type)
      formData.append('targetSection', targetSection)
      if (stepNumber) {
        formData.append('stepNumber', stepNumber.toString())
      }
      if (text) {
        formData.append('text', text)
      }
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/contribution', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        alert('🎉 ナレッジ共有ありがとうございます！\n\nあなたの知見が現場の品質向上に貢献します💪\nまた気づいたことがあれば、どんどん投稿してください！')
        onSubmit()
      } else {
        alert('投稿に失敗しました。もう一度お試しください。')
      }
    } catch (error) {
      console.error('投稿エラー:', error)
      alert('投稿中にエラーが発生しました。\n\n貴重な知見を失わないよう、もう一度投稿をお試しください！')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onCancel}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          {targetSection === 'overview' ? '概要' : 
           targetSection === 'step' ? `ステップ ${stepNumber}` : '全般'}への追記
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="例: 田中太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              追記タイプ
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="comment">コメント・注意点</option>
              <option value="image">画像追加</option>
              <option value="video">動画追加</option>
              <option value="nearmiss">ヒヤリハット事例</option>
              <option value="troubleshoot">トラブル対策</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容 {!file && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={4}
              placeholder="気づいた点、改善提案、注意事項など..."
              required={!file}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ファイル添付（画像・動画）
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                選択済み: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '投稿中...' : '投稿'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}