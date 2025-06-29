// next.config.js - Next.js 15.3.3対応版
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 🔥 新しいTurbopack設定方法
  turbo: {
    // Turbopackの設定をここに書く（基本的には空でOK）
  },
  
  // 画像最適化設定
  images: {
    domains: [],
  },
  
  // 🔥 experimental.turbo は削除（非推奨）
  // experimental: {
  //   turbo: { ... } // ← これは削除
  // }
}

module.exports = nextConfig