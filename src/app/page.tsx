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
      .catch((e) => {
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
  }

  // 関連図番クリック時の処理
  const handleRelatedDrawingClick = (drawingNumber: string) => {
    setSelectedDrawing(drawingNumber)
  }

  // 会社選択画面
  const renderCompanySelection = () => (
    <>
      <h1 className="text-3xl font-bold mb-8 text-center">{t('title')}</h1>
      
      {/* 検索バー */}
      {searchIndex && (
        <div className="mb-8">
          <SearchBar
            searchIndex={searchIndex}
            onSearch={handleSearch}
            onDrawingSelect={handleSearchDrawingSelect}
          />
        </div>
      )}

      {/* 検索結果表示 */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('searchResults')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result, index) => (
              <button
                key={index}
                className="bg-white bg-opacity-5 rounded-lg p-4 border border-white/10 hover:bg-opacity-10 transition-all text-left"
                onClick={() => handleSearchDrawingSelect(result.drawingNumber)}
              >
                <div className="font-mono text-yellow-400 text-lg mb-1">
                  {result.drawingNumber}
                </div>
                <div className="text-white text-sm mb-1">
                  {result.title}
                </div>
                <div className="text-gray-400 text-xs">
                  {result.companyName} - {result.productName}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {result.difficulty} • {result.estimatedTime}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-8 text-center">{t('selectCompany')}</h2>
      {loading && (
        <div className="text-center text-lg text-gray-400 py-20">{t('loading')}</div>
      )}
      {error && (
        <div className="text-center text-red-400 py-20">{error}</div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {companies.map((company) => (
            <button
              key={company.id}
              className="bg-white bg-opacity-5 rounded-xl p-8 shadow hover:shadow-lg transition border border-white/10 text-center w-full focus:outline-none"
              onClick={() => setSelectedCompany(company)}
            >
              <div className="text-xl font-semibold">{company.name}</div>
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
        className="mb-6 px-4 py-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20 text-sm text-gray-200"
        onClick={() => setSelectedCompany(null)}
      >
        ← {t('backToCompanies')}
      </button>
      <h2 className="text-2xl font-bold mb-8 text-center">{selectedCompany?.name} の部品を選択</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {selectedCompany?.products.map((product) => (
          <button
            key={product.id}
            className="bg-white bg-opacity-5 rounded-xl p-8 shadow border border-white/10 text-center w-full focus:outline-none"
            onClick={() => setSelectedProduct(product)}
          >
            <div className="text-lg font-semibold">{product.name}</div>
          </button>
        ))}
      </div>
    </>
  )

  // 図番選択画面
  const renderDrawingSelection = () => (
    <>
      <button
        className="mb-6 px-4 py-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20 text-sm text-gray-200"
        onClick={() => setSelectedProduct(null)}
      >
        ← {selectedCompany?.name} の部品一覧に戻る
      </button>
      <h2 className="text-2xl font-bold mb-8 text-center">{selectedProduct?.name} の図番を選択</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {selectedProduct?.drawings.map((drawingNumber) => (
          <button
            key={drawingNumber}
            className="bg-white bg-opacity-5 rounded-xl p-8 shadow border border-white/10 text-center w-full focus:outline-none"
            onClick={() => setSelectedDrawing(drawingNumber)}
          >
            <div className="text-lg font-semibold">{drawingNumber}</div>
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
          onBack={() => setSelectedDrawing(null)}
          onRelatedDrawingClick={handleRelatedDrawingClick}
        />
      )}
    </>
  )

  let content
  if (!selectedCompany) {
    content = renderCompanySelection()
  } else if (!selectedProduct) {
    content = renderProductSelection()
  } else if (!selectedDrawing) {
    content = renderDrawingSelection()
  } else {
    content = renderWorkInstruction()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative">
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