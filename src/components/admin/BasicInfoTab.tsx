'use client'

import React from 'react'

// 基本情報タブの型定義
interface Company {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  category: string
}

interface EditFormData {
  drawingNumber: string
  title: string
  company: Company
  product: Product
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
}

interface PendingUpload {
  file: File
  stepNumber: string
  fileType: string
  machineType?: string
  previewUrl?: string
}

interface BasicInfoTabProps {
  formData: EditFormData
  setFormData: React.Dispatch<React.SetStateAction<EditFormData | null>>
  companies: Array<{ id: string; name: string; products: Product[] }>
  machineTypes: string[]
  handleMachineTypeChange: (machine: string, checked: boolean) => void
  handleKeywordsChange: (keywordsString: string) => void
  handleToolsRequiredChange: (toolsString: string) => void
  handleWarningChange: (index: number, value: string) => void
  addWarning: () => void
  removeWarning: (index: number) => void
  pendingUploads: PendingUpload[]
  handleOverviewImageUpload: (files: FileList | null) => Promise<void>
  removeOverviewImage: (imageIndex: number) => Promise<void>
  actualFiles: {
    overview: { images: string[]; videos: string[]; pdfs: string[]; programs: string[] }
  }
  onImageClick: (images: string[], currentIndex: number) => void
  drawingNumber: string
}

