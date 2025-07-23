'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { AdminAuthCheck } from '@/components/AdminAuthCheck'
import { getAuthInfo, clearAuthInfo } from '@/lib/auth/client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    // ユーザー情報を取得
    const authData = getAuthInfo()
    setUserInfo(authData)
  }, [pathname]) // パス変更時に再取得

  const handleLogout = () => {
    clearAuthInfo()
    router.push('/admin/login')
  }

  // ログイン画面では共通ヘッダーを表示しない
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <AdminAuthCheck>
      <div className="min-h-screen bg-gray-50">
        {/* 共通ヘッダー */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-6">
                <Link 
                  href="/admin"
                  className="text-xl font-bold text-gray-900 hover:text-gray-700"
                >
                  管理画面
                </Link>
                
                {/* ナビゲーション */}
                <nav className="hidden md:flex space-x-4">
                  <Link
                    href="/admin/drawings/new"
                    className={`text-sm font-medium ${
                      pathname === '/admin/drawings/new' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    新規登録
                  </Link>
                  <Link
                    href="/admin/drawings/list"
                    className={`text-sm font-medium ${
                      pathname === '/admin/drawings/list' 
                        ? 'text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    図番一覧
                  </Link>
                </nav>
              </div>

              <div className="flex items-center space-x-6">
                {userInfo && (
                  <div className="text-sm text-gray-600">
                    ログイン中: <span className="font-medium text-gray-900">{userInfo.name}</span>
                  </div>
                )}
                <Link 
                  href="/" 
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← メインサイト
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main>{children}</main>
      </div>
    </AdminAuthCheck>
  )
}