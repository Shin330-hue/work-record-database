'use client'
import React, { useState, useEffect, useRef } from 'react'
import { SearchIndex, DrawingSearchItem } from '@/lib/dataLoader'
import { useTranslation } from '@/hooks/useTranslation'

interface SearchBarProps {
  searchIndex: SearchIndex
  onSearch: (results: DrawingSearchItem[]) => void
  onDrawingSelect: (drawingNumber: string) => void
  placeholder?: string
}

export default function SearchBar({ searchIndex, onSearch, onDrawingSelect, placeholder }: SearchBarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<DrawingSearchItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // 検索履歴をローカルストレージから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // 検索履歴をローカルストレージに保存
  const saveSearchHistory = (newHistory: string[]) => {
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  // 検索履歴に追加
  const addToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    const newHistory = [
      searchTerm,
      ...searchHistory.filter(item => item !== searchTerm)
    ].slice(0, 10) // 最新10件まで保持
    
    saveSearchHistory(newHistory)
  }

  // 検索履歴をクリア
  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('searchHistory')
  }

  // 検索実行
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      onSearch([])
      return
    }

    const normalizedQuery = searchQuery.toLowerCase()
    const results = searchIndex.drawings
      .map(drawing => ({
        ...drawing,
        matchScore: calculateMatchScore(drawing, normalizedQuery)
      }))
      .filter(drawing => drawing.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10) // 上位10件を表示

    setSuggestions(results)
    onSearch(results)
  }

  // マッチスコア計算
  const calculateMatchScore = (drawing: DrawingSearchItem, query: string): number => {
    let score = 0

    // 図番完全一致（最高優先度）
    if (drawing.drawingNumber.toLowerCase() === query) {
      score += 100
    }
    // 図番部分一致
    else if (drawing.drawingNumber.toLowerCase().includes(query)) {
      score += 50
    }

    // タイトル検索
    if (drawing.title.toLowerCase().includes(query)) {
      score += 30
    }

    // キーワード検索
    const keywordMatches = drawing.keywords.filter(keyword => 
      keyword.toLowerCase().includes(query)
    ).length
    score += keywordMatches * 20

    // 会社名検索
    if (drawing.companyName.toLowerCase().includes(query)) {
      score += 10
    }

    // 部品名検索
    if (drawing.productName.toLowerCase().includes(query)) {
      score += 10
    }

    return score
  }

  // 入力変更時の処理
  const handleInputChange = (value: string) => {
    setQuery(value)
    setShowHistory(false)
    
    if (value.length > 0) {
      performSearch(value)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      onSearch([])
    }
  }

  // 図番選択時の処理
  const handleDrawingSelect = (drawingNumber: string) => {
    addToHistory(drawingNumber)
    onDrawingSelect(drawingNumber)
    setQuery('')
    setShowSuggestions(false)
    setShowHistory(false)
  }

  // 検索履歴から選択
  const handleHistorySelect = (historyItem: string) => {
    setQuery(historyItem)
    performSearch(historyItem)
    setShowHistory(false)
    setShowSuggestions(true)
  }

  // フォーカス時の処理
  const handleFocus = () => {
    if (query.length === 0 && searchHistory.length > 0) {
      setShowHistory(true)
    }
  }

  // 外部クリック時の処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder || t('searchPlaceholder')}
          className="search-input w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200"
        />
        
        {/* 検索アイコン */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
      </div>

      {/* 検索候補 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 border-b border-gray-600 last:border-b-0 transition-colors duration-150"
              onClick={() => handleDrawingSelect(suggestion.drawingNumber)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-yellow-400 text-lg">
                    {suggestion.drawingNumber}
                  </div>
                  <div className="text-white text-sm">
                    {suggestion.title}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {suggestion.companyName} - {suggestion.productName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-xs">
                    {suggestion.difficulty}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {suggestion.estimatedTime}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 検索履歴 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="search-history absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-600">
            <span className="text-gray-400 text-sm">{t('recentSearches')}</span>
            <button
              onClick={clearHistory}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              {t('clearSearch')}
            </button>
          </div>
          {searchHistory.map((historyItem, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 border-b border-gray-600 last:border-b-0 transition-colors duration-150"
              onClick={() => handleHistorySelect(historyItem)}
            >
              <div className="font-mono text-yellow-400">{historyItem}</div>
            </button>
          ))}
        </div>
      )}

      {/* 検索結果なし */}
      {showSuggestions && query.length > 0 && suggestions.length === 0 && (
        <div className="search-no-results absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4">
          <div className="text-gray-400 text-center">
            {t('noResults')}
          </div>
        </div>
      )}
    </div>
  )
} 