// src/app/page.tsx - 会社・部品カードの表示をシンプルに
'use client'
import { useEffect, useState } from 'react'
import { loadCompanies, loadSearchIndex, loadWorkInstruction, Company, WorkInstruction, SearchIndex, DrawingSearchItem } from '@/lib/dataLoader'
import ParticleBackground from '@/components/ParticleBackground'
import WorkInstructionResults from '@/components/WorkInstructionResults'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null)
  const [workInstruction, setWorkInstruction] = useState<WorkInstruction | null>(null)
  const [searchResults, setSearchResults] = useState<DrawingSearchItem[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [instructionLoading, setInstructionLoading] = useState(false)
  const [instructionError, setInstructionError] = useState<string | null>(null)

  useEffect(() => {
    // 会社データと検索インデックスを並行して読み込み
    Promise.all([
      loadCompanies(),
      loadSearchIndex()
    ])
      .then(([companiesData, searchIndexData]) => {
        setCompanies(companiesData)
        setSearchIndex(searchIndexData)
        setLoading(false)
      })
      .catch(() => {
        setError('データの読み込みに失敗しました')
        setLoading(false)
      })
  }, [])

  // 図番選択時に作業手順データをロード
  useEffect(() => {
    if (selectedDrawing) {
      console.log('🔍 図番選択:', selectedDrawing) // デバッグログ追加
      setInstructionLoading(true)
      setInstructionError(null)
      setWorkInstruction(null)
      setShowSearchResults(false)
      loadWorkInstruction(selectedDrawing)
        .then((data) => {
          console.log('✅ 作業手順データ読み込み成功:', data) // デバッグログ追加
          setWorkInstruction(data)
          setInstructionLoading(false)
        })
        .catch((error) => {
          console.error('❌ 作業手順データ読み込みエラー:', error) // デバッグログ追加
          setInstructionError(`作業手順データの読み込みに失敗しました: ${error.message}`)
          setInstructionLoading(false)
        })
    }
  }, [selectedDrawing])

  // 検索結果の処理
  const handleSearch = (results: DrawingSearchItem[]) => {
    setSearchResults(results)
    setShowSearchResults(results.length > 0)
  }

  // 検索結果から図番選択
  const handleSearchDrawingSelect = (drawingNumber: string) => {
    setSelectedDrawing(drawingNumber)
    setSelectedCompany(null)
    setSelectedCategory(null)
    setShowSearchResults(false)
  }

  // 関連図番クリック時の処理
  const handleRelatedDrawingClick = (drawingNumber: string) => {
    setSelectedDrawing(drawingNumber)
  }

  // 検索結果に戻る処理
  const handleBackToSearch = () => {
    setSelectedDrawing(null)
    setWorkInstruction(null)
    setShowSearchResults(true)
  }

  // 会社選択画面
  const renderCompanySelection = () => (
    <>
      <h1 className="text-4xl font-bold mb-8 text-center text-emerald-100 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">作業手順データベース</h1>
      {/* 検索バー */}
      {searchIndex && (
        <div className="search-bar-container w-full max-w-[600px]">
          <SearchBar
            searchIndex={searchIndex}
            onSearch={handleSearch}
            onDrawingSelect={handleSearchDrawingSelect}
            placeholder="図番を入力してください（例: ABC-001）"
          />
        </div>
      )}
      {/* 検索結果表示 */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-emerald-100">検索結果</h2>
          <div className="selection-grid">
            {searchResults.map((result, index) => (
              <button
                key={index}
                className="selection-card !items-start !text-left"
                onClick={() => handleSearchDrawingSelect(result.drawingNumber)}
              >
                <div className="icon" style={{fontSize:'1.6rem',marginBottom:8}}>🔍</div>
                <div className="title" style={{fontSize:'1.1rem'}}>{result.drawingNumber}</div>
                <div className="desc" style={{marginBottom:4}}>{result.title}</div>
                <div className="desc" style={{fontSize:'0.95rem',color:'#8ff'}}>{result.companyName} - {result.productName}</div>
                <div className="desc" style={{fontSize:'0.92rem',color:'#bff'}}>{result.estimatedTime}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-8 text-center text-emerald-100">会社を選択してください</h2>
      {loading && (
        <div className="text-center text-lg text-emerald-200 py-20">読み込み中...</div>
      )}
      {error && (
        <div className="text-center text-red-400 py-20">{error}</div>
      )}
      {!loading && !error && (
        <div className="selection-grid w-full">
          {companies.map((company) => (
            <button
              key={company.id}
              className="selection-card"
              onClick={() => setSelectedCompany(company)}
            >
              <div className="icon">🏢</div>
              <div className="title">{company.name}</div>
              <div className="desc">{company.description}</div>
            </button>
          ))}
        </div>
      )}
    </>
  )

  // カテゴリ選択画面
  const renderCategorySelection = () => {
    // 重複チェックしてユニークなカテゴリを抽出
    const categories = selectedCompany?.products.reduce((acc, product) => {
      if (!acc.includes(product.category)) {
        acc.push(product.category)
      }
      return acc
    }, [] as string[]) || []

    return (
      <>
        <button
          className="mb-6 px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 text-sm font-medium shadow-lg"
          onClick={() => setSelectedCompany(null)}
        >
          ← 会社一覧に戻る
        </button>
        <h2 className="text-2xl font-bold mb-8 text-center text-emerald-100">{selectedCompany?.name} のカテゴリを選択</h2>
        <div className="selection-grid w-full">
          {categories.map((category) => (
            <button
              key={category}
              className="selection-card"
              onClick={() => setSelectedCategory(category)}
            >
              <div className="icon">📂</div>
              <div className="title">{category}</div>
              <div className="desc">カテゴリ</div>
            </button>
          ))}
        </div>
      </>
    )
  }

  // 図番選択画面（カテゴリ別）
  const renderDrawingSelection = () => {
    // 選択されたカテゴリの製品をフィルタリング
    const categoryProducts = selectedCompany?.products.filter(
      product => product.category === selectedCategory
    ) || []

    return (
      <>
        <button
          className="mb-6 px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 text-sm font-medium shadow-lg"
          onClick={() => setSelectedCategory(null)}
        >
          ← {selectedCompany?.name} のカテゴリ一覧に戻る
        </button>
        <h2 className="text-2xl font-bold mb-8 text-center text-emerald-100">{selectedCategory} の図番を選択</h2>
        <div className="selection-grid w-full">
          {categoryProducts.map((product) => 
            product.drawings.map((drawingNumber) => (
              <button
                key={drawingNumber}
                className="selection-card"
                onClick={() => setSelectedDrawing(drawingNumber)}
              >
                <div className="icon">📄</div>
                <div className="title">{drawingNumber}</div>
                <div className="desc">{product.name}</div>
              </button>
            ))
          )}
        </div>
      </>
    )
  }

  // 作業手順（詳細表示）画面
  const renderWorkInstruction = () => (
    <>
      {workInstruction && (
        <WorkInstructionResults
          instruction={workInstruction}
          onBack={handleBackToSearch}
          onRelatedDrawingClick={handleRelatedDrawingClick}
        />
      )}
      {instructionLoading && (
        <div className="text-center text-lg text-gray-400 py-20">読み込み中...</div>
      )}
      {instructionError && (
        <div className="text-center text-red-400 py-20">{instructionError}</div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ParticleBackground />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen">
          {!selectedCompany && !selectedCategory && !selectedDrawing && renderCompanySelection()}
          {selectedCompany && !selectedCategory && !selectedDrawing && renderCategorySelection()}
          {selectedCompany && selectedCategory && !selectedDrawing && renderDrawingSelection()}
          {selectedDrawing && renderWorkInstruction()}
        </div>
      </div>
    </div>
  )
}