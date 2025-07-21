// src/app/admin/drawings/[id]/edit/page.tsx - 図番編集画面

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { loadWorkInstruction, loadSearchIndex, loadCompanies, loadContributions, WorkStep, NearMissItem } from '@/lib/dataLoader'
import { ContributionFile } from '@/types/contribution'

interface EditFormData {
  drawingNumber: string
  title: string
  company: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    category: string
  }
  difficulty: '初級' | '中級' | '上級'
  estimatedTime: string
  machineType: string[]
  description: string
  keywords: string[]
  toolsRequired: string[]
  overview: {
    warnings: string[]
    preparationTime: string
    processingTime: string
    images: string[]
  }
  workSteps: WorkStep[]
  nearMiss: NearMissItem[]
}

type TabType = 'basic' | 'workSteps' | 'quality' | 'related'

export default function DrawingEdit() {
  const router = useRouter()
  const params = useParams()
  const drawingNumber = params.id as string

  const [formData, setFormData] = useState<EditFormData | null>(null)
  const [contributions, setContributions] = useState<ContributionFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({})
  const [actualFiles, setActualFiles] = useState<{
    overview: { images: string[], videos: string[] },
    steps: { [key: number]: { images: string[], videos: string[] } }
  }>({
    overview: { images: [], videos: [] },
    steps: {}
  })

  // 機械種別の選択肢（新規登録画面と統一）
  const machineTypes = ['マシニング', 'ターニング', '横中', 'ラジアル', 'フライス']

  // タブ定義
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'basic', label: '基本情報', icon: '📋' },
    { id: 'quality', label: '品質・安全', icon: '⚠️' },
    { id: 'workSteps', label: '作業手順', icon: '🔧' },
    { id: 'related', label: '関連情報', icon: '🔗' }
  ]

  useEffect(() => {
    const loadEditData = async () => {
      try {
        if (!drawingNumber) {
          setError('図番が指定されていません')
          return
        }

        // 並列でデータ読み込み
        const [workInstruction, searchIndex, companiesData, contributionsData] = await Promise.all([
          loadWorkInstruction(drawingNumber),
          loadSearchIndex(),
          loadCompanies(),
          loadContributions(drawingNumber)
        ])

        if (!workInstruction) {
          setError('図番データが見つかりません')
          return
        }

        // 検索インデックスから基本情報取得
        const searchItem = searchIndex.drawings.find(d => d.drawingNumber === drawingNumber)
        if (!searchItem) {
          setError('検索インデックスにデータが見つかりません')
          return
        }

        // 会社・製品情報の解決
        let companyInfo = { id: '', name: '' }
        let productInfo = { id: '', name: '', category: '' }

        for (const company of companiesData) {
          for (const product of company.products) {
            if (product.drawings.includes(drawingNumber)) {
              companyInfo = { id: company.id, name: company.name }
              productInfo = { 
                id: product.id, 
                name: product.name, 
                category: product.category 
              }
              break
            }
          }
          if (companyInfo.id) break
        }

        // デバッグ用ログ
        console.log('📋 読み込まれたメタデータ:', {
          difficulty: workInstruction.metadata.difficulty,
          estimatedTime: workInstruction.metadata.estimatedTime,
          machineType: workInstruction.metadata.machineType,
          title: workInstruction.metadata.title
        })

        // 機械種別の正規化（長い名称→短い名称）
        const normalizeMachineType = (types: string | string[]): string[] => {
          const typeArray = Array.isArray(types) ? types : (types ? [types] : [])
          const nameMap: Record<string, string> = {
            'マシニングセンタ': 'マシニング',
            'ターニングセンタ': 'ターニング', 
            'ラジアルボール盤': 'ラジアル',
            '横中ぐり盤': '横中',
            'フライス盤': 'フライス'
          }
          
          return typeArray.map(type => nameMap[type] || type).filter(type => 
            ['マシニング', 'ターニング', '横中', 'ラジアル', 'フライス'].includes(type)
          )
        }

        // フォームデータ構築
        const editData: EditFormData = {
          drawingNumber: workInstruction.metadata.drawingNumber,
          title: workInstruction.metadata.title,
          company: companyInfo,
          product: productInfo,
          difficulty: (workInstruction.metadata.difficulty || '中級') as '初級' | '中級' | '上級',
          estimatedTime: workInstruction.metadata.estimatedTime?.replace('分', '') || '180',
          machineType: normalizeMachineType(workInstruction.metadata.machineType),
          description: workInstruction.overview.description || '',
          keywords: searchItem.keywords || [],
          toolsRequired: workInstruction.metadata.toolsRequired || [],
          overview: {
            warnings: workInstruction.overview.warnings || [],
            preparationTime: workInstruction.overview.preparationTime?.replace('分', '') || '30',
            processingTime: workInstruction.overview.processingTime?.replace('分', '') || '60',
            images: []  // 実際のファイルはactualFilesで管理
          },
          workSteps: workInstruction.workSteps?.map(step => ({
            ...step,
            images: step.images || [],
            videos: step.videos || []
          })) || [],
          nearMiss: workInstruction.nearMiss || []
        }

        console.log('🎯 構築されたフォームデータ:', editData)
        // 注: 画像・動画ファイルは別途actualFilesで管理されます

        setFormData(editData)
        setContributions(contributionsData)
      } catch (error) {
        console.error('編集データ読み込みエラー:', error)
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadEditData()
  }, [drawingNumber])

  // formDataが設定されたらファイル一覧を取得
  useEffect(() => {
    if (formData && drawingNumber) {
      loadActualFiles(drawingNumber)
    }
  }, [formData, drawingNumber])

  // フォルダから実際のファイル一覧を取得する関数
  const loadActualFiles = async (drawingNumber: string) => {
    try {
      // Overview画像を取得
      const overviewImagesRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=overview`)
      const overviewImagesData = await overviewImagesRes.json()
      
      // Overview動画を取得
      const overviewVideosRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=videos&subFolder=overview`)
      const overviewVideosData = await overviewVideosRes.json()

      const newActualFiles: typeof actualFiles = {
        overview: {
          images: overviewImagesData.data?.files || overviewImagesData.files || [],
          videos: overviewVideosData.data?.files || overviewVideosData.files || []
        },
        steps: {}
      }

      // 各ステップのファイルを取得（最大3ステップ分を取得）
      for (let i = 0; i < 3; i++) {
          const stepNum = String(i + 1).padStart(2, '0')
          
          // ステップ画像を取得
          const stepImagesRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=step_${stepNum}`)
          const stepImagesData = await stepImagesRes.json()
          
          // ステップ動画を取得
          const stepVideosRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=videos&subFolder=step_${stepNum}`)
          const stepVideosData = await stepVideosRes.json()

        newActualFiles.steps[i] = {
          images: stepImagesData.data?.files || stepImagesData.files || [],
          videos: stepVideosData.data?.files || stepVideosData.files || []
        }
      }

      setActualFiles(newActualFiles)
      console.log('📁 実際のファイル一覧:', newActualFiles)
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSaving(true)
    setError('')

    try {
      const updateData = {
        ...formData,
        machineType: formData.machineType.join(','),
        keywords: formData.keywords.join(','),
        toolsRequired: formData.toolsRequired.join(','),
        overview: {
          ...formData.overview,
          warnings: formData.overview.warnings.filter(w => w.trim())
        },
        workSteps: formData.workSteps,
        nearMiss: formData.nearMiss
      }

      // デバッグ用ログ
      console.log('🚀 送信データ:', updateData)

      const response = await fetch(`/api/admin/drawings/${drawingNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `更新エラー: ${response.status}`)
      }
      
      if (result.success) {
        alert('図番情報が正常に更新されました')
        router.push('/admin/drawings/list')
      } else {
        throw new Error(result.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('更新エラー:', error)
      setError(error instanceof Error ? error.message : '更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleMachineTypeChange = (machine: string, checked: boolean) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      
      const newMachineTypes = checked
        ? [...prev.machineType, machine]
        : prev.machineType.filter(m => m !== machine)

      return {
        ...prev,
        machineType: newMachineTypes
      }
    })
  }

  const handleKeywordsChange = (keywordsString: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        keywords: keywordsString.split(',').map(k => k.trim()).filter(k => k)
      }
    })
  }

  const handleToolsRequiredChange = (toolsString: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        toolsRequired: toolsString.split(',').map(t => t.trim()).filter(t => t)
      }
    })
  }

  // 警告事項の配列操作ハンドラー
  const handleWarningChange = (index: number, value: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newWarnings = [...prev.overview.warnings]
      newWarnings[index] = value
      return {
        ...prev,
        overview: { ...prev.overview, warnings: newWarnings }
      }
    })
  }

  const addWarning = () => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        overview: { ...prev.overview, warnings: [...prev.overview.warnings, ''] }
      }
    })
  }

  const removeWarning = (index: number) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newWarnings = prev.overview.warnings.filter((_, i) => i !== index)
      return {
        ...prev,
        overview: { ...prev.overview, warnings: newWarnings }
      }
    })
  }

  // 作業ステップ操作ハンドラー
  const addWorkStep = () => {
    if (!formData) return

    const newStep: WorkStep = {
      stepNumber: formData.workSteps.length + 1,
      title: `ステップ ${formData.workSteps.length + 1}`,
      description: '',
      detailedInstructions: [],
      images: [],
      videos: [],
      timeRequired: '30分',
      warningLevel: 'normal',
      qualityCheck: {
        checkPoints: [],
        inspectionTools: []
      }
    }

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        workSteps: [...prev.workSteps, newStep]
      }
    })
  }

  const updateWorkStep = (index: number, updatedStep: WorkStep) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newWorkSteps = [...prev.workSteps]
      newWorkSteps[index] = updatedStep
      return {
        ...prev,
        workSteps: newWorkSteps
      }
    })
  }

  const deleteWorkStep = (index: number) => {
    if (!formData) return
    
    if (!confirm('このステップを削除しますか？')) return

    setFormData(prev => {
      if (!prev) return prev
      const newWorkSteps = prev.workSteps.filter((_, i) => i !== index)
      // ステップ番号を再調整
      return {
        ...prev,
        workSteps: newWorkSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }))
      }
    })
  }

  const moveWorkStep = (fromIndex: number, toIndex: number) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newWorkSteps = [...prev.workSteps]
      const [movedStep] = newWorkSteps.splice(fromIndex, 1)
      newWorkSteps.splice(toIndex, 0, movedStep)
      // ステップ番号を再調整
      return {
        ...prev,
        workSteps: newWorkSteps.map((step, i) => ({ ...step, stepNumber: i + 1 }))
      }
    })
  }

  // ヒヤリハット事例操作ハンドラー
  const handleNearMissChange = (index: number, field: keyof NearMissItem, value: string) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newNearMiss = [...prev.nearMiss]
      newNearMiss[index] = { ...newNearMiss[index], [field]: value }
      return {
        ...prev,
        nearMiss: newNearMiss
      }
    })
  }

  const addNearMiss = () => {
    if (!formData) return

    const newNearMissItem: NearMissItem = {
      title: '',
      description: '',
      cause: '',
      prevention: '',
      severity: 'medium'
    }

    setFormData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        nearMiss: [...prev.nearMiss, newNearMissItem]
      }
    })
  }

  const removeNearMiss = (index: number) => {
    if (!formData) return

    setFormData(prev => {
      if (!prev) return prev
      const newNearMiss = prev.nearMiss.filter((_, i) => i !== index)
      return {
        ...prev,
        nearMiss: newNearMiss
      }
    })
  }

  // ファイル操作ハンドラー
  const handleFileUpload = async (stepIndex: number, fileType: 'images' | 'videos', files: FileList | null) => {
    if (!files || !formData) return

    const uploadKey = `${stepIndex}-${fileType}`
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }))

    const uploadedFiles: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('stepNumber', (stepIndex + 1).toString())
      formDataUpload.append('fileType', fileType)

      try {
        const response = await fetch(`/api/admin/drawings/${drawingNumber}/files`, {
          method: 'POST',
          body: formDataUpload
        })

        if (response.ok) {
          const result = await response.json()
          uploadedFiles.push(result.fileName)
        } else {
          console.error('ファイルアップロードエラー:', file.name)
        }
      } catch (error) {
        console.error('ファイルアップロード失敗:', error)
      }
    }

    // 成功したファイルのみ状態に追加
    if (uploadedFiles.length > 0) {
      setActualFiles(prev => ({
        ...prev,
        steps: {
          ...prev.steps,
          [stepIndex]: {
            ...prev.steps[stepIndex],
            [fileType]: [...(prev.steps[stepIndex]?.[fileType] || []), ...uploadedFiles]
          }
        }
      }))
    }

    setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }))
  }

  const removeStepFile = async (stepIndex: number, fileType: 'images' | 'videos', fileIndex: number) => {
    if (!actualFiles.steps[stepIndex] || !actualFiles.steps[stepIndex][fileType][fileIndex]) return

    const fileName = actualFiles.steps[stepIndex][fileType][fileIndex]
    
    if (!confirm(`${fileName} を削除しますか？`)) return

    try {
      const response = await fetch(`/api/admin/drawings/${drawingNumber}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          stepNumber: stepIndex + 1,
          fileType
        })
      })

      if (response.ok) {
        // 状態から削除
        setActualFiles(prev => ({
          ...prev,
          steps: {
            ...prev.steps,
            [stepIndex]: {
              ...prev.steps[stepIndex],
              [fileType]: prev.steps[stepIndex][fileType].filter((_, i) => i !== fileIndex)
            }
          }
        }))
      } else {
        alert('ファイルの削除に失敗しました')
      }
    } catch (error) {
      console.error('ファイル削除エラー:', error)
      alert('ファイルの削除に失敗しました')
    }
  }

  // 概要画像操作ハンドラー
  const handleOverviewImageUpload = async (files: FileList | null) => {
    if (!files || !formData) return

    const uploadKey = 'overview-images'
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }))

    const uploadedFiles: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('stepNumber', '0') // overview用
      formDataUpload.append('fileType', 'images')

      try {
        const response = await fetch(`/api/admin/drawings/${drawingNumber}/files`, {
          method: 'POST',
          body: formDataUpload
        })

        if (response.ok) {
          const result = await response.json()
          uploadedFiles.push(result.fileName)
        } else {
          console.error('ファイルアップロードエラー:', file.name)
        }
      } catch (error) {
        console.error('ファイルアップロード失敗:', error)
      }
    }

    // 成功したファイルのみ状態に追加
    if (uploadedFiles.length > 0) {
      setActualFiles(prev => ({
        ...prev,
        overview: {
          ...prev.overview,
          images: [...prev.overview.images, ...uploadedFiles]
        }
      }))
    }

    setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }))
  }

  const removeOverviewImage = async (imageIndex: number) => {
    if (!actualFiles.overview.images[imageIndex]) return

    const fileName = actualFiles.overview.images[imageIndex]
    
    if (!confirm(`${fileName} を削除しますか？`)) return

    try {
      const response = await fetch(`/api/admin/drawings/${drawingNumber}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          stepNumber: 0, // overview用
          fileType: 'images'
        })
      })

      if (response.ok) {
        // 状態から削除
        setActualFiles(prev => ({
          ...prev,
          overview: {
            ...prev.overview,
            images: prev.overview.images.filter((_, i) => i !== imageIndex)
          }
        }))
      } else {
        alert('ファイルの削除に失敗しました')
      }
    } catch (error) {
      console.error('ファイル削除エラー:', error)
      alert('ファイルの削除に失敗しました')
    }
  }

  // 追記管理ハンドラー
  const handleMergeContribution = async (contributionIndex: number) => {
    if (!contributions) return

    try {
      const response = await fetch(`/api/admin/contributions/${drawingNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'merge',
          contributionIndex
        }),
      })

      if (response.ok) {
        // ローカル状態更新
        setContributions(prev => {
          if (!prev) return prev
          const updated = { ...prev }
          updated.contributions[contributionIndex].status = 'merged'
          return updated
        })
        alert('追記をマージ済みに変更しました')
      } else {
        throw new Error('ステータス更新に失敗しました')
      }
    } catch (error) {
      console.error('マージエラー:', error)
      alert('マージ処理に失敗しました')
    }
  }

  const handleDeleteContribution = async (contributionIndex: number) => {
    if (!contributions) return
    
    if (!confirm('この追記を削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/contributions/${drawingNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          contributionIndex
        }),
      })

      if (response.ok) {
        // ローカル状態更新
        setContributions(prev => {
          if (!prev) return prev
          const updated = { ...prev }
          updated.contributions.splice(contributionIndex, 1)
          return updated
        })
        alert('追記を削除しました')
      } else {
        throw new Error('削除に失敗しました')
      }
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除処理に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">編集データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ エラー</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            href="/admin/drawings/list"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 図番一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">データがありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              図番編集: {formData.drawingNumber}
            </h1>
            <Link 
              href="/admin/drawings/list"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 図番一覧に戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報タブ */}
          {activeTab === 'basic' && (
            <>
              {/* 基本情報 */}
              <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  図番 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.drawingNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">図番は変更できません</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作業手順タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* 会社・製品情報 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">会社・製品情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会社名
                </label>
                <input
                  type="text"
                  value={formData.company.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">会社情報は変更できません</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  製品名
                </label>
                <input
                  type="text"
                  value={formData.product.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">製品情報は変更できません</p>
              </div>
            </div>
          </div>

          {/* 作業詳細 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">作業詳細</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  難易度 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => prev ? { 
                    ...prev, 
                    difficulty: e.target.value as '初級' | '中級' | '上級' 
                  } : prev)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="初級">初級</option>
                  <option value="中級">中級</option>
                  <option value="上級">上級</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  推定時間 <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, estimatedTime: e.target.value } : prev)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="9999"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                    分
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                機械種別 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {machineTypes.map(machine => (
                  <label key={machine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.machineType.includes(machine)}
                      onChange={(e) => handleMachineTypeChange(machine, e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{machine}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                必要工具
              </label>
              <input
                type="text"
                value={formData.toolsRequired.join(', ')}
                onChange={(e) => handleToolsRequiredChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="必要工具をカンマ区切りで入力..."
              />
              <p className="text-xs text-gray-500 mt-1">
                作業に必要な工具をカンマ区切りで入力してください
              </p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明・備考
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => prev ? { ...prev, description: e.target.value } : prev)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="作業の概要や注意点を入力してください..."
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索キーワード
              </label>
              <input
                type="text"
                value={formData.keywords.join(', ')}
                onChange={(e) => handleKeywordsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="キーワードをカンマ区切りで入力..."
              />
              <p className="text-xs text-gray-500 mt-1">
                検索で見つけやすくするためのキーワードです
              </p>
            </div>
          </div>

          {/* 概要画像セクション */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">概要画像</h2>
            <div className="space-y-2">
              {actualFiles.overview.images.length > 0 ? actualFiles.overview.images.map((image, imgIndex) => (
                <div key={imgIndex} className="border border-gray-200 rounded-md bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 font-medium">{image}</span>
                    <button
                      type="button"
                      onClick={() => removeOverviewImage(imgIndex)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  </div>
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <img
                      src={`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=overview&fileName=${encodeURIComponent(image)}`}
                      alt={`概要画像 - ${image}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent && !parent.querySelector('.error-message')) {
                          const errorDiv = document.createElement('div')
                          errorDiv.className = 'error-message flex items-center justify-center h-full text-gray-400'
                          errorDiv.innerHTML = '<span>画像を読み込めません</span>'
                          parent.appendChild(errorDiv)
                        }
                      }}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  概要画像はありません
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleOverviewImageUpload(e.target.files)}
                  className="hidden"
                  id="overview-image-upload"
                />
                <label
                  htmlFor="overview-image-upload"
                  className={`px-4 py-2 rounded-md cursor-pointer font-medium text-sm ${
                    uploadingFiles['overview-images']
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {uploadingFiles['overview-images'] ? 'アップロード中...' : '+ 概要画像を追加'}
                </label>
              </div>
            </div>
          </div>
            </>
          )}

          {/* 品質・安全タブ */}
          {activeTab === 'quality' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">⚠️ 品質・安全</h2>
              
              {/* ヒヤリハット事例セクション */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    ヒヤリハット事例 ({formData.nearMiss.length}件)
                  </h3>
                  <button
                    type="button"
                    onClick={addNearMiss}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-medium"
                  >
                    + 事例追加
                  </button>
                </div>
                
                {formData.nearMiss.length > 0 ? (
                  <div className="space-y-4">
                    {formData.nearMiss.map((item, index) => (
                      <NearMissEditor
                        key={index}
                        item={item}
                        index={index}
                        onChange={handleNearMissChange}
                        onRemove={() => removeNearMiss(index)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    ヒヤリハット事例がありません。「+ 事例追加」ボタンで追加してください。
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 作業手順タブ */}
          {activeTab === 'workSteps' && (
            <div className="space-y-6">
              {/* 概要セクション */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 作業手順概要</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      準備時間
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={formData.overview.preparationTime}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          overview: { ...prev.overview, preparationTime: e.target.value }
                        } : prev)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="9999"
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                        分
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      加工時間
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={formData.overview.processingTime}
                        onChange={(e) => setFormData(prev => prev ? {
                          ...prev,
                          overview: { ...prev.overview, processingTime: e.target.value }
                        } : prev)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="9999"
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                        分
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    注意事項
                  </label>
                  <div className="space-y-2">
                    {formData.overview.warnings.map((warning, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={warning}
                          onChange={(e) => handleWarningChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="注意事項を入力..."
                        />
                        <button
                          type="button"
                          onClick={() => removeWarning(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addWarning}
                      className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-300 rounded-md hover:bg-blue-50"
                    >
                      + 注意事項を追加
                    </button>
                  </div>
                </div>
              </div>

              {/* 作業ステップセクション */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    作業ステップ ({formData.workSteps.length}件)
                  </h3>
                  <button
                    type="button"
                    onClick={addWorkStep}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    + ステップ追加
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.workSteps.map((step, index) => (
                    <WorkStepEditor
                      key={index}
                      step={step}
                      index={index}
                      onUpdate={(updatedStep) => updateWorkStep(index, updatedStep)}
                      onDelete={() => deleteWorkStep(index)}
                      onMoveUp={index > 0 ? () => moveWorkStep(index, index - 1) : undefined}
                      onMoveDown={index < formData.workSteps.length - 1 ? () => moveWorkStep(index, index + 1) : undefined}
                      uploadingFiles={uploadingFiles}
                      onFileUpload={handleFileUpload}
                      onFileRemove={removeStepFile}
                      actualFiles={actualFiles}
                    />
                  ))}
                  
                  {formData.workSteps.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      作業ステップがありません。「+ ステップ追加」ボタンで追加してください。
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 関連情報タブ */}
          {activeTab === 'related' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 関連情報</h2>
              
              {/* 追記管理セクション */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💬 追記情報 ({contributions?.contributions.length || 0}件)
                </h3>
            
            {contributions && contributions.contributions.length > 0 ? (
              <div className="space-y-4">
                {contributions.contributions.map((contribution, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {contribution.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(contribution.timestamp).toLocaleString('ja-JP')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contribution.status === 'merged' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {contribution.status === 'merged' ? 'マージ済み' : '未処理'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3">
                      {contribution.content.text}
                    </div>
                    
                    {contribution.content.files && contribution.content.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {contribution.content.files.map((file, fileIndex) => (
                          <span key={fileIndex} className={`inline-flex items-center px-2 py-1 text-xs rounded ${
                            file.fileType === 'image' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {file.fileType === 'image' ? '📷' : '🎥'} {file.originalFileName}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => window.open(`/instruction/${drawingNumber}`, '_blank')}
                      >
                        詳細確認
                      </button>
                      {contribution.status !== 'merged' && (
                        <button
                          type="button"
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                          onClick={() => handleMergeContribution(index)}
                        >
                          マージ済みにする
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        onClick={() => handleDeleteContribution(index)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                追記はありません
              </div>
            )}
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/drawings/list"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-wait"
            >
              {saving ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
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
  onFileUpload: (stepIndex: number, fileType: 'images' | 'videos', files: FileList | null) => void
  onFileRemove: (stepIndex: number, fileType: 'images' | 'videos', fileIndex: number) => void
  actualFiles: {
    overview: { images: string[], videos: string[] },
    steps: { [key: number]: { images: string[], videos: string[] } }
  }
}

function WorkStepEditor({ step, index, onUpdate, onDelete, onMoveUp, onMoveDown, uploadingFiles, onFileUpload, onFileRemove, actualFiles }: WorkStepEditorProps) {
  // 親コンポーネントから渡される図番を取得
  const params = useParams()
  const drawingNumber = params.id as string
  const [isExpanded, setIsExpanded] = useState(false)

  const warningLevels = ['normal', 'caution', 'important', 'critical'] as const
  const warningLevelLabels = {
    normal: '通常',
    caution: '注意',
    important: '重要',
    critical: '危険'
  }

  const handleDetailedInstructionChange = (instIndex: number, value: string) => {
    const newInstructions = [...step.detailedInstructions]
    newInstructions[instIndex] = value
    onUpdate({ ...step, detailedInstructions: newInstructions })
  }

  const addDetailedInstruction = () => {
    onUpdate({
      ...step,
      detailedInstructions: [...step.detailedInstructions, '']
    })
  }

  const removeDetailedInstruction = (instIndex: number) => {
    const newInstructions = step.detailedInstructions.filter((_, i) => i !== instIndex)
    onUpdate({ ...step, detailedInstructions: newInstructions })
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-left flex-1"
        >
          <span className="text-lg">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="font-medium text-gray-900">
            ステップ {step.stepNumber}: {step.title}
          </span>
        </button>
        
        <div className="flex items-center space-x-2">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="上に移動"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="下に移動"
            >
              ↓
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-500 hover:text-red-700"
            title="削除"
          >
            ×
          </button>
        </div>
      </div>

      {/* 詳細内容 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステップタイトル
              </label>
              <input
                type="text"
                value={step.title}
                onChange={(e) => onUpdate({ ...step, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所要時間
              </label>
              <input
                type="text"
                value={step.timeRequired}
                onChange={(e) => onUpdate({ ...step, timeRequired: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30分"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステップ説明
            </label>
            <textarea
              value={step.description}
              onChange={(e) => onUpdate({ ...step, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="このステップの概要を入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              警告レベル
            </label>
            <select
              value={step.warningLevel}
              onChange={(e) => onUpdate({ ...step, warningLevel: e.target.value as WorkStep['warningLevel'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {warningLevels.map(level => (
                <option key={level} value={level}>
                  {warningLevelLabels[level]}
                </option>
              ))}
            </select>
          </div>

          {/* 詳細手順 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              詳細手順
            </label>
            <div className="space-y-2">
              {step.detailedInstructions.map((instruction, instIndex) => (
                <div key={instIndex} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-6">{instIndex + 1}.</span>
                  <input
                    type="text"
                    value={instruction}
                    onChange={(e) => handleDetailedInstructionChange(instIndex, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="手順を入力..."
                  />
                  <button
                    type="button"
                    onClick={() => removeDetailedInstruction(instIndex)}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDetailedInstruction}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-300 rounded-md hover:bg-blue-50"
              >
                + 手順を追加
              </button>
            </div>
          </div>

          {/* 切削条件セクション */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">切削条件</h4>
            <div className="space-y-4">
              {(() => {
                // 切削条件が単一のCuttingConditionsオブジェクトか、複数のオブジェクトかを判別
                const conditions = step.cuttingConditions || {};
                const isMultipleConditions = !('tool' in conditions) && typeof conditions === 'object';
                
                if (!isMultipleConditions) {
                  // 単一の切削条件の場合（後方互換性のため）
                  if (!conditions.tool && !conditions.spindleSpeed && !conditions.feedRate) {
                    return (
                      <div className="text-sm text-gray-500">
                        切削条件が設定されていません
                      </div>
                    );
                  }
                  // 単一から複数への変換
                  const newConditions = { 'condition_1': conditions as CuttingConditions };
                  onUpdate({ ...step, cuttingConditions: newConditions });
                  return null;
                }
                
                const conditionEntries = Object.entries(conditions);
                
                if (conditionEntries.length === 0) {
                  return (
                    <div className="text-sm text-gray-500">
                      切削条件が設定されていません
                    </div>
                  );
                }
                
                return conditionEntries.map(([key, condition], index) => (
                  <div key={`${index}-${key}`} className="border border-gray-300 rounded-md p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        defaultValue={key}
                        onBlur={(e) => {
                          const newKey = e.target.value;
                          if (newKey !== key && newKey) {
                            const newConditions: { [key: string]: CuttingConditions } = {};
                            Object.entries(conditions).forEach(([k, v]) => {
                              if (k === key) {
                                newConditions[newKey] = v;
                              } else {
                                newConditions[k] = v;
                              }
                            });
                            onUpdate({ ...step, cuttingConditions: newConditions });
                          }
                        }}
                        className="text-sm font-medium px-2 py-1 border border-gray-300 rounded"
                        placeholder="工程名（例: roughing_fullback）"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newConditions = { ...conditions };
                          delete newConditions[key];
                          onUpdate({ ...step, cuttingConditions: newConditions });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">工具</label>
                        <input
                          type="text"
                          value={(condition && typeof condition === 'object' && 'tool' in condition) ? condition.tool : ''}
                          onChange={(e) => {
                            const newConditions = { ...conditions };
                            newConditions[key] = { ...(condition || {}), tool: e.target.value };
                            onUpdate({ ...step, cuttingConditions: newConditions });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: φ10エンドミル"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">主軸回転数</label>
                        <input
                          type="text"
                          value={(condition && typeof condition === 'object' && 'spindleSpeed' in condition) ? condition.spindleSpeed : ''}
                          onChange={(e) => {
                            const newConditions = { ...conditions };
                            newConditions[key] = { ...(condition || {}), spindleSpeed: e.target.value };
                            onUpdate({ ...step, cuttingConditions: newConditions });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: S3000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">送り速度</label>
                        <input
                          type="text"
                          value={(condition && typeof condition === 'object' && 'feedRate' in condition) ? condition.feedRate : ''}
                          onChange={(e) => {
                            const newConditions = { ...conditions };
                            newConditions[key] = { ...(condition || {}), feedRate: e.target.value };
                            onUpdate({ ...step, cuttingConditions: newConditions });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: F500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">切込み深さ</label>
                        <input
                          type="text"
                          value={(condition && typeof condition === 'object' && 'depthOfCut' in condition) ? condition.depthOfCut : ''}
                          onChange={(e) => {
                            const newConditions = { ...conditions };
                            newConditions[key] = { ...(condition || {}), depthOfCut: e.target.value };
                            onUpdate({ ...step, cuttingConditions: newConditions });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 2mm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">ステップオーバー</label>
                        <input
                          type="text"
                          value={(condition && typeof condition === 'object' && 'stepOver' in condition) ? condition.stepOver : ''}
                          onChange={(e) => {
                            const newConditions = { ...conditions };
                            newConditions[key] = { ...(condition || {}), stepOver: e.target.value };
                            onUpdate({ ...step, cuttingConditions: newConditions });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="例: 5mm"
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
              
              <button
                type="button"
                onClick={() => {
                  const newConditions = { ...(step.cuttingConditions || {}) };
                  const newKey = `condition_${Object.keys(newConditions).length + 1}`;
                  newConditions[newKey] = {
                    tool: '',
                    spindleSpeed: '',
                    feedRate: '',
                    depthOfCut: '',
                    stepOver: ''
                  };
                  onUpdate({ ...step, cuttingConditions: newConditions });
                }}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-300 rounded-md hover:bg-blue-50"
              >
                + 切削条件を追加
              </button>
            </div>
          </div>

          {/* 画像・動画セクション */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 画像セクション */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像 ({(actualFiles.steps[index]?.images || []).length}件)
              </label>
              <div className="space-y-2">
                {(actualFiles.steps[index]?.images || []).map((image, imgIndex) => (
                  <div key={imgIndex} className="border border-gray-200 rounded-md bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 font-medium">{image}</span>
                      <button
                        type="button"
                        onClick={() => onFileRemove(index, 'images', imgIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                      <img
                        src={`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=step_${String(index + 1).padStart(2, '0')}&fileName=${encodeURIComponent(image)}`}
                        alt={`ステップ画像 - ${image}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent && !parent.querySelector('.error-message')) {
                            const errorDiv = document.createElement('div')
                            errorDiv.className = 'error-message flex items-center justify-center h-full text-gray-400'
                            errorDiv.innerHTML = '<span>画像を読み込めません</span>'
                            parent.appendChild(errorDiv)
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onFileUpload(index, 'images', e.target.files)}
                    className="hidden"
                    id={`image-upload-${index}`}
                  />
                  <label
                    htmlFor={`image-upload-${index}`}
                    className={`px-4 py-2 rounded-md cursor-pointer font-medium text-sm ${
                      uploadingFiles[`${index}-images`]
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {uploadingFiles[`${index}-images`] ? 'アップロード中...' : '+ 画像を追加'}
                  </label>
                </div>
              </div>
            </div>

            {/* 動画セクション */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                動画 ({(actualFiles.steps[index]?.videos || []).length}件)
              </label>
              <div className="space-y-2">
                {(actualFiles.steps[index]?.videos || []).map((video, vidIndex) => (
                  <div key={vidIndex} className="border border-gray-200 rounded-md bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 font-medium">{video}</span>
                      <button
                        type="button"
                        onClick={() => onFileRemove(index, 'videos', vidIndex)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                      <video
                        controls
                        className="w-full h-full object-cover"
                        key={video}
                      >
                        <source
                          src={`/api/files?drawingNumber=${drawingNumber}&folderType=videos&subFolder=step_${String(index + 1).padStart(2, '0')}&fileName=${encodeURIComponent(video)}`}
                          type="video/mp4"
                        />
                        お使いのブラウザは動画をサポートしていません。
                      </video>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => onFileUpload(index, 'videos', e.target.files)}
                    className="hidden"
                    id={`video-upload-${index}`}
                  />
                  <label
                    htmlFor={`video-upload-${index}`}
                    className={`px-4 py-2 rounded-md cursor-pointer font-medium text-sm ${
                      uploadingFiles[`${index}-videos`]
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {uploadingFiles[`${index}-videos`] ? 'アップロード中...' : '+ 動画を追加'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ヒヤリハット事例エディタコンポーネント
interface NearMissEditorProps {
  item: NearMissItem
  index: number
  onChange: (index: number, field: keyof NearMissItem, value: string) => void
  onRemove: () => void
}

function NearMissEditor({ item, index, onChange, onRemove }: NearMissEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const severityOptions = ['low', 'medium', 'high', 'critical'] as const
  const severityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '危険'
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-left flex-1"
        >
          <span className="text-lg">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="font-medium text-gray-900">
            事例 {index + 1}: {item.title || '(未設定)'}
          </span>
        </button>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            item.severity === 'critical' 
              ? 'bg-red-100 text-red-800' 
              : item.severity === 'high'
              ? 'bg-orange-100 text-orange-800'
              : item.severity === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {severityLabels[item.severity]}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-500 hover:text-red-700"
            title="削除"
          >
            ×
          </button>
        </div>
      </div>

      {/* 詳細内容 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* タイトルと重要度 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => onChange(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="事例のタイトルを入力..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重要度 <span className="text-red-500">*</span>
              </label>
              <select
                value={item.severity}
                onChange={(e) => onChange(index, 'severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {severityOptions.map(severity => (
                  <option key={severity} value={severity}>
                    {severityLabels[severity]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={item.description}
              onChange={(e) => onChange(index, 'description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="どのような事例が発生したかを詳しく説明..."
            />
          </div>

          {/* 原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={item.cause}
              onChange={(e) => onChange(index, 'cause', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="事例が発生した原因を記入..."
            />
          </div>

          {/* 予防策 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予防策 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={item.prevention}
              onChange={(e) => onChange(index, 'prevention', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="再発防止のための対策を記入..."
            />
          </div>
        </div>
      )}
    </div>
  )
}