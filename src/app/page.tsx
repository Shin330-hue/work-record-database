// src/app/page.tsx - 会社・部品カードの表示をシンプルに
'use client'
import { useEffect, useState } from 'react'
import { loadCompanies, loadSearchIndex, loadWorkInstruction, Company, Product, WorkInstruction, SearchIndex, DrawingSearchItem } from '@/lib/dataLoader'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSelector from '@/components/LanguageSelector'
import ParticleBackground from '@/components/ParticleBackground'
import WorkInstructionResults from '@/components/WorkInstructionResults'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  const { t } = useTranslation()
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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
      setInstructionLoading(true)
      setInstructionError(null)
      setWorkInstruction(null)
      setShowSearchResults(false)
      loadWorkInstruction(selectedDrawing)
        .then((data) => {
          setWorkInstruction(data)
          setInstructionLoading(false)
        })
        .catch(() => {
          setInstructionError('作業手順データの読み込みに失敗しました')
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
    setSelectedProduct(null)
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
      <h1 className="text-4xl font-bold mb-8 text-center text-emerald-100 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">{t('title')}</h1>
      {/* 検索バー */}
      {searchIndex && (
        <div className="search-bar-container w-full max-w-[600px]">
          <SearchBar
            searchIndex={searchIndex}
            onSearch={handleSearch}
            onDrawingSelect={handleSearchDrawingSelect}
            placeholder={t('searchPlaceholder')}
          />
        </div>
      )}
      {/* 検索結果表示 */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-emerald-100">{t('searchResults')}</h2>
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
                <div className="desc" style={{fontSize:'0.92rem',color:'#bff'}}>{result.difficulty}・{result.estimatedTime}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-8 text-center text-emerald-100">{t('selectCompany')}</h2>
      {loading && (
        <div className="text-center text-lg text-emerald-200 py-20">{t('loading')}</div>
      )}
      {error && (
        <div className="text-center text-red-400 py-20">{error}</div>
      )}
      {!loading && !error && (
        <div className="selection-grid">
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

  // 部品選択画面
  const renderProductSelection = () => (
    <>
      <button
        className="mb-6 px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 text-sm font-medium shadow-lg"
        onClick={() => setSelectedCompany(null)}
      >
        ← {t('backToCompanies')}
      </button>
      <h2 className="text-2xl font-bold mb-8 text-center text-emerald-100">{selectedCompany?.name} の部品を選択</h2>
      <div className="selection-grid">
        {selectedCompany?.products.map((product) => (
          <button
            key={product.id}
            className="selection-card"
            onClick={() => setSelectedProduct(product)}
          >
            <div className="icon">🧩</div>
            <div className="title">{product.name}</div>
            <div className="desc">{product.description}</div>
          </button>
        ))}
      </div>
    </>
  )

  // 図番選択画面
  const renderDrawingSelection = () => (
    <>
      <button
        className="mb-6 px-6 py-3 bg-emerald-600/20 backdrop-blur-md text-emerald-100 rounded-xl hover:bg-emerald-500/30 transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/50 text-sm font-medium shadow-lg"
        onClick={() => setSelectedProduct(null)}
      >
        ← {selectedCompany?.name} の部品一覧に戻る
      </button>
      <h2 className="text-2xl font-bold mb-8 text-center text-emerald-100">{selectedProduct?.name} の図番を選択</h2>
      <div className="selection-grid">
        {selectedProduct?.drawings.map((drawingNumber) => (
          <button
            key={drawingNumber}
            className="selection-card"
            onClick={() => setSelectedDrawing(drawingNumber)}
          >
            <div className="icon">📄</div>
            <div className="title">{drawingNumber}</div>
          </button>
        ))}
      </div>
    </>
  )

  // 作業手順（詳細表示）画面
  const renderWorkInstruction = () => (
    <>
      {instructionLoading && (
        <div className="text-center text-lg text-gray-400 py-20">{t('loading')}</div>
      )}
      {instructionError && (
        <div className="text-center text-red-400 py-20">{instructionError}</div>
      )}
      {workInstruction && (
        <WorkInstructionResults 
          instruction={workInstruction}
          onBack={showSearchResults ? handleBackToSearch : () => setSelectedDrawing(null)}
          onRelatedDrawingClick={handleRelatedDrawingClick}
        />
      )}
    </>
  )

  let content
  if (selectedDrawing && workInstruction) {
    // 詳細手順が表示されている場合
    content = renderWorkInstruction()
  } else if (!selectedCompany) {
    // 会社選択画面
    content = renderCompanySelection()
  } else if (!selectedProduct) {
    // 部品選択画面
    content = renderProductSelection()
  } else if (!selectedDrawing) {
    // 図番選択画面
    content = renderDrawingSelection()
  } else {
    // 詳細手順読み込み中
    content = renderWorkInstruction()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 text-white relative">
      <div className="absolute inset-0 z-0">
        <ParticleBackground />
      </div>
      <div className="container mx-auto px-4 py-16 relative z-10">
        <LanguageSelector />
        {content}
      </div>
    </main>
  )
}