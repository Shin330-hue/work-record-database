// src/app/page.tsx - 会社選択画面と検索機能のみ
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadCompanies, loadSearchIndex, Company, SearchIndex, DrawingSearchItem } from '@/lib/dataLoader'
import SearchBar from '@/components/SearchBar'

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null)
  const [searchResults, setSearchResults] = useState<DrawingSearchItem[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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

  // 検索結果の処理
  const handleSearch = (results: DrawingSearchItem[]) => {
    setSearchResults(results)
    setShowSearchResults(results.length > 0)
  }

  // 検索結果から図番選択
  const handleSearchDrawingSelect = (drawingNumber: string) => {
    router.push(`/instruction/${encodeURIComponent(drawingNumber)}`)
  }

  // 会社選択時の処理
  const handleCompanySelect = (company: Company) => {
    router.push(`/category/${company.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-screen">
          {/* タイトル */}
          <h1 className="text-4xl font-bold mb-8 text-center text-emerald-100 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            作業手順データベース
          </h1>

          {/* 検索バー */}
          {searchIndex && (
            <div className="search-bar-container w-full max-w-[600px] mb-8">
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
            <div className="mb-8 w-full max-w-[800px]">
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

          {/* 会社選択セクション */}
          <div className="w-full max-w-[800px]">
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
                    onClick={() => handleCompanySelect(company)}
                  >
                    <div className="icon">🏢</div>
                    <div className="title">{company.name}</div>
                    <div className="desc">{company.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}