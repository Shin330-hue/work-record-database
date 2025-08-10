const fs = require('fs');
const path = require('path');

// UIテキストのマスキング設定
const UI_MASKING_CONFIG = [
  { original: '田中工業AI', masked: 'サンプル工業AI' },
  { original: '田中工業', masked: 'サンプル工業' },
  { original: 'こんにちは！田中工業AIです。🔧', masked: 'こんにちは！サンプル工業AIです。🔧' }
];

// ファイル内容をマスキング
function maskFileContent(content, maskingConfig) {
  let maskedContent = content;
  maskingConfig.forEach(item => {
    const regex = new RegExp(escapeRegExp(item.original), 'gi');
    maskedContent = maskedContent.replace(regex, item.masked);
  });
  return maskedContent;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// UIファイルをマスキング
async function maskUIFiles() {
  const filesToMask = [
    'src/app/chat/page.tsx',
    'src/app/api/chat/route.ts',
    'src/app/page.tsx'
  ];
  
  console.log('🎭 UIテキストマスキング開始...\n');
  
  // バックアップディレクトリ作成
  const backupDir = 'scripts/backup_original_ui';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  for (const filePath of filesToMask) {
    try {
      if (fs.existsSync(filePath)) {
        console.log(`Processing: ${filePath}`);
        
        // 元ファイルをバックアップ
        const backupPath = path.join(backupDir, path.basename(filePath));
        fs.copyFileSync(filePath, backupPath);
        console.log(`  Backup: ${backupPath}`);
        
        // ファイル読み込み・マスキング・書き込み
        const content = fs.readFileSync(filePath, 'utf8');
        const maskedContent = maskFileContent(content, UI_MASKING_CONFIG);
        fs.writeFileSync(filePath, maskedContent, 'utf8');
        
        console.log(`  Masked: ${filePath}`);
      } else {
        console.log(`  Skip (not found): ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log('\n✅ UIテキストマスキング完了!');
  console.log(`📁 元ファイルは ${backupDir} にバックアップされました`);
}

// 元に戻す関数
async function restoreUIFiles() {
  const backupDir = 'scripts/backup_original_ui';
  
  if (!fs.existsSync(backupDir)) {
    console.log('❌ バックアップディレクトリが見つかりません');
    return;
  }
  
  console.log('🔄 UIファイル復元開始...\n');
  
  const backupFiles = fs.readdirSync(backupDir);
  for (const backupFile of backupFiles) {
    const backupPath = path.join(backupDir, backupFile);
    let targetPath;
    
    // ファイルパスを復元
    if (backupFile === 'page.tsx') {
      targetPath = fs.existsSync('src/app/chat/page.tsx') ? 'src/app/chat/page.tsx' : 'src/app/page.tsx';
    } else if (backupFile === 'route.ts') {
      targetPath = 'src/app/api/chat/route.ts';
    } else {
      targetPath = `src/app/${backupFile}`;
    }
    
    try {
      fs.copyFileSync(backupPath, targetPath);
      console.log(`Restored: ${targetPath}`);
    } catch (error) {
      console.error(`Error restoring ${backupFile}:`, error.message);
    }
  }
  
  console.log('\n✅ UIファイル復元完了!');
}

// コマンドライン引数処理
const command = process.argv[2];

if (command === 'restore') {
  restoreUIFiles().catch(console.error);
} else {
  maskUIFiles().catch(console.error);
}

module.exports = { maskFileContent, UI_MASKING_CONFIG };