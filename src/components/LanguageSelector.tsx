'use client'
import { useTranslation } from '@/hooks/useTranslation'

const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation()

  return (
    <div className="flex justify-end mb-6">
      <div className="relative">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'ja' | 'en' | 'vi')}
          className="appearance-none bg-white/10 backdrop-blur-md text-emerald-100 border border-emerald-500/30 rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 shadow-lg hover:bg-white/15"
        >
          <option value="ja" className="bg-emerald-900 text-emerald-100">日本語</option>
          <option value="en" className="bg-emerald-900 text-emerald-100">English</option>
          <option value="vi" className="bg-emerald-900 text-emerald-100">Tiếng Việt</option>
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-emerald-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default LanguageSelector 