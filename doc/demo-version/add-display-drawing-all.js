/**
 * 全図番に表示用図番を追加するスクリプト
 * 対象: テレ東(株)とワールドビジネスサテライト(株)以外の全図番
 *
 * 使用方法:
 *   node doc/demo-version/add-display-drawing-all.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 既存のマッピング（TV取材用2社）- スキップ対象
// ========================================
const EXISTING_MAPPINGS = {
  '91260506-2': 'TV-001',
  'SW-25P5-040': 'WBS-001',
  'SW-25P5-050': 'WBS-002',
  '119-151': 'WBS-003'
};

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('全図番に表示用図番を追加');
  console.log('==========================================\n');

  // 1. search-index.json から全図番を取得
  console.log('[1/2] search-index.json から図番一覧を取得');
  const searchIndexPath = path.join(dataDir, 'search-index.json');

  if (!fs.existsSync(searchIndexPath)) {
    console.error('  ✗ search-index.json が見つかりません');
    return;
  }

  const searchIndexContent = fs.readFileSync(searchIndexPath, 'utf8');
  const searchIndex = JSON.parse(searchIndexContent);

  // 既存マッピング以外の図番を抽出
  const otherDrawings = searchIndex.drawings.filter(
    d => !EXISTING_MAPPINGS[d.drawingNumber]
  );

  console.log(`  全図番数: ${searchIndex.drawings.length}`);
  console.log(`  既存マッピング: ${Object.keys(EXISTING_MAPPINGS).length}`);
  console.log(`  追加対象: ${otherDrawings.length}\n`);

  // 連番でマッピングを生成
  const newMappings = {};
  otherDrawings.forEach((drawing, index) => {
    const num = String(index + 1).padStart(3, '0');
    newMappings[drawing.drawingNumber] = `DRW-${num}`;
  });

  console.log('生成したマッピング:');
  Object.entries(newMappings).forEach(([original, display]) => {
    console.log(`  ${original} → ${display}`);
  });
  console.log('');

  let changedCount = 0;

  // 2. search-index.json に displayDrawingNumber を追加
  console.log('[2/2] データファイルを更新');

  // search-index.json を更新
  let searchIndexChanged = false;
  for (const entry of searchIndex.drawings) {
    if (newMappings[entry.drawingNumber] && !entry.displayDrawingNumber) {
      entry.displayDrawingNumber = newMappings[entry.drawingNumber];
      searchIndexChanged = true;
    }
  }

  if (searchIndexChanged) {
    fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex, null, 2), 'utf8');
    console.log('  ✓ search-index.json 更新完了');
    changedCount++;
  }

  // 各 instruction.json を更新
  const workInstructionsDir = path.join(dataDir, 'work-instructions');

  for (const [drawingNumber, displayNumber] of Object.entries(newMappings)) {
    const instructionPath = path.join(workInstructionsDir, `drawing-${drawingNumber}`, 'instruction.json');

    if (fs.existsSync(instructionPath)) {
      try {
        const content = fs.readFileSync(instructionPath, 'utf8');
        const data = JSON.parse(content);

        if (data.metadata && !data.metadata.displayDrawingNumber) {
          data.metadata.displayDrawingNumber = displayNumber;
          fs.writeFileSync(instructionPath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`  ✓ ${drawingNumber} → ${displayNumber}`);
          changedCount++;
        }
      } catch (error) {
        console.error(`  ✗ ${drawingNumber}: ${error.message}`);
      }
    }
  }

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log(`  変更: ${changedCount} ファイル`);
  console.log('==========================================');
}

// 実行
main();
