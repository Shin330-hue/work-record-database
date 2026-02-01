/**
 * TV取材用会社名変換スクリプト
 * 対象: public/data_demo 内のJSONファイル
 *
 * 変換内容:
 *   デモテックG → テレ東(株)
 *   デモシステムJ → ワールドビジネスサテライト(株)
 *
 * 使用方法:
 *   node doc/demo-version/rename-for-tv.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 変換設定
// ========================================
const TV_RENAMING = {
  // 会社ID
  ids: [
    { original: 'demo-tech-g', masked: 'tvtokyo' },
    { original: 'demo-system-j', masked: 'wbs' },
  ],

  // 会社名（長い順に並べる）
  names: [
    { original: '株式会社デモテックG', masked: 'テレ東(株)' },
    { original: 'デモテックG', masked: 'テレ東(株)' },
    { original: '株式会社デモシステムJ', masked: 'ワールドビジネスサテライト(株)' },
    { original: 'デモシステムJ', masked: 'ワールドビジネスサテライト(株)' },
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
    const originalContent = content;

    // 会社IDを変換
    content = maskText(content, TV_RENAMING.ids);

    // 会社名を変換
    content = maskText(content, TV_RENAMING.names);

    // 変更があった場合のみ書き込み
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ ${path.basename(filePath)} (変更あり)`);
      return { success: true, changed: true };
    } else {
      console.log(`  - ${path.basename(filePath)} (変更なし)`);
      return { success: true, changed: false };
    }
  } catch (error) {
    console.error(`  ✗ ${path.basename(filePath)}: ${error.message}`);
    return { success: false, changed: false };
  }
}

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('TV取材用会社名変換開始');
  console.log('対象: public/data_demo');
  console.log('==========================================\n');

  console.log('変換内容:');
  console.log('  デモテックG → テレ東(株)');
  console.log('  デモシステムJ → ワールドビジネスサテライト(株)');
  console.log('');

  let successCount = 0;
  let changedCount = 0;
  let failCount = 0;

  // 1. companies.json
  console.log('[1/3] companies.json');
  const companiesPath = path.join(dataDir, 'companies.json');
  if (fs.existsSync(companiesPath)) {
    const result = maskJsonFile(companiesPath);
    if (result.success) { successCount++; if (result.changed) changedCount++; }
    else failCount++;
  }

  // 2. search-index.json
  console.log('\n[2/3] search-index.json');
  const searchIndexPath = path.join(dataDir, 'search-index.json');
  if (fs.existsSync(searchIndexPath)) {
    const result = maskJsonFile(searchIndexPath);
    if (result.success) { successCount++; if (result.changed) changedCount++; }
    else failCount++;
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
        const result = maskJsonFile(instructionPath);
        if (result.success) { successCount++; if (result.changed) changedCount++; }
        else failCount++;
      }

      // contributions.json もあれば変換
      const contributionsPath = path.join(workInstructionsDir, drawingDir, 'contributions', 'contributions.json');
      if (fs.existsSync(contributionsPath)) {
        const result = maskJsonFile(contributionsPath);
        if (result.success) { successCount++; if (result.changed) changedCount++; }
        else failCount++;
      }
    }
  }

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log(`  処理: ${successCount} ファイル`);
  console.log(`  変更: ${changedCount} ファイル`);
  console.log(`  失敗: ${failCount} ファイル`);
  console.log('==========================================');
}

// 実行
main();
