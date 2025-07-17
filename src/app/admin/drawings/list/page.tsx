// src/app/admin/drawings/list/page.tsx - 図番一覧管理画面

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadSearchIndex, loadContributions } from '@/lib/dataLoader'

interface DrawingWithContributions {
  drawingNumber: string
  title: string
  companyName: string
  productName: string
  category: string
  difficulty: string
  estimatedTime: string
  machineType: string
  contributionsCount: number
  latestContributionDate?: string
  mergedContributionsCount: number
  pendingContributionsCount: number
}

export default function DrawingsList() {
  const [allDrawings, setAllDrawings] = useState<DrawingWithContributions[]>([])
  const [filteredDrawings, setFilteredDrawings] = useState<DrawingWithContributions[]>([])
  const [loading, setLoading] = useState(false) // 初期状態はロード中ではない
  const [searching, setSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasSearched, setHasSearched] = useState(false) // 検索実行済みフラグ
  const itemsPerPage = 50

  // 初回のデータ読み込み（会社リスト用のみ）
  useEffect(() => {
    const loadBasicData = async () => {
      try {
        setLoading(true)
        const searchIndex = await loadSearchIndex()
        setAllDrawings(searchIndex.drawings.map(drawing => ({
          drawingNumber: drawing.drawingNumber,
          title: drawing.title,
          companyName: drawing.companyName,
          productName: drawing.productName,
          category: drawing.category,
          difficulty: drawing.difficulty,
          estimatedTime: drawing.estimatedTime,
          machineType: drawing.machineType,
          contributionsCount: 0,
          latestContributionDate: undefined,
          mergedContributionsCount: 0,
          pendingContributionsCount: 0
        })))
      } catch (error) {
        console.error('基本データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBasicData()
  }, [])

  // 検索実行関数
  const executeSearch = async () => {
    // 図番・製品名が空の場合でも、「全ての会社」での検索は許可
    if (!searchTerm.trim() && !companyFilter) {
      // 両方とも未指定の場合は全件検索として扱う
      // または条件を指定するよう促す
      const shouldProceed = confirm('検索条件が未指定です。全ての図番を表示しますか？')
      if (!shouldProceed) return
    }

    setSearching(true)
    try {
      // 検索条件に基づいてフィルタリング
      let filtered = allDrawings

      if (searchTerm) {
        filtered = filtered.filter(drawing =>
          drawing.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drawing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          drawing.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (companyFilter) {
        filtered = filtered.filter(drawing => drawing.companyName === companyFilter)
      }

      // フィルタされた図番の追記情報を並列取得
      const drawingsWithContributions = await Promise.all(
        filtered.map(async (drawing) => {
          let contributionsCount = 0
          let latestContributionDate: string | undefined
          let mergedCount = 0
          let pendingCount = 0

          try {
            const contributionData = await loadContributions(drawing.drawingNumber)
            contributionsCount = contributionData.contributions.length
            
            if (contributionData.contributions.length > 0) {
              const sortedContributions = contributionData.contributions
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              
              latestContributionDate = sortedContributions[0].timestamp
              pendingCount = contributionData.contributions.length
              mergedCount = 0
            }
          } catch (error) {
            console.warn(`追記データ取得エラー (${drawing.drawingNumber}):`, error)
          }

          return {
            ...drawing,
            contributionsCount,
            latestContributionDate,
            mergedContributionsCount: mergedCount,
            pendingContributionsCount: pendingCount
          }
        })
      )

      setFilteredDrawings(drawingsWithContributions)
      setHasSearched(true)
      setCurrentPage(1)
    } catch (error) {
      console.error('検索エラー:', error)
      alert('検索中にエラーが発生しました')
    } finally {
      setSearching(false)
    }
  }

  // Enterキーで検索実行
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch()
    }
  }

  // ページネーション
  const totalPages = Math.ceil(filteredDrawings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentDrawings = filteredDrawings.slice(startIndex, startIndex + itemsPerPage)

  // ユニークな会社一覧
  const companies = Array.from(new Set(allDrawings.map(d => d.companyName)))

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">図番データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  // メインコンテンツのレンダリング
  const renderContent = () => {
    if (!hasSearched) {
      // 検索前の状態
      return (
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-gray-500">
            <h3 className="text-base font-medium text-gray-900 mb-2">検索条件を指定してください</h3>
            <p className="text-sm text-gray-600">図番・製品名または会社を選択して検索ボタンを押してください。<br />Enterキーでも検索できます。</p>
          </div>
        </div>
      )
    }

    if (filteredDrawings.length === 0) {
      // 検索結果が0件の場合
      return (
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-gray-500">
            <h3 className="text-base font-medium text-gray-900 mb-2">検索結果が見つかりませんでした</h3>
            <p className="text-sm text-gray-600">別の検索条件で再度お試しください。</p>
          </div>
        </div>
      )
    }

    // 検索結果がある場合のテーブル表示
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  図番
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  会社・製品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  難易度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  機械種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  追記情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentDrawings.map((drawing) => (
                <tr key={drawing.drawingNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {drawing.drawingNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {drawing.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {drawing.companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {drawing.category} - {drawing.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      drawing.difficulty === '初級' ? 'bg-green-100 text-green-800' :
                      drawing.difficulty === '中級' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {drawing.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {drawing.estimatedTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-32 truncate" title={drawing.machineType}>
                      {drawing.machineType.split(',').map(type => type.trim()).join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {drawing.contributionsCount > 0 ? (
                        <div>
                          <span className="font-medium">{drawing.contributionsCount}件</span>
                          <div className="text-xs text-gray-500">
                            {drawing.pendingContributionsCount > 0 && (
                              <span className="text-orange-600">未処理{drawing.pendingContributionsCount}</span>
                            )}
                            {drawing.mergedContributionsCount > 0 && (
                              <span className="text-green-600 ml-1">併合済{drawing.mergedContributionsCount}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            最新: {formatDate(drawing.latestContributionDate)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/instruction/${drawing.drawingNumber}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      表示
                    </Link>
                    <Link
                      href={`/admin/drawings/${drawing.drawingNumber}/edit`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                前へ
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                次へ
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span>
                  {' - '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredDrawings.length)}</span>
                  {' / '}
                  <span className="font-medium">{filteredDrawings.length}</span>
                  件を表示
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    前へ
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    次へ
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              図番一覧管理
            </h1>
            <div className="flex space-x-4">
              <Link 
                href="/admin/drawings/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                📋 新規図番登録
              </Link>
              <Link 
                href="/admin" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← 管理画面に戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルタエリア */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                図番・製品名検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="図番または製品名を入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={searching}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会社フィルタ
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={searching}
              >
                <option value="">すべての会社</option>
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={executeSearch}
                disabled={searching}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {searching ? '検索中...' : '🔍 検索実行'}
              </button>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {hasSearched ? (
                  <>
                    {filteredDrawings.length}件 / 全{allDrawings.length}件
                  </>
                ) : (
                  <>
                    全{allDrawings.length}件（検索してください）
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 図番一覧テーブル */}
        {renderContent()}
      </main>
    </div>
  )
}