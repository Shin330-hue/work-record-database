// src/lib/fileUtils.ts - ファイル操作ユーティリティ

// ファイルパスサニタイゼーション関数
export function sanitizeDrawingNumber(drawingNumber: string): string {
  if (!drawingNumber || typeof drawingNumber !== 'string') {
    throw new Error('図番が無効です')
  }
  
  // 英数字、ハイフン、アンダースコアのみ許可し、最大100文字に制限
  const sanitized = drawingNumber
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .substring(0, 100)
    .trim()
  
  if (sanitized.length === 0) {
    throw new Error('図番が無効です')
  }
  
  return sanitized
}

// 環境に応じたデータパス取得
export const getDataPath = (): string => {
  // デバッグ用ログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DATA_LOADING === 'true') {
    console.log('🔍 getDataPath 呼び出し:', {
      NODE_ENV: process.env.NODE_ENV,
      USE_NAS: process.env.USE_NAS,
      DATA_ROOT_PATH: process.env.DATA_ROOT_PATH,
      DEV_DATA_ROOT_PATH: process.env.DEV_DATA_ROOT_PATH
    })
  }

  // 本番環境（社内ノートPC）
  if (process.env.NODE_ENV === 'production') {
    const path = process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
    // 本番環境ではログ出力しない
    return path
  }
  
  // NAS使用開発環境
  if (process.env.USE_NAS === 'true') {
    const path = process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('💾 NAS使用パス:', path)
    }
    return path
  }
  
  // ローカル開発環境（DEV_DATA_ROOT_PATHを使用）
  const path = process.env.DEV_DATA_ROOT_PATH || './public/data_test'
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DATA_LOADING === 'true') {
    console.log('🖥️ ローカル開発パス:', path)
  }
  return path
}

// Next.js の静的ファイル配信を活用
const setupStaticFiles = async () => {
  // サーバーサイドのみ実行
  if (typeof window !== 'undefined') return;

  // Windows環境では手動でシンボリックリンクを作成してください
  // 以下の自動削除・symlink作成処理はコメントアウトします
  /*
  if (process.env.NODE_ENV === 'production' || process.env.USE_NAS === 'true') {
    try {
      const { promises: fs } = await import('fs');
      const path = (await import('path')).default;
      const dataPath = getDataPath();
      const publicDataPath = path.join(process.cwd(), 'public', 'data');
      
      if (require('fs').existsSync(publicDataPath)) {
        await fs.rm(publicDataPath, { recursive: true, force: true });
      }
      await fs.symlink(dataPath, publicDataPath);
      console.log(`✅ シンボリックリンク作成: ${publicDataPath} → ${dataPath}`);
    } catch (error) {
      console.error('⚠️ シンボリックリンク作成失敗:', error);
      await fs.cp(dataPath, publicDataPath, { recursive: true });
      console.log(`✅ データコピー完了: ${dataPath} → ${publicDataPath}`);
    }
  }
  */
}

// アプリケーション起動時にセットアップ実行
if (typeof window === 'undefined') {
  setupStaticFiles()
}

// フロントエンド用データパス取得（APIアクセス用）
export const getFrontendDataPath = (): string => {
  // フロントエンドでは常に '/data' を使用（Next.js静的ファイル配信）
  const frontendPath = '/data'
  
  // デバッグ用ログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DATA_LOADING === 'true') {
    console.log('🌐 フロントエンドデータパス:', frontendPath)
  }
  
  return frontendPath
}