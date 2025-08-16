// src/app/admin/drawings/[id]/edit/page.tsx - 図番編集画面

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { loadWorkInstruction, loadSearchIndex, loadCompanies, loadContributions, WorkStep, NearMissItem } from '@/lib/dataLoader'
import { ContributionFile } from '@/types/contribution'
import { ImageLightbox } from '@/components/ImageLightbox'
import { getStepFolderName } from '@/lib/machineTypeUtils'
import BasicInfoTab from '@/components/admin/BasicInfoTab'
import QualityTab from '@/components/admin/QualityTab'
import MachineTypeTab from '@/components/admin/MachineTypeTab'
import ContributionsTab from '@/components/admin/ContributionsTab'
import RelatedTab from '@/components/admin/RelatedTab'
import { useEditFormHandlers } from '@/hooks/useEditFormHandlers'

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
    description: string
    warnings: string[]
    preparationTime: string
    processingTime: string
  }
  workSteps: WorkStep[]
  workStepsByMachine?: {
    machining?: WorkStep[]
    turning?: WorkStep[]
    yokonaka?: WorkStep[]
    radial?: WorkStep[]
    other?: WorkStep[]
  }
  nearMiss: NearMissItem[]
  relatedDrawings: Array<{
    drawingNumber: string
    relation: string
    description: string
  }>
}

type TabType = 'basic' | 'workSteps' | 'quality' | 'related' | 'contributions' | 'workStepsWithContributions' | 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other'

