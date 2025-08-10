const fs = require('fs');
const path = require('path');

// マスキング設定
const MASKING_CONFIG = {
  companies: [
    { original: 'chuo-tekko', masked: 'sample-works' },
    { original: 'sanei-kogyo', masked: 'test-industries' },
    { original: 'yamada-seisaku', masked: 'demo-manufacturing' },
    { original: 'tech-solutions', masked: 'example-tech' },
    { original: 'precision-works', masked: 'mockup-precision' },
    // 追加の会社ID
    { original: 'yamazaki-mazak', masked: 'sample-precision' },
    { original: 'mizutani-tekko', masked: 'test-manufacturing' },
    { original: 'kowa-engineering', masked: 'demo-engineering' },
    { original: 'wako-kogyo', masked: 'sample-industrial' },
    { original: 'eva-kogyo', masked: 'mock-industrial' }
  ],
  companyNames: [
    { original: '有限会社中央鉄工所', masked: '株式会社サンプル製作所' },
    { original: '中央鉄工所', masked: 'サンプル製作所' },
    { original: 'サンエイ工業', masked: 'テスト工業' },
    { original: 'sanei', masked: 'test' },
    { original: 'chuo', masked: 'sample' },
    { original: 'ヤマダ精作', masked: 'デモ精密' },
    { original: 'tech', masked: 'example' },
    // 追加の会社名マスキング
    { original: 'ヤマザキマザック株式会社', masked: 'サンプル精密株式会社' },
    { original: 'ヤマザキマザック', masked: 'サンプル精密' },
    { original: '水谷鉄工株式会社', masked: 'テスト製造株式会社' },
    { original: '水谷鉄工', masked: 'テスト製造' },
    { original: '有限会社幸和エンジニアリング', masked: '有限会社デモエンジニアリング' },
    { original: '幸和エンジニアリング', masked: 'デモエンジニアリング' },
    { original: '和宏工業所', masked: 'サンプル工業所' },
    { original: 'エバ工業', masked: 'モック工業' },
    { original: 'yamada', masked: 'demo' },
    { original: 'mizutani', masked: 'test' },
    { original: 'kowa', masked: 'demo' },
    { original: 'wako', masked: 'sample' },
    { original: 'eva', masked: 'mock' }
  ],
  productNames: [
    { original: 'チェーンソー', masked: 'テストパーツA' },
    { original: '神レール', masked: 'サンプル部品B' },
    { original: '穴あけテーブル', masked: 'デモブラケットC' },
    { original: 'シーサー（R)', masked: 'テストフレームD' },
    { original: 'フランジ', masked: 'サンプルフランジE' },
    { original: 'ブラケット', masked: 'デモブラケット' },
    { original: 'ベース', masked: 'テストベース' }
  ],
  userNames: [
    { original: '田中', masked: '佐藤太郎' },
    { original: '古川達久', masked: '鈴木次郎' },
    { original: '山田', masked: '田中三郎' },
    { original: 'テスト太郎', masked: 'サンプル四郎' }
  ],
  // 図番マスキング: 最初の部分を保持して後半をマスク
  drawingNumbers: [
    { original: '0D127100014', masked: 'TEST-001-A' },
    { original: '0A149002911', masked: 'TEST-002-B' },
    { original: '0A224000531', masked: 'TEST-003-C' },
    { original: '25417362721', masked: 'TEST-004-D' },
    { original: '0F030800622', masked: 'TEST-005-E' },
    { original: '24K025_20252725', masked: 'TEST-006-F' },
    { original: 'sanei_24K022', masked: 'TEST-007-G' },
    { original: 'flange_sus_sanei_20250722', masked: 'TEST-008-H' },
    { original: '12750800122', masked: 'TEST-009-I' },
    { original: '16800301576', masked: 'TEST-010-J' },
    { original: 'PR24M048202', masked: 'TEST-011-K' },
    { original: '91260506-2', masked: 'TEST-012-L' },
    { original: 'P103668', masked: 'TEST-013-M' },
    { original: 'A1-46717-E', masked: 'TEST-014-N' },
    { original: 'DM-05', masked: 'TEST-015-O' },
    { original: '1G-162-TL-05', masked: 'TEST-016-P' },
    { original: '02760810650', masked: 'TEST-017-Q' },
    { original: '04297711725', masked: 'TEST-018-R' },
    { original: '05389730954', masked: 'TEST-019-S' },
    { original: '06190300668', masked: 'TEST-020-T' },
    { original: '06200301496', masked: 'TEST-021-U' },
    { original: '0974122270', masked: 'TEST-022-V' },
    { original: '0A229001290', masked: 'TEST-023-W' },
    { original: '0E260800172', masked: 'TEST-024-X' },
    { original: '0E260800190', masked: 'TEST-025-Y' },
    { original: '25417362731', masked: 'TEST-026-Z' },
    { original: '4K300346', masked: 'TEST-027-AA' },
    { original: '4K470955', masked: 'TEST-028-BB' },
    { original: '4K524654-1', masked: 'TEST-029-CC' },
    { original: '4K524654-2', masked: 'TEST-030-DD' },
    { original: '5427365400', masked: 'TEST-031-EE' },
    { original: '82096-2-R04', masked: 'TEST-032-FF' },
    { original: 'A3159-500-00-A1', masked: 'TEST-033-GG' },
    { original: 'GSETJIG-3101', masked: 'TEST-034-HH' },
    { original: 'INNSJ-XXXX', masked: 'TEST-035-II' },
    { original: 'M-2009211-060', masked: 'TEST-036-JJ' },
    { original: 'M-5329619-160', masked: 'TEST-037-KK' },
    { original: 'TM2404599-1601-0', masked: 'TEST-038-LL' },
    { original: 'TM2404599-1603-0', masked: 'TEST-039-MM' },
    { original: 'TM2404599-1604-0', masked: 'TEST-040-NN' },
    { original: 'TM2404599-1651-0', masked: 'TEST-041-OO' },
    { original: 'TM256039-2-1401', masked: 'TEST-042-PP' },
    { original: 'TM26003-RS10x', masked: 'TEST-043-QQ' },
    { original: 'TMT1750-P0003', masked: 'TEST-044-RR' }
  ],
  // AIシステム名
  systemNames: [
    { original: '田中工業AI', masked: 'サンプル工業AI' },
    { original: '田中工業', masked: 'サンプル工業' }
  ]
};

