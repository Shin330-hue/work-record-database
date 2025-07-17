// src/app/admin/drawings/[id]/edit/page.tsx - 図番編集画面

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { loadWorkInstruction, loadSearchIndex, loadCompanies, loadContributions } from '@/lib/dataLoader'
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
}

export default function DrawingEdit() {
  const router = useRouter()
  const params = useParams()
  const drawingNumber = params.id as string

  const [formData, setFormData] = useState<EditFormData | null>(null)
  const [contributions, setContributions] = useState<ContributionFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 機械種別の選択肢（新規登録画面と統一）
  const machineTypes = ['マシニング', 'ターニング', '横中', 'ラジアル', 'フライス']

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
          keywords: searchItem.keywords || []
        }

        console.log('🎯 構築されたフォームデータ:', editData)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setSaving(true)
    setError('')

    try {
      const updateData = {
        ...formData,
        machineType: formData.machineType.join(','),
        keywords: formData.keywords.join(',')
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
        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* 追記管理セクション */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💬 追記情報 ({contributions?.contributions.length || 0}件)
            </h2>
            
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
                    
                    {(contribution.images?.length > 0 || contribution.videos?.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {contribution.images?.map((image, imgIndex) => (
                          <span key={imgIndex} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            📷 {image}
                          </span>
                        ))}
                        {contribution.videos?.map((video, vidIndex) => (
                          <span key={vidIndex} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            🎥 {video}
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