export default function DrawingEdit() {
  const params = useParams()
  const drawingNumber = params.id as string

  const [formData, setFormData] = useState<EditFormData | null>(null)
  const [contributions, setContributions] = useState<ContributionFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [uploadingFiles] = useState<{[key: string]: boolean}>({})
  const [actualFiles, setActualFiles] = useState<{
    overview: { images: string[], videos: string[], pdfs: string[], programs: string[] },
    steps: { [key: string]: { images: string[], videos: string[] } }, // 後方互換性のため残す
    stepsByMachine?: {  // 機械種別ごとのステップファイル
      machining?: { images: string[], videos: string[] }[],
      turning?: { images: string[], videos: string[] }[],
      yokonaka?: { images: string[], videos: string[] }[],
      radial?: { images: string[], videos: string[] }[],
      other?: { images: string[], videos: string[] }[]
    }
  }>({
    overview: { images: [], videos: [], pdfs: [], programs: [] },
    steps: {},
    stepsByMachine: {}
  })
  // 削除予定ファイルの管理
  const [deletedFiles, setDeletedFiles] = useState<{
    fileName: string
    stepNumber: string
    fileType: string
    machineType?: string  // 機械種別を追加
  }[]>([])
  // アップロード予定ファイルの管理
  const [pendingUploads, setPendingUploads] = useState<{
    file: File
    stepNumber: string
    fileType: string
    machineType?: string  // 機械種別を追加
    previewUrl?: string
  }[]>([])
  // ライトボックス用の状態
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 機械種別の選択肢（新規登録画面と統一）
  const machineTypes = ['マシニング', 'ターニング', '横中', 'ラジアル', 'フライス']

  // 共通ハンドラーの初期化
  const {
    handleMachineTypeChange,
    handleKeywordsChange,
    handleToolsRequiredChange,
    handleWarningChange,
    addWarning,
    removeWarning,
    addWorkStep,
    updateWorkStep,
    deleteWorkStep,
    moveWorkStep,
    handleNearMissChange,
    addNearMiss,
    removeNearMiss
  } = useEditFormHandlers(formData, setFormData)

  // 機械種別ごとの工程数と追記数を計算
  // 機械種別ごとの工程数を計算（将来的な使用のため保持）
  // const getStepCountByMachine = (machine: 'machining' | 'turning' | 'radial' | 'other'): number => {
  //   if (formData?.workStepsByMachine && formData.workStepsByMachine[machine]) {
  //     return formData.workStepsByMachine[machine]!.length
  //   }
  //   // 後方互換性: workStepsByMachineがない場合は、既存のworkStepsをマシニングとして扱う
  //   return machine === 'machining' ? (formData?.workSteps?.length || 0) : 0
  // }

  const getContributionCount = (): number => {
    if (!contributions?.contributions) return 0
    return contributions.contributions.filter(c => c.status === 'active').length
  }

  // タブ定義
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'basic', label: '基本情報', icon: '📋' },
    { id: 'quality', label: 'ヒヤリハット', icon: '⚠️' },
    { id: 'machining', label: `マシニング・追記【${getContributionCount()}件】`, icon: '🔧' },
    { id: 'turning', label: `ターニング・追記【${getContributionCount()}件】`, icon: '🔧' },
    { id: 'yokonaka', label: `横中・追記【${getContributionCount()}件】`, icon: '🔧' },
    { id: 'radial', label: `ラジアル・追記【${getContributionCount()}件】`, icon: '🔧' },
    { id: 'other', label: `その他・追記【${getContributionCount()}件】`, icon: '🔧' },
    { id: 'related', label: '関連情報', icon: '🔗' }
  ]

  // データ読み込み関数を外部に定義
  const loadEditData = async () => {
    try {
      if (!drawingNumber) {
        setError('図番が指定されていません')
        return
      }

      setLoading(true)
      setError('')

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
            description: workInstruction.overview.description || '',
            warnings: workInstruction.overview.warnings || [],
            preparationTime: workInstruction.overview.preparationTime?.replace('分', '') || '30',
            processingTime: workInstruction.overview.processingTime?.replace('分', '') || '60'
          },
          workSteps: workInstruction.workSteps?.map(step => ({
            ...step,
            images: step.images || [],
            videos: step.videos || []
          })) || [],
          workStepsByMachine: workInstruction.workStepsByMachine || {
            machining: workInstruction.workSteps || [],  // 後方互換性
            turning: [],
            yokonaka: [],
            radial: [],
            other: []
          },
          nearMiss: workInstruction.nearMiss || [],
          relatedDrawings: workInstruction.relatedDrawings || []
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

  // 初回読み込み用のuseEffect
  useEffect(() => {
    loadEditData()
  }, [drawingNumber])

  // formDataが設定されたらファイル一覧を取得
  useEffect(() => {
    if (formData && drawingNumber) {
      loadActualFiles(drawingNumber)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Overview PDFを取得
      const overviewPdfsRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=pdfs&subFolder=overview`)
      const overviewPdfsData = await overviewPdfsRes.json()
      
      // Overview プログラムファイルを取得
      const overviewProgramsRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=programs&subFolder=overview`)
      const overviewProgramsData = await overviewProgramsRes.json()

      const newActualFiles: typeof actualFiles = {
        overview: {
          images: overviewImagesData.data?.files || overviewImagesData.files || [],
          videos: overviewVideosData.data?.files || overviewVideosData.files || [],
          pdfs: overviewPdfsData.data?.files || overviewPdfsData.files || [],
          programs: overviewProgramsData.data?.files || overviewProgramsData.files || []
        },
        steps: {},
        stepsByMachine: {}  // 機械種別ごとのファイル
      }

      // 各ステップのファイルを取得（機械種別ごとに）
      if (formData) {
        // 機械種別ごとにファイルを取得
        const machineTypes = [
          { key: 'machining', name: 'マシニング' },
          { key: 'turning', name: 'ターニング' },
          { key: 'yokonaka', name: '横中' },
          { key: 'radial', name: 'ラジアル' },
          { key: 'other', name: 'その他' }
        ]
        
        for (const machineType of machineTypes) {
          const machineKey = machineType.key as 'machining' | 'turning' | 'yokonaka' | 'radial' | 'other'
          const steps = formData.workStepsByMachine?.[machineKey] || []
          
          if (steps.length > 0) {
            const stepFiles: { images: string[], videos: string[] }[] = []
            
            for (let i = 0; i < steps.length; i++) {
              const folderName = getStepFolderName(i + 1, machineType.name)
              
              // ステップ画像を取得
              const stepImagesRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=${folderName}`)
              const stepImagesData = await stepImagesRes.json()
              
              // ステップ動画を取得
              const stepVideosRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=videos&subFolder=${folderName}`)
              const stepVideosData = await stepVideosRes.json()

              // 機械種別ごとの配列に追加
              stepFiles.push({
                images: stepImagesData.data?.files || stepImagesData.files || [],
                videos: stepVideosData.data?.files || stepVideosData.files || []
              })
            }
            
            // 機械種別ごとの配列を設定
            if (newActualFiles.stepsByMachine) {
              newActualFiles.stepsByMachine[machineKey] = stepFiles
            }
          }
        }
        
        // 旧形式のworkSteps（後方互換性）
        if (formData.workSteps && formData.workSteps.length > 0) {
          for (let i = 0; i < formData.workSteps.length; i++) {
            const stepNum = String(i + 1).padStart(2, '0')
            
            // ステップ画像を取得
            const stepImagesRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=step_${stepNum}`)
            const stepImagesData = await stepImagesRes.json()
            
            // ステップ動画を取得
            const stepVideosRes = await fetch(`/api/files?drawingNumber=${drawingNumber}&folderType=videos&subFolder=step_${stepNum}`)
            const stepVideosData = await stepVideosRes.json()

            newActualFiles.steps[`step_${(i + 1).toString().padStart(2, '0')}`] = {
              images: stepImagesData.data?.files || stepImagesData.files || [],
              videos: stepVideosData.data?.files || stepVideosData.files || []
            }
          }
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
        workStepsByMachine: formData.workStepsByMachine,
        nearMiss: formData.nearMiss,
        relatedDrawings: formData.relatedDrawings
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
        // 削除予定ファイルを実際に削除
        if (deletedFiles.length > 0) {
          console.log(`📁 削除予定ファイル: ${deletedFiles.length}件`)
          
          for (const file of deletedFiles) {
            try {
              const deleteResponse = await fetch(`/api/admin/drawings/${drawingNumber}/files`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  fileName: file.fileName,
                  stepNumber: file.stepNumber,
                  fileType: file.fileType,
                  machineType: file.machineType  // 機械種別を追加
                })
              })
              
              if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json()
                console.error(`ファイル削除エラー: ${file.fileName}`, errorData)
              } else {
                console.log(`✅ ファイル削除成功: ${file.fileName}`)
              }
            } catch (error) {
              console.error(`ファイル削除失敗: ${file.fileName}`, error)
            }
          }
          
          // 削除予定リストをクリア
          setDeletedFiles([])
        }
        
        // アップロード予定ファイルを実際にアップロード
        if (pendingUploads.length > 0) {
          console.log(`📁 アップロード予定ファイル: ${pendingUploads.length}件`)
          
          for (const upload of pendingUploads) {
            const formDataUpload = new FormData()
            formDataUpload.append('file', upload.file)
            formDataUpload.append('stepNumber', upload.stepNumber)
            formDataUpload.append('fileType', upload.fileType)
            if (upload.machineType) {
              formDataUpload.append('machineType', upload.machineType)
            }
            
            try {
              const uploadResponse = await fetch(`/api/admin/drawings/${drawingNumber}/files`, {
                method: 'POST',
                body: formDataUpload
              })
              
              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json()
                console.error(`ファイルアップロードエラー: ${upload.file.name}`, errorData)
              } else {
                console.log(`✅ ファイルアップロード成功: ${upload.file.name}`)
              }
            } catch (error) {
              console.error(`ファイルアップロード失敗: ${upload.file.name}`, error)
            }
            
            // プレビューURLのクリーンアップ
            if (upload.previewUrl) {
              URL.revokeObjectURL(upload.previewUrl)
            }
          }
          
          // アップロード予定リストをクリア
          setPendingUploads([])
        }
        
        alert('図番情報が正常に更新されました')
        // データを再読み込みして編集画面に留まる
        await loadEditData()
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


  // ファイル操作ハンドラー

  // PDF・プログラムファイルの削除処理

  // 概要画像操作ハンドラー
  const handleOverviewImageUpload = async (files: FileList | null) => {
    if (!files || !formData) return

    // アップロード予定に追加（実際のアップロードは更新時）
    const newPendingUploads: typeof pendingUploads = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const previewUrl = URL.createObjectURL(file)
      
      newPendingUploads.push({
        file,
        stepNumber: '0',  // overview用
        fileType: 'images',
        previewUrl
      })
    }

    setPendingUploads(prev => [...prev, ...newPendingUploads])

    // プレビュー用にactualFilesに仮追加
    const previewFileNames = newPendingUploads
      .filter(upload => upload.previewUrl)
      .map(upload => upload.previewUrl!)

    setActualFiles(prev => ({
      ...prev,
      overview: {
        ...prev.overview,
        images: [...prev.overview.images, ...previewFileNames]
      }
    }))
  }

  const removeOverviewImage = async (imageIndex: number) => {
    if (!actualFiles.overview.images[imageIndex]) return

    const fileName = actualFiles.overview.images[imageIndex]
    
    if (!confirm(`${fileName} を削除しますか？（更新ボタンを押すまで実際には削除されません）`)) return

    // 削除予定リストに追加
    setDeletedFiles(prev => [...prev, {
      fileName,
      stepNumber: '0',
      fileType: 'images'
    }])

    // UIから削除（実際の削除は更新時）
    setActualFiles(prev => ({
      ...prev,
      overview: {
        ...prev.overview,
        images: prev.overview.images.filter((_, i) => i !== imageIndex)
      }
    }))
  }

  // テキストをクリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('コピーに失敗しました:', err)
    }
  }

  // 追記管理ハンドラー
  const handleMergeContribution = async (contributionIndex: number) => {
    if (!contributions) return

    const targetContribution = contributions.contributions[contributionIndex]
    if (!targetContribution) return

    try {
      const response = await fetch(`/api/admin/contributions/${drawingNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateStatus',
          contributionId: targetContribution.id,
          status: 'merged'
        }),
      })

      if (response.ok) {
        // ローカル状態更新
        setContributions(prev => {
          if (!prev) return prev
          const updatedContributions = [...prev.contributions]
          updatedContributions[contributionIndex] = {
            ...updatedContributions[contributionIndex],
            status: 'merged'
          }
          return {
            ...prev,
            contributions: updatedContributions,
            metadata: {
              ...prev.metadata,
              mergedCount: updatedContributions.filter(c => c.status === 'merged').length
            }
          }
        })
        alert('追記情報から消しました')
      } else {
        throw new Error('ステータス更新に失敗しました')
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error)
      alert('ステータス更新処理に失敗しました')
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
    <div className={activeTab === 'workStepsWithContributions' ? "bg-gray-50" : "min-h-screen bg-gray-50"}>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white text-center flex-1">
            【図番編集】 {formData.drawingNumber}
          </h1>
          <div className="flex space-x-4">
            <Link
              href="/admin/drawings/list"
              className="custom-rect-button gray small"
            >
              <span>図番一覧検索</span>
            </Link>
            <Link
              href="/admin/contributions"
              className="custom-rect-button emerald small"
            >
              <span>追記管理</span>
            </Link>
          </div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`custom-rect-button small ${
                    activeTab === tab.id ? 'emerald' : 'gray'
                  }`}
                >
                  <span>
                    {tab.icon} {tab.label}
                    {tab.id === 'workStepsWithContributions' && contributions && contributions.contributions.filter(c => c.status === 'active').length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        【{contributions.contributions.filter(c => c.status === 'active').length}件】
                      </span>
                    )}
                  </span>
                </button>
              ))}
              </nav>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報タブ */}
          {activeTab === 'basic' && (
            <BasicInfoTab
              formData={formData}
              setFormData={setFormData}
              companies={companies}
              machineTypes={machineTypes}
              handleMachineTypeChange={handleMachineTypeChange}
              handleKeywordsChange={handleKeywordsChange}
              handleToolsRequiredChange={handleToolsRequiredChange}
              handleWarningChange={handleWarningChange}
              addWarning={addWarning}
              removeWarning={removeWarning}
              pendingUploads={pendingUploads}
              handleOverviewImageUpload={handleOverviewImageUpload}
              removeOverviewImage={removeOverviewImage}
              actualFiles={actualFiles}
              onImageClick={(images, index) => {
                setCurrentImages(images)
                setCurrentImageIndex(index)
                setLightboxOpen(true)
              }}
              drawingNumber={drawingNumber as string}
            />
          )}

          {/* ヒヤリハットタブ */}
          {activeTab === 'quality' && (
            <QualityTab
              formData={formData}
              handleNearMissChange={handleNearMissChange}
              addNearMiss={addNearMiss}
              removeNearMiss={removeNearMiss}
            />
          )}

          {/* 機械種別タブ */}
          {(['machining', 'turning', 'yokonaka', 'radial', 'other'] as const).includes(activeTab) && (
            <MachineTypeTab
              machineType={activeTab}
              machineTypeName={
                activeTab === 'machining' ? 'マシニング' :
                activeTab === 'turning' ? 'ターニング' :
                activeTab === 'yokonaka' ? '横中' :
                activeTab === 'radial' ? 'ラジアル' : 'その他'
              }
              formData={formData}
              addWorkStep={addWorkStep}
              updateWorkStep={updateWorkStep}
              deleteWorkStep={deleteWorkStep}
              moveWorkStep={moveWorkStep}
              uploadingFiles={uploadingFiles}
              onFileUpload={onFileUpload}
              onFileRemove={onFileRemove}
              actualFiles={actualFiles}
              onImageClick={onImageClick}
              drawingNumber={params.id}
            />
          )}

          {/* 関連情報タブ */}
          {activeTab === 'related' && (
            <RelatedTab
              relatedDrawings={formData.relatedDrawings}
              onAddRelatedDrawing={() => {
                setFormData(prev => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    relatedDrawings: [...prev.relatedDrawings, {
                      drawingNumber: '',
                      relation: '関連図番',
                      description: ''
                    }]
                  }
                })
              }}
              onRemoveRelatedDrawing={(index) => {
                setFormData(prev => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    relatedDrawings: prev.relatedDrawings.filter((_, i) => i !== index)
                  }
                })
              }}
              onUpdateRelatedDrawing={(index, field, value) => {
                const newRelatedDrawings = [...formData.relatedDrawings]
                newRelatedDrawings[index] = {
                  ...newRelatedDrawings[index],
                  [field]: value
                }
                setFormData(prev => prev ? {
                  ...prev,
                  relatedDrawings: newRelatedDrawings
                } : prev)
              }}
            />
          )}

          {/* 追記情報タブ */}
          {activeTab === 'contributions' && (
            <ContributionsTab
              contributions={contributions}
              drawingNumber={drawingNumber}
              copyToClipboard={copyToClipboard}
              handleMergeContribution={handleMergeContribution}
              setCurrentImages={setCurrentImages}
              setCurrentImageIndex={setCurrentImageIndex}
              setLightboxOpen={setLightboxOpen}
            />
          )}

          {/* エラー表示（統合タブ以外で表示） */}
          {error && activeTab !== 'workStepsWithContributions' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* 操作ボタン（統合タブ以外で表示） */}
          {activeTab !== 'workStepsWithContributions' && (
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/drawings/list"
                className="custom-rect-button gray"
              >
                <span>キャンセル</span>
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="custom-rect-button blue"
              >
                <span>{saving ? '更新中...' : '更新する'}</span>
              </button>
            </div>
          )}
        </form>
      </main>

      {/* 画像ライトボックス */}
      <ImageLightbox
        images={currentImages}
        isOpen={lightboxOpen}
        currentIndex={currentImageIndex}
        onClose={() => setLightboxOpen(false)}
        altText="管理画面画像"
      />
    </div>
  )
}

