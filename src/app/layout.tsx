// src/app/layout.tsx - TranslationProviderを追加
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TranslationProvider } from '@/hooks/useTranslation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '金属加工トラブルシューター',
  description: '金属加工の問題を診断し、最適な解決策を提案するAIシステム',
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