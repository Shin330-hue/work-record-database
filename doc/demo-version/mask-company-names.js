/**
 * 会社名マスキングスクリプト
 * 対象: public/data_demo 内のJSONファイル
 *
 * 使用方法:
 *   node doc/demo-version/mask-company-names.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// マスキング設定
// ========================================
const COMPANY_MASKING = {
  // 会社ID: original → masked
  ids: [
    { original: 'chuo-tekko', masked: 'demo-manufacturing-a' },
    { original: 'yamazaki-mazak', masked: 'demo-precision-b' },
    { original: 'mizutani-tekko', masked: 'demo-works-c' },
    { original: 'kouwa-engineering', masked: 'demo-engineering-d' },
    { original: 'sanei-kogyo', masked: 'demo-industrial-e' },
    { original: 'wako-kogyosyo', masked: 'demo-factory-f' },
    { original: 'eba-kogyo', masked: 'demo-tech-g' },
    { original: 'machiya-kinnzoku', masked: 'demo-metal-h' },
    { original: 'dainichi-kinzoku', masked: 'demo-steel-i' },
    { original: 'tosho-gizyutsu', masked: 'demo-system-j' },
  ],

  // 会社名: original → masked（長い順に並べる）
  names: [
    { original: '有限会社中央鉄工所', masked: '株式会社デモ製作所A' },
    { original: '中央鉄工所', masked: 'デモ製作所A' },
    { original: 'ヤマザキマザック株式会社', masked: '株式会社デモ精密B' },
    { original: 'ヤマザキマザック', masked: 'デモ精密B' },
    { original: '水谷鉄工株式会社', masked: '株式会社デモ工業C' },
    { original: '水谷鉄工', masked: 'デモ工業C' },
    { original: '有限会社幸和エンジニアリング', masked: '有限会社デモエンジニアリングD' },
    { original: '幸和エンジニアリング', masked: 'デモエンジニアリングD' },
    { original: 'サンエイ工業', masked: 'デモインダストリーE' },
    { original: '和宏工業所', masked: 'デモファクトリーF' },
    { original: 'エバ工業', masked: 'デモテックG' },
    { original: '町屋金属工業株式会社', masked: '株式会社デモメタルH' },
    { original: '町屋金属工業', masked: 'デモメタルH' },
    { original: '大日金属工業株式会社', masked: '株式会社デモスチールI' },
    { original: '大日金属工業', masked: 'デモスチールI' },
    { original: '株式会社東昇技術', masked: '株式会社デモシステムJ' },
    { original: '東昇技術', masked: 'デモシステムJ' },
  ]
};

// ========================================
// ユーティリティ関数
// ========================================

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskText(text, mappings) {
  let result = text;
  for (const { original, masked } of mappings) {
    const regex = new RegExp(escapeRegExp(original), 'g');
    result = result.replace(regex, masked);
  }
  return result;
}

function maskJsonFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // 会社IDをマスク
    content = maskText(content, COMPANY_MASKING.ids);

    // 会社名をマスク
    content = maskText(content, COMPANY_MASKING.names);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`  ✗ ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('会社名マスキング開始');
  console.log('対象: public/data_demo');
  console.log('==========================================\n');

  let successCount = 0;
  let failCount = 0;

  // 1. companies.json
  console.log('[1/3] companies.json');
  const companiesPath = path.join(dataDir, 'companies.json');
  if (fs.existsSync(companiesPath)) {
    if (maskJsonFile(companiesPath)) successCount++; else failCount++;
  }

  // 2. search-index.json
  console.log('\n[2/3] search-index.json');
  const searchIndexPath = path.join(dataDir, 'search-index.json');
  if (fs.existsSync(searchIndexPath)) {
    if (maskJsonFile(searchIndexPath)) successCount++; else failCount++;
  }

  // 3. work-instructions/*/instruction.json
  console.log('\n[3/3] work-instructions/*/instruction.json');
  const workInstructionsDir = path.join(dataDir, 'work-instructions');
  if (fs.existsSync(workInstructionsDir)) {
    const drawingDirs = fs.readdirSync(workInstructionsDir).filter(item =>
      fs.statSync(path.join(workInstructionsDir, item)).isDirectory()
    );

    for (const drawingDir of drawingDirs) {
      const instructionPath = path.join(workInstructionsDir, drawingDir, 'instruction.json');
      if (fs.existsSync(instructionPath)) {
        if (maskJsonFile(instructionPath)) successCount++; else failCount++;
      }

      // contributions.json もあればマスク
      const contributionsPath = path.join(workInstructionsDir, drawingDir, 'contributions', 'contributions.json');
      if (fs.existsSync(contributionsPath)) {
        if (maskJsonFile(contributionsPath)) successCount++; else failCount++;
      }
    }
  }

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log(`  成功: ${successCount} ファイル`);
  console.log(`  失敗: ${failCount} ファイル`);
  console.log('==========================================');
}

// 実行
main();
