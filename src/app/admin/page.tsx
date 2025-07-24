// src/app/admin/page.tsx - 管理画面トップページ

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSearchIndex, loadCompanies } from '@/lib/dataLoader'
import { loadRecentContributions } from '@/lib/dataLoader'
import { LoadingSpinner } from '@/components/admin/feedback'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalDrawings: 0,
    totalCompanies: 0,
    totalProducts: 0,
    totalContributions: 0
  })
  const [recentContributions, setRecentContributions] = useState<Array<{
    drawingNumber: string;
    contribution: import('@/types/contribution').ContributionData;
    drawingTitle?: string;
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [searchIndex, companies, contributions] = await Promise.all([
          loadSearchIndex(),
          loadCompanies(),
          loadRecentContributions(5)
        ])

        setStats({
          totalDrawings: searchIndex.drawings.length,
          totalCompanies: companies.length,
          totalProducts: companies.reduce((sum, c) => sum + c.products.length, 0),
          totalContributions: contributions.length
        })
        
        setRecentContributions(contributions)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="データを読み込んでいます..." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ページタイトル */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">【管理画面ダッシュボード】</h1>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">【総図番数】</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalDrawings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">【会社数】</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalCompanies.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">【製品数】</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.totalProducts.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center border-2 border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">【最新追記】</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalContributions.toLocaleString()}</p>
          </div>
        </div>

        {/* メイン機能 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 図番管理 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">【図番管理】</h2>
              <div className="space-y-4 flex flex-col items-center">
                <a 
                  href="/admin/drawings/new"
                  className="custom-rect-button blue"
                >
                  <span>新規図番登録</span>
                </a>
                <a 
                  href="/admin/drawings/list"
                  className="custom-rect-button gray"
                >
                  <span>図番一覧・編集</span>
                </a>
              </div>
            </div>
          </div>

          {/* データ管理 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">【データ管理】</h2>
              <div className="space-y-4 flex flex-col items-center">
                <a 
                  href="/admin/companies"
                  className="custom-rect-button emerald"
                >
                  <span>会社・製品管理</span>
                </a>
                <a 
                  href="/admin/contributions"
                  className="custom-rect-button purple"
                >
                  <span>追記管理</span>
                </a>
                <a 
                  href="/admin/tools/validate"
                  className="custom-rect-button gray"
                >
                  <span>データ整合性チェック</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 最新追記 */}
        {recentContributions.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20">
            <div>
              <h2 className="text-xl font-bold text-emerald-100 mb-4 flex items-center justify-center gap-2">
                📋 【最新の追記】
                <span className="text-sm font-normal text-emerald-200/70">({recentContributions.length}件)</span>
              </h2>
              <div className="space-y-3">
                {recentContributions.map((item, index) => (
                  <div 
                    key={index}
                    className="bg-black/40 rounded-xl p-4 border border-emerald-500/30 hover:bg-black/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/instruction/${item.drawingNumber}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {item.contribution.type === 'comment' ? '💬' :
                           item.contribution.type === 'image' ? '📷' :
                           item.contribution.type === 'video' ? '🎥' :
                           item.contribution.type === 'nearmiss' ? '⚠️' :
                           item.contribution.type === 'troubleshoot' ? '🔧' : '📝'}
                        </span>
                        <div>
                          <div className="text-emerald-300 font-mono text-sm">
                            {item.drawingNumber}
                          </div>
                          {item.drawingTitle && (
                            <div className="text-emerald-200/80 text-xs">
                              {item.drawingTitle}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-400 font-medium">
                          {item.contribution.type === 'comment' ? 'コメント' :
                           item.contribution.type === 'image' ? '画像追加' :
                           item.contribution.type === 'video' ? '動画追加' :
                           item.contribution.type === 'nearmiss' ? 'ヒヤリハット' :
                           item.contribution.type === 'troubleshoot' ? 'トラブル対策' : '追記'}
                        </div>
                        <div className="text-xs text-emerald-200/60">
                          {new Date(item.contribution.timestamp).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                    <div className="text-emerald-100 text-sm mb-1">
                      by {item.contribution.userName}
                    </div>
                    {item.contribution.content?.text && (
                      <div className="text-emerald-200/80 text-sm line-clamp-2">
                        {item.contribution.content.text}
                      </div>
                    )}
                    {item.contribution.targetSection === 'step' && item.contribution.stepNumber && (
                      <div className="text-emerald-300/60 text-xs mt-1">
                        ステップ {item.contribution.stepNumber} への追記
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <a href="/admin/contributions" className="custom-rect-button blue">
                  <span>全ての追記を見る</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}