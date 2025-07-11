'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { loadWorkInstruction, WorkInstruction } from '@/lib/dataLoader'
import WorkInstructionResults from '@/components/WorkInstructionResults'

interface InstructionPageProps {
  params: Promise<{
    drawingNumber: string
  }>
}

export default function InstructionPage({ params }: InstructionPageProps) {
  const { drawingNumber } = use(params)
  const [workInstruction, setWorkInstruction] = useState<WorkInstruction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const decodedDrawingNumber = decodeURIComponent(drawingNumber)
    console.log('🔍 図番選択:', decodedDrawingNumber) // デバッグログ追加
    
    setLoading(true)
    setError(null)
    setWorkInstruction(null)
    
    loadWorkInstruction(decodedDrawingNumber)
      .then((data) => {
        console.log('✅ 作業手順データ読み込み成功:', data) // デバッグログ追加
        setWorkInstruction(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('❌ 作業手順データ読み込みエラー:', error) // デバッグログ追加
        setError(`作業手順データの読み込みに失敗しました: ${error.message}`)
        setLoading(false)
      })
  }, [drawingNumber])

  // 検索に戻る処理
  const handleBackToSearch = () => {
    router.push('/')
  }

  // 関連図番クリック時の処理
  const handleRelatedDrawingClick = (drawingNumber: string) => {
    router.push(`/instruction/${encodeURIComponent(drawingNumber)}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center text-lg text-emerald-200 py-20">読み込み中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center text-red-400 py-20">{error}</div>
            <button
              onClick={handleBackToSearch}
              className="px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 text-sm font-medium shadow-lg"
            >
              検索に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!workInstruction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-center text-red-400 py-20">作業手順が見つかりません</div>
            <button
              onClick={handleBackToSearch}
              className="px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 text-sm font-medium shadow-lg"
            >
              検索に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <WorkInstructionResults
            instruction={workInstruction}
            onBack={handleBackToSearch}
            onRelatedDrawingClick={handleRelatedDrawingClick}
          />
        </div>
      </div>
    </div>
  )
} 