// テキストマスキング関数
function maskText(text, maskingMap) {
  let maskedText = text;
  maskingMap.forEach(item => {
    const regex = new RegExp(escapeRegExp(item.original), 'gi');
    maskedText = maskedText.replace(regex, item.masked);
  });
  return maskedText;
}

// 正規表現エスケープ
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// JSONオブジェクトを再帰的にマスキング
function maskObject(obj, excludeKeys = []) {
  if (typeof obj === 'string') {
    let maskedStr = obj;
    
    // 各カテゴリのマスキングを適用
    maskedStr = maskText(maskedStr, MASKING_CONFIG.companyNames);
    maskedStr = maskText(maskedStr, MASKING_CONFIG.productNames);
    maskedStr = maskText(maskedStr, MASKING_CONFIG.userNames);
    maskedStr = maskText(maskedStr, MASKING_CONFIG.drawingNumbers);
    maskedStr = maskText(maskedStr, MASKING_CONFIG.systemNames);
    
    return maskedStr;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskObject(item, excludeKeys));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const maskedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      if (excludeKeys.includes(key)) {
        maskedObj[key] = value; // 除外キーはそのまま
      } else if (key === 'id' && typeof value === 'string') {
        // IDフィールドは会社IDのみマスク
        maskedObj[key] = maskText(value, MASKING_CONFIG.companies);
      } else {
        maskedObj[key] = maskObject(value, excludeKeys);
      }
    }
    return maskedObj;
  }
  
  return obj;
}

