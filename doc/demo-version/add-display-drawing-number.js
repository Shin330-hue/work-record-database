/**
 * 表示用図番追加スクリプト
 * 対象: テレ東(株)とワールドビジネスサテライト(株)の製品のみ
 *
 * 使用方法:
 *   node doc/demo-version/add-display-drawing-number.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 表示用図番マッピング
// ========================================
const DISPLAY_DRAWING_MAP = {
  '91260506-2': 'TV-001',      // テレ東
  'SW-25P5-040': 'WBS-001',    // WBS
  'SW-25P5-050': 'WBS-002',    // WBS
  '119-151': 'WBS-003'         // WBS
};

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('表示用図番追加開始');
  console.log('==========================================\n');

  console.log('マッピング:');
  Object.entries(DISPLAY_DRAWING_MAP).forEach(([original, display]) => {
    console.log(`  ${original} → ${display}`);
  });
  console.log('');

  let changedCount = 0;

  // 1. instruction.json に displayDrawingNumber を追加
  console.log('[1/2] instruction.json');
  const workInstructionsDir = path.join(dataDir, 'work-instructions');

  for (const [drawingNumber, displayNumber] of Object.entries(DISPLAY_DRAWING_MAP)) {
    const instructionPath = path.join(workInstructionsDir, `drawing-${drawingNumber}`, 'instruction.json');

    if (fs.existsSync(instructionPath)) {
      try {
        const content = fs.readFileSync(instructionPath, 'utf8');
        const data = JSON.parse(content);

        if (data.metadata) {
          data.metadata.displayDrawingNumber = displayNumber;
          fs.writeFileSync(instructionPath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`  ✓ ${drawingNumber} → displayDrawingNumber: ${displayNumber}`);
          changedCount++;
        }
      } catch (error) {
        console.error(`  ✗ ${drawingNumber}: ${error.message}`);
      }
    } else {
      console.log(`  - ${drawingNumber} (ファイルなし)`);
    }
  }

  // 2. search-index.json に displayDrawingNumber を追加
  console.log('\n[2/2] search-index.json');
  const searchIndexPath = path.join(dataDir, 'search-index.json');

  if (fs.existsSync(searchIndexPath)) {
    try {
      const content = fs.readFileSync(searchIndexPath, 'utf8');
      const data = JSON.parse(content);
      let indexChanged = false;

      for (const entry of data.drawings) {
        if (DISPLAY_DRAWING_MAP[entry.drawingNumber]) {
          entry.displayDrawingNumber = DISPLAY_DRAWING_MAP[entry.drawingNumber];
          console.log(`  ✓ ${entry.drawingNumber} → ${entry.displayDrawingNumber}`);
          indexChanged = true;
        }
      }

      if (indexChanged) {
        fs.writeFileSync(searchIndexPath, JSON.stringify(data, null, 2), 'utf8');
        console.log('  ✓ search-index.json 更新完了');
        changedCount++;
      }
    } catch (error) {
      console.error(`  ✗ search-index.json: ${error.message}`);
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
