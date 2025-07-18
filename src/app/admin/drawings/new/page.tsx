// src/app/admin/drawings/new/page.tsx - 新規図番登録ページ

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadCompanies } from '@/lib/dataLoader'
import { Company } from '@/lib/dataLoader'

// 図番データ型
interface DrawingFormData {
  drawingNumber: string
  title: string
  company: {
    type: 'existing' | 'new'
    id?: string
    name: string
  }
  product: {
    type: 'existing' | 'new'
    id?: string
    name: string
    category: string
  }
  difficulty: string
  estimatedTime: string
  machineType: string
  description?: string
  keywords?: string
  pdfFile?: File
}

// 会社選択コンポーネント
function CompanySelector({ 
  companies, 
  value, 
  onChange 
}: { 
  companies: Company[]
  value: DrawingFormData['company']
  onChange: (company: DrawingFormData['company']) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isNewMode, setIsNewMode] = useState(value.type === 'new')

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCompanySelect = (company: Company) => {
    onChange({
      type: 'existing',
      id: company.id,
      name: company.name
    })
    setSearchTerm(company.name)
    setShowDropdown(false)
    setIsNewMode(false)
  }

  const handleNewCompany = () => {
    setIsNewMode(true)
    onChange({
      type: 'new',
      name: searchTerm
    })
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        会社名 <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={isNewMode ? value.name : searchTerm}
          onChange={(e) => {
            const newValue = e.target.value
            if (isNewMode) {
              onChange({ ...value, name: newValue })
            } else {
              setSearchTerm(newValue)
              setShowDropdown(true)
            }
          }}
          onFocus={() => !isNewMode && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
          placeholder="会社名を入力または選択"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {!isNewMode && (
          <button
            type="button"
            onClick={() => setIsNewMode(true)}
            className="absolute right-2 top-2 text-sm text-blue-600 hover:text-blue-800"
          >
            新規作成
          </button>
        )}
        
        {isNewMode && (
          <button
            type="button"
            onClick={() => {
              setIsNewMode(false)
              setSearchTerm('')
              setShowDropdown(true)
            }}
            className="absolute right-2 top-2 text-sm text-gray-600 hover:text-gray-800"
          >
            既存選択
          </button>
        )}
      </div>

      {showDropdown && !isNewMode && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => handleCompanySelect(company)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {company.name}
            </button>
          ))}
          
          {searchTerm && (
            <button
              type="button"
              onClick={handleNewCompany}
              className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-t border-gray-200"
            >
              + 「{searchTerm}」を新規作成
            </button>
          )}
        </div>
      )}
      
      {isNewMode && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会社ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.id || ''}
              onChange={(e) => onChange({ ...value, id: e.target.value })}
              placeholder="例: kouwa-engineering"
              pattern="^[a-z0-9-]+$"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              英数字とハイフンのみ使用可能（例: kouwa-engineering）
            </p>
          </div>
          <p className="text-sm text-blue-600">
            新規会社として登録されます
          </p>
        </div>
      )}
    </div>
  )
}

// 削除：ProductSelectorコンポーネントは不要になりました

// キーワード自動生成関数
function generateAutoKeywords(drawing: DrawingFormData, companies: Company[]): string {
  const keywords = []
  
  // 製品カテゴリ
  if (drawing.product.category) {
    keywords.push(drawing.product.category)
  }
  
  // 製品名
  if (drawing.product.name) {
    keywords.push(drawing.product.name)
  }
  
  // 会社名略称
  if (drawing.company.type === 'existing' && drawing.company.id) {
    const company = companies.find(c => c.id === drawing.company.id)
    if (company?.shortName) {
      keywords.push(company.shortName)
    }
  } else if (drawing.company.name) {
    // 新規会社の場合は会社名をそのまま使用
    keywords.push(drawing.company.name)
  }
  
  // 機械種別
  if (drawing.machineType) {
    const machineTypes = drawing.machineType.split(',').map(s => s.trim()).filter(s => s)
    keywords.push(...machineTypes)
  }
  
  return keywords.length > 0 ? keywords.join(',') : 'カテゴリ,製品名,会社名略称,機械種別'
}

