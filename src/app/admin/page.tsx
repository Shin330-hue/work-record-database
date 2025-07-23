// src/app/admin/page.tsx - 管理画面トップページ

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadSearchIndex, loadCompanies } from '@/lib/dataLoader'
import { loadRecentContributions } from '@/lib/dataLoader'
import { AdminAuthCheck } from '@/components/AdminAuthCheck'
import { clearAuthInfo, getAuthInfo } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
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
    // ユーザー情報を取得
    const authData = getAuthInfo()
    setUserInfo(authData)

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

  const handleLogout = () => {
    clearAuthInfo()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <AdminAuthCheck>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込んでいます...</p>
          </div>
        </div>
      </AdminAuthCheck>
    )
  }

  return (
    <AdminAuthCheck>
      <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              管理画面
            </h1>
            <div className="flex items-center space-x-6">
              {userInfo && (
                <div className="text-sm text-gray-600">
                  ログイン中: <span className="font-medium text-gray-900">{userInfo.name}</span>
                </div>
              )}
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← メインサイトに戻る
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">総図番数</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalDrawings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">会社数</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalCompanies}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">製品数</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">最新追記</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalContributions}</p>
          </div>
        </div>

        {/* メイン機能 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 図番管理 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">図番管理</h2>
              <div className="space-y-3">
                <Link 
                  href="/admin/drawings/new"
                  className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📋 新規図番登録
                </Link>
                <Link 
                  href="/admin/drawings/list"
                  className="block w-full bg-gray-600 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  📚 図番一覧・編集
                </Link>
              </div>
            </div>
          </div>

          {/* データ管理 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">データ管理</h2>
              <div className="space-y-3">
                <Link 
                  href="/admin/companies"
                  className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  🏢 会社・製品管理
                </Link>
                <Link 
                  href="/admin/contributions"
                  className="block w-full bg-purple-600 text-white text-center py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  💬 追記管理
                </Link>
                <Link 
                  href="/admin/tools/validate"
                  className="block w-full bg-yellow-600 text-white text-center py-3 px-4 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  🔍 データ整合性チェック
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 最新追記 */}
        {recentContributions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">最新追記</h2>
              <div className="space-y-3">
                {recentContributions.map((item, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link 
                          href={`/instruction/${item.drawingNumber}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {item.drawingNumber}
                        </Link>
                        <p className="text-sm text-gray-600">{item.drawingTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{item.contribution.userName}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.contribution.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </AdminAuthCheck>
  )
}