export default function BasicInfoTab({
  formData,
  setFormData,
  companies,
  machineTypes,
  handleMachineTypeChange,
  handleKeywordsChange,
  handleToolsRequiredChange,
  handleWarningChange,
  addWarning,
  removeWarning,
  pendingUploads,
  handleOverviewImageUpload,
  removeOverviewImage,
  actualFiles,
  onImageClick,
  drawingNumber
}: BasicInfoTabProps) {
  
  return (
    <>
      {/* 基本情報 */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="custom-form-label">
              図番 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.drawingNumber}
              disabled
              className="custom-form-input cursor-not-allowed"
              style={{ backgroundColor: '#1f2937', color: '#e5e7eb' }}
            />
            <p className="text-xs text-gray-500 mt-1">図番は変更できません</p>
          </div>
          
          <div>
            <label className="custom-form-label">
              作業手順タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : prev)}
              className="custom-form-input"
              required
            />
          </div>
        </div>
      </div>

      {/* 会社・製品情報 */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">会社・製品情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="custom-form-label">
              会社名 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.company.id}
              onChange={(e) => {
                const selectedCompany = companies.find(c => c.id === e.target.value)
                if (selectedCompany) {
                  setFormData(prev => prev ? {
                    ...prev,
                    company: { id: selectedCompany.id, name: selectedCompany.name },
                    product: { id: '', name: '', category: '' }
                  } : prev)
                }
              }}
              className="custom-form-select"
              required
            >
              <option value="">会社を選択</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="custom-form-label">
              製品名 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.product.id}
              onChange={(e) => {
                const selectedCompany = companies.find(c => c.id === formData.company.id)
                const selectedProduct = selectedCompany?.products.find(p => p.id === e.target.value)
                if (selectedProduct) {
                  setFormData(prev => prev ? {
                    ...prev,
                    product: selectedProduct
                  } : prev)
                }
              }}
              className="custom-form-select"
              required
              disabled={!formData.company.id}
            >
              <option value="">製品を選択</option>
              {companies
                .find(c => c.id === formData.company.id)
                ?.products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* 作業詳細情報 */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">作業詳細情報</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="custom-form-label">
              難易度 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => prev ? {
                ...prev,
                difficulty: e.target.value as '初級' | '中級' | '上級'
              } : prev)}
              className="custom-form-select"
              required
            >
              <option value="初級">初級</option>
              <option value="中級">中級</option>
              <option value="上級">上級</option>
            </select>
          </div>

          <div>
            <label className="custom-form-label">
              推定作業時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.estimatedTime}
              onChange={(e) => setFormData(prev => prev ? {
                ...prev,
                estimatedTime: e.target.value
              } : prev)}
              className="custom-form-input"
              placeholder="例: 2時間30分"
              required
            />
          </div>
        </div>

        {/* 機械種別 */}
        <div className="mt-6">
          <label className="custom-form-label">
            機械種別 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {machineTypes.map(machine => (
              <label key={machine} className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={formData.machineType.includes(machine)}
                  onChange={(e) => handleMachineTypeChange(machine, e.target.checked)}
                  className="mr-2"
                />
                {machine}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 概要・説明 */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">概要・説明</h2>
        
        <div className="space-y-6">
          <div>
            <label className="custom-form-label">
              作業概要説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => prev ? {
                ...prev,
                description: e.target.value
              } : prev)}
              rows={4}
              className="custom-form-textarea"
              placeholder="この作業の概要を説明してください..."
              required
            />
          </div>

          <div>
            <label className="custom-form-label">
              詳細説明
            </label>
            <textarea
              value={formData.overview.description}
              onChange={(e) => setFormData(prev => prev ? {
                ...prev,
                overview: { ...prev.overview, description: e.target.value }
              } : prev)}
              rows={3}
              className="custom-form-textarea"
              placeholder="作業の詳細説明..."
            />
          </div>

          <div>
            <label className="custom-form-label">
              キーワード
            </label>
            <input
              type="text"
              value={formData.keywords.join(', ')}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              className="custom-form-input"
              placeholder="検索用キーワードをカンマ区切りで入力"
            />
            <p className="text-xs text-gray-400 mt-1">
              例: 旋盤, 切削, フライス加工
            </p>
          </div>

          <div>
            <label className="custom-form-label">
              必要工具
            </label>
            <input
              type="text"
              value={formData.toolsRequired.join(', ')}
              onChange={(e) => handleToolsRequiredChange(e.target.value)}
              className="custom-form-input"
              placeholder="必要な工具をカンマ区切りで入力"
            />
            <p className="text-xs text-gray-400 mt-1">
              例: エンドミル, ドリル, マイクロメータ
            </p>
          </div>
        </div>
      </div>

      {/* 時間設定 */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">作業時間設定</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="custom-form-label">
              準備時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.overview.preparationTime}
              onChange={(e) => setFormData(prev => prev ? {
                ...prev,
                overview: { ...prev.overview, preparationTime: e.target.value }
              } : prev)}
              className="custom-form-input"
              placeholder="30"
              required
            />
            <p className="text-xs text-gray-400 mt-1">分で入力</p>
          </div>

          <div>
            <label className="custom-form-label">
              加工時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.overview.processingTime}
              onChange={(e) => setFormData(prev => prev ? {
                ...prev,
                overview: { ...prev.overview, processingTime: e.target.value }
              } : prev)}
              className="custom-form-input"
              placeholder="60"
              required
            />
            <p className="text-xs text-gray-400 mt-1">分で入力</p>
          </div>
        </div>
      </div>

      {/* 警告事項 */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">⚠️ 警告事項</h2>
        
        <div className="space-y-3">
          {formData.overview.warnings.map((warning, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={warning}
                onChange={(e) => handleWarningChange(index, e.target.value)}
                className="custom-form-input flex-1"
                placeholder={`警告事項 ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeWarning(index)}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                削除
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addWarning}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            警告事項を追加
          </button>
        </div>
      </div>

      {/* 概要画像セクション */}
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-6">📷 概要画像</h2>
        
        {/* 画像アップロード */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = 'image/*'
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files
                if (files) {
                  handleOverviewImageUpload(files)
                }
              }
              input.click()
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            📤 概要画像をアップロード
          </button>
        </div>

        {/* 画像プレビュー */}
        {actualFiles.overview.images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {actualFiles.overview.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={`/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=overview&fileName=${encodeURIComponent(image)}`}
                  alt={`概要画像 ${index + 1}`}
                  className="w-full h-20 object-cover rounded cursor-pointer"
                  onClick={() => {
                    const imageUrls = actualFiles.overview.images.map(img => 
                      `/api/files?drawingNumber=${drawingNumber}&folderType=images&subFolder=overview&fileName=${encodeURIComponent(img)}`
                    )
                    onImageClick(imageUrls, index)
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeOverviewImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {pendingUploads.filter(u => u.stepNumber === '0').length > 0 && (
          <div className="bg-blue-900 p-4 rounded-lg shadow border border-blue-700 mt-4">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">
              📤 概要画像アップロード予定 ({pendingUploads.filter(u => u.stepNumber === '0').length}件)
            </h3>
            <p className="text-sm text-blue-200 mb-3">
              更新ボタンを押すとアップロードされます
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {pendingUploads
                .filter(u => u.stepNumber === '0')
                .map((upload, index) => (
                  <div key={index} className="relative">
                    {upload.previewUrl && (
                      <img
                        src={upload.previewUrl}
                        alt={`アップロード予定 ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    )}
                    <div className="absolute inset-0 bg-blue-600 bg-opacity-50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">予定</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}