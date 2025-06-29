// src/app/layout.tsx - TranslationProviderを追加
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TranslationProvider } from '@/hooks/useTranslation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '案件記録データベース',
  description: '案件の作業手順・図番を検索できるデータベースシステム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  )
}