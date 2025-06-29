# 案件記録データベース

会社→部品→図番の階層構造で作業手順を管理し、図番検索機能を持つデータベースシステム。

## 機能
- 階層ナビゲーション（会社→部品→図番）
- 図番直接検索
- 作業手順表示（画像・動画・図面）
- 多言語対応（日本語・英語・ベトナム語）

## 技術スタック
- **フレームワーク**: Next.js 15.3.3 + React 19.0.0 + TypeScript 5
- **スタイリング**: Tailwind CSS 4.1.8
- **アニメーション**: TSParticles
- **データ管理**: 静的JSON + クライアントサイド検索

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認してください。

## プロジェクト構造
```
src/
├── app/                    # Next.js App Router
├── components/             # Reactコンポーネント
├── hooks/                  # カスタムフック
├── lib/                    # ユーティリティ・データローダー
└── types/                  # TypeScript型定義

public/
├── data/                   # データファイル
│   ├── companies.json      # 会社マスターデータ
│   ├── search-index.json   # 検索用インデックス
│   └── work-instructions/  # 作業手順データ
└── media/                  # 画像・動画ファイル
```

## 開発ガイドライン
- 既存のトラブルシューターアプリの技術基盤を活用
- クライアントサイドでの動作（サーバーレス）
- レスポンシブデザイン対応
- 多言語対応（日本語・英語・ベトナム語）

## ライセンス
このプロジェクトは社内利用を目的としています。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