// フォルダを再帰的にコピーする関数
function copyFolderRecursive(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const items = fs.readdirSync(source);
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

// ファイル処理関数
async function maskJsonFile(inputPath, outputPath, excludeKeys = []) {
  try {
    console.log(`Processing: ${inputPath}`);
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const maskedData = maskObject(data, excludeKeys);
    
    // 出力ディレクトリを作成
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(maskedData, null, 2), 'utf8');
    console.log(`Masked: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error.message);
  }
}

// メイン処理
async function main() {
  const dataDir = 'public/data';
  const outputDir = 'public/data_masked';
  
  console.log('🎭 データマスキング開始...\n');
  
  // 1. companies.json をマスク
  await maskJsonFile(
    path.join(dataDir, 'companies.json'),
    path.join(outputDir, 'companies.json')
  );
  
  // 2. search-index.json をマスク（存在する場合）
  const searchIndexPath = path.join(dataDir, 'search-index.json');
  if (fs.existsSync(searchIndexPath)) {
    await maskJsonFile(
      searchIndexPath,
      path.join(outputDir, 'search-index.json')
    );
  }
  
  // 3. 作業手順データをマスク
  const workInstructionsDir = path.join(dataDir, 'work-instructions');
  if (fs.existsSync(workInstructionsDir)) {
    const drawingDirs = fs.readdirSync(workInstructionsDir).filter(item =>
      fs.statSync(path.join(workInstructionsDir, item)).isDirectory()
    );
    
    for (const drawingDir of drawingDirs) {
      const sourcePath = path.join(workInstructionsDir, drawingDir);
      // 図番を含むディレクトリ名もマスク
      const maskedDrawingDir = maskText(drawingDir, MASKING_CONFIG.drawingNumbers);
      const destPath = path.join(outputDir, 'work-instructions', maskedDrawingDir);
      
      // instruction.json をマスク
      const instructionPath = path.join(sourcePath, 'instruction.json');
      if (fs.existsSync(instructionPath)) {
        await maskJsonFile(
          instructionPath,
          path.join(destPath, 'instruction.json'),
          ['timestamp', 'fileSize', 'mimeType'] // 除外キー
        );
      }
      
      // contributions.json をマスク（存在する場合）
      const contributionsPath = path.join(sourcePath, 'contributions', 'contributions.json');
      if (fs.existsSync(contributionsPath)) {
        await maskJsonFile(
          contributionsPath,
          path.join(destPath, 'contributions', 'contributions.json'),
          ['timestamp', 'fileSize', 'mimeType', 'id'] // ID等は保持
        );
      }
      
      // 画像・動画・PDF・プログラムファイルをコピー
      const mediaFolders = ['images', 'videos', 'pdfs', 'programs'];
      for (const mediaFolder of mediaFolders) {
        const sourceMediaPath = path.join(sourcePath, mediaFolder);
        if (fs.existsSync(sourceMediaPath)) {
          const destMediaPath = path.join(destPath, mediaFolder);
          copyFolderRecursive(sourceMediaPath, destMediaPath);
        }
      }
      
      // 追記ファイルもコピー
      const contributionsFilesPath = path.join(sourcePath, 'contributions', 'files');
      if (fs.existsSync(contributionsFilesPath)) {
        const destContributionsFilesPath = path.join(destPath, 'contributions', 'files');
        copyFolderRecursive(contributionsFilesPath, destContributionsFilesPath);
      }
    }
  }
  
  console.log('\n✅ データマスキング完了!');
  console.log(`📁 マスク済みデータは ${outputDir} に出力されました`);
  console.log('\n📋 変更内容:');
  console.log('- 会社名: 実名 → サンプル名');
  console.log('- 製品名: 実名 → テスト名');  
  console.log('- 図番: 実図番 → TEST-XXX-X形式');
  console.log('- 登録者: 実名 → サンプル名');
  console.log('- システム名: 田中工業AI → サンプル工業AI');
}

// 実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { maskObject, maskText, MASKING_CONFIG };