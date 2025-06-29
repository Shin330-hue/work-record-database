'use client'
import { useTranslation } from '@/hooks/useTranslation'

const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation()

  return (
    <div className="flex justify-end mb-4">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ja' | 'en' | 'vi')}
        className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="ja">日本語</option>
        <option value="en">English</option>
        <option value="vi">Tiếng Việt</option>
      </select>
    </div>
  )
}

export default LanguageSelector 