// メインコンポーネント
export default function NewDrawingPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [drawings, setDrawings] = useState<DrawingFormData[]>([
    {
      drawingNumber: '',
      title: '',
      company: { type: 'existing', name: '' },
      product: { type: 'existing', name: '', category: '' },
      difficulty: '中級',
      estimatedTime: '180',
      machineType: 'マシニング',
      description: '',
      keywords: ''
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadCompanies()
        setCompanies(data)
      } catch (error) {
        console.error('会社データ読み込みエラー:', error)
      }
    }
    loadData()
  }, [])

  // 図番を追加
  const addDrawing = () => {
    setDrawings([...drawings, {
      drawingNumber: '',
      title: '',
      company: { type: 'existing', name: '' },
      product: { type: 'existing', name: '', category: '' },
      difficulty: '中級',
      estimatedTime: '180',
      machineType: 'マシニング',
      description: '',
      keywords: ''
    }])
  }

  // 図番を削除
  const removeDrawing = (index: number) => {
    if (drawings.length > 1) {
      setDrawings(drawings.filter((_, i) => i !== index))
    }
  }

  // 図番データを更新
  const updateDrawing = (index: number, field: keyof DrawingFormData, value: string | string[]) => {
    const newDrawings = [...drawings]
    newDrawings[index] = { ...newDrawings[index], [field]: value }
    setDrawings(newDrawings)
  }

  const updateDrawingCompany = (index: number, company: DrawingFormData['company']) => {
    const newDrawings = [...drawings]
    newDrawings[index] = { ...newDrawings[index], company }
    setDrawings(newDrawings)
  }

  const updateDrawingProduct = (index: number, product: DrawingFormData['product']) => {
    const newDrawings = [...drawings]
    newDrawings[index] = { ...newDrawings[index], product }
    setDrawings(newDrawings)
  }

  // PDFファイルを更新
  const updatePdfFile = (index: number, file: File | undefined) => {
    const newDrawings = [...drawings]
    newDrawings[index] = { ...newDrawings[index], pdfFile: file }
    setDrawings(newDrawings)
  }

  // バリデーション
  const validateForm = () => {
    const errors: string[] = []
    const existingIds = companies.map(c => c.id).filter(id => id) // 既存の会社ID一覧
    
    drawings.forEach((drawing, index) => {
      if (!drawing.drawingNumber.trim()) {
        errors.push(`図番 ${index + 1}: 図番は必須です`)
      }
      if (!drawing.title.trim()) {
        errors.push(`図番 ${index + 1}: タイトルは必須です`)
      }
      if (!drawing.company.name.trim()) {
        errors.push(`図番 ${index + 1}: 会社名は必須です`)
      }
      
      // 新規会社の場合はIDも必須
      if (drawing.company.type === 'new') {
        if (!drawing.company.id?.trim()) {
          errors.push(`図番 ${index + 1}: 新規会社の場合、会社IDは必須です`)
        } else {
          // 会社IDの形式チェック
          const idPattern = /^[a-z0-9-]+$/
          if (!idPattern.test(drawing.company.id)) {
            errors.push(`図番 ${index + 1}: 会社IDは英数字とハイフンのみ使用可能です`)
          }
          // 重複チェック
          if (existingIds.includes(drawing.company.id)) {
            errors.push(`図番 ${index + 1}: 会社ID「${drawing.company.id}」は既に使用されています`)
          }
        }
      }
      
      if (!drawing.product.name.trim()) {
        errors.push(`図番 ${index + 1}: 製品名は必須です`)
      }
      if (!drawing.product.category.trim()) {
        errors.push(`図番 ${index + 1}: カテゴリは必須です`)
      }
    })
    
    return errors
  }

  // 登録処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join('\n'))
      return
    }
    
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('drawings', JSON.stringify(drawings))
      
      // PDFファイルを追加
      drawings.forEach((drawing) => {
        if (drawing.pdfFile) {
          formData.append(`pdf_${drawing.drawingNumber}`, drawing.pdfFile)
        }
      })
      
      const response = await fetch('/api/admin/drawings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'}`
        },
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`${result.summary.successful}件の図番が正常に登録されました`)
        router.push('/admin/drawings/list')
      } else {
        setError(result.error || '登録に失敗しました')
      }
    } catch {
      setError('登録中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              新規図番登録
            </h1>
            <Link 
              href="/admin" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 管理画面に戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {drawings.map((drawing, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  図番 {index + 1}
                </h2>
                {drawings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDrawing(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    削除
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. 会社名 */}
                <CompanySelector
                  companies={companies}
                  value={drawing.company}
                  onChange={(company) => updateDrawingCompany(index, company)}
                />

                {/* 2. 図番 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    図番 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={drawing.drawingNumber}
                    onChange={(e) => updateDrawing(index, 'drawingNumber', e.target.value)}
                    placeholder="ABC123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 3. 図面PDF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    図面PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => updatePdfFile(index, e.target.files?.[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 4. 製品カテゴリ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    製品カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={drawing.product.category}
                      onChange={(e) => updateDrawingProduct(index, { ...drawing.product, category: e.target.value })}
                      placeholder="ブラケット、カバー、シャフト等"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      list="categories-list"
                    />
                    <datalist id="categories-list">
                      {Array.from(new Set(
                        companies.flatMap(company => 
                          company.products.map(product => product.category)
                        )
                      )).sort().map(category => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* 5. 製品名（名称やあだ名） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    製品名 <span className="text-red-500">*</span>
                    <span className="text-sm text-gray-500">（名称やあだ名）</span>
                  </label>
                  <input
                    type="text"
                    value={drawing.product.name}
                    onChange={(e) => updateDrawingProduct(index, { ...drawing.product, name: e.target.value })}
                    placeholder="チェーンソー、カバー、シャフト等"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 6. 作業手順タイトル */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    作業手順タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={drawing.title}
                    onChange={(e) => updateDrawing(index, 'title', e.target.value)}
                    placeholder="例：ブラケット（チェーンソー）加工手順"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    自動生成: {drawing.product.category && drawing.product.name ? 
                      `${drawing.product.category}（${drawing.product.name}）加工手順` : 
                      'カテゴリ（製品名）加工手順'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (drawing.product.category && drawing.product.name) {
                        updateDrawing(index, 'title', `${drawing.product.category}（${drawing.product.name}）加工手順`)
                      }
                    }}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    disabled={!drawing.product.category || !drawing.product.name}
                  >
                    {drawing.product.category && drawing.product.name ? '自動生成を適用' : '製品名・カテゴリを入力してください'}
                  </button>
                </div>

                {/* 7. 難易度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    難易度 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={drawing.difficulty}
                    onChange={(e) => updateDrawing(index, 'difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="初級">初級</option>
                    <option value="中級">中級</option>
                    <option value="上級">上級</option>
                  </select>
                </div>

                {/* 8. 推定時間 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    推定時間 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={drawing.estimatedTime}
                      onChange={(e) => updateDrawing(index, 'estimatedTime', e.target.value)}
                      min="1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-500">分</span>
                  </div>
                </div>

                {/* 9. 機械種別 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    機械種別 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {['マシニング', 'ターニング', '横中', 'ラジアル', 'フライス'].map((machine) => {
                      const machineTypes = drawing.machineType.split(',').map(s => s.trim()).filter(s => s)
                      const isChecked = machineTypes.includes(machine)
                      
                      return (
                        <label key={machine} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentTypes = drawing.machineType.split(',').map(s => s.trim()).filter(s => s)
                              let newTypes
                              
                              if (e.target.checked) {
                                newTypes = [...currentTypes, machine]
                              } else {
                                newTypes = currentTypes.filter(t => t !== machine)
                              }
                              
                              updateDrawing(index, 'machineType', newTypes.join(','))
                            }}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{machine}</span>
                        </label>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    選択中: {drawing.machineType || 'なし'}
                  </p>
                </div>
              </div>

              {/* 説明・キーワード */}
              <div className="mt-6 space-y-4">
                {/* 10. 説明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明（任意）
                  </label>
                  <textarea
                    value={drawing.description}
                    onChange={(e) => updateDrawing(index, 'description', e.target.value)}
                    rows={3}
                    placeholder="作業の概要や注意点など"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 11. 検索キーワード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    検索キーワード（任意）
                  </label>
                  <input
                    type="text"
                    value={drawing.keywords}
                    onChange={(e) => updateDrawing(index, 'keywords', e.target.value)}
                    placeholder="カンマ区切りでキーワードを入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    自動生成: {generateAutoKeywords(drawing, companies)}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const autoKeywords = generateAutoKeywords(drawing, companies)
                      if (autoKeywords !== 'カテゴリ,製品名,会社名略称,機械種別') {
                        updateDrawing(index, 'keywords', autoKeywords)
                      }
                    }}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    disabled={!drawing.product.category || !drawing.product.name || !drawing.company.name}
                  >
                    {drawing.product.category && drawing.product.name && drawing.company.name ? '自動生成を適用' : '必要な情報を入力してください'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 図番追加ボタン */}
          <div className="text-center">
            <button
              type="button"
              onClick={addDrawing}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              + 図番を追加
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800 whitespace-pre-line">{error}</div>
            </div>
          )}

          {/* 登録ボタン */}
          <div className="flex justify-center space-x-4">
            <Link
              href="/admin"
              className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登録中...' : `${drawings.length}件の図番を登録`}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}