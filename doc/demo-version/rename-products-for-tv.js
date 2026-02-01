/**
 * TV取材用製品名変換スクリプト
 * 対象: テレ東(株)とワールドビジネスサテライト(株)の製品のみ
 *
 * 変換内容:
 *   レール → リング
 *   フレーム → ブラケット
 *
 * 使用方法:
 *   node doc/demo-version/rename-products-for-tv.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// 対象の会社と図番
// ========================================
const TARGET_COMPANIES = ['tvtokyo', 'wbs'];
const TARGET_DRAWINGS = [
  '91260506-2',      // テレ東: レール→リング
  'SW-25P5-040',     // WBS: フレーム→ブラケット
  'SW-25P5-050',     // WBS: フレーム→ブラケット
  '119-151'          // WBS: フレーム→ブラケット
];

// 製品名変換
const PRODUCT_RENAMING = [
  { original: 'レール', masked: 'リング' },
  { original: 'フレーム', masked: 'ブラケット' },
];

// ========================================
// ユーティリティ関数
// ========================================

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renameText(text, mappings) {
  let result = text;
  for (const { original, masked } of mappings) {
    const regex = new RegExp(escapeRegExp(original), 'g');
    result = result.replace(regex, masked);
  }
  return result;
}

// ========================================
// companies.json の変換（対象会社のみ）
// ========================================
function processCompaniesJson(filePath) {
  console.log('[1/3] companies.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    let changed = false;

    for (const company of data.companies) {
      if (TARGET_COMPANIES.includes(company.id)) {
        for (const product of company.products) {
          const originalName = product.name;
          const originalCategory = product.category;
          const originalDesc = product.description;

          product.name = renameText(product.name, PRODUCT_RENAMING);
          product.category = renameText(product.category, PRODUCT_RENAMING);
          product.description = renameText(product.description, PRODUCT_RENAMING);

          if (product.name !== originalName ||
              product.category !== originalCategory ||
              product.description !== originalDesc) {
            console.log(`    ${originalName} → ${product.name}`);
            changed = true;
          }
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('  ✓ companies.json (変更あり)');
    } else {
      console.log('  - companies.json (変更なし)');
    }
    return { success: true, changed };
  } catch (error) {
    console.error(`  ✗ companies.json: ${error.message}`);
    return { success: false, changed: false };
  }
}

// ========================================
// search-index.json の変換（対象図番のみ）
// ========================================
function processSearchIndex(filePath) {
  console.log('\n[2/3] search-index.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    let changed = false;

    for (const entry of data.drawings) {
      if (TARGET_DRAWINGS.includes(entry.drawingNumber)) {
        const originalProduct = entry.productName;
        const originalTitle = entry.title;
        const originalCategory = entry.category;

        entry.productName = renameText(entry.productName, PRODUCT_RENAMING);
        entry.title = renameText(entry.title, PRODUCT_RENAMING);
        entry.category = renameText(entry.category, PRODUCT_RENAMING);

        if (entry.productName !== originalProduct ||
            entry.title !== originalTitle ||
            entry.category !== originalCategory) {
          console.log(`    ${entry.drawingNumber}: ${originalProduct} → ${entry.productName}`);
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('  ✓ search-index.json (変更あり)');
    } else {
      console.log('  - search-index.json (変更なし)');
    }
    return { success: true, changed };
  } catch (error) {
    console.error(`  ✗ search-index.json: ${error.message}`);
    return { success: false, changed: false };
  }
}

// ========================================
// instruction.json の変換（対象図番のみ）
// ========================================
function processInstructionFiles(workInstructionsDir) {
  console.log('\n[3/3] work-instructions/*/instruction.json');
  let successCount = 0;
  let changedCount = 0;

  if (!fs.existsSync(workInstructionsDir)) {
    console.log('  ディレクトリが見つかりません');
    return { successCount, changedCount };
  }

  for (const drawingNumber of TARGET_DRAWINGS) {
    const drawingDir = path.join(workInstructionsDir, `drawing-${drawingNumber}`);
    const instructionPath = path.join(drawingDir, 'instruction.json');

    if (fs.existsSync(instructionPath)) {
      try {
        const content = fs.readFileSync(instructionPath, 'utf8');
        const data = JSON.parse(content);
        let changed = false;

        // metadata.title を変換
        if (data.metadata && data.metadata.title) {
          const original = data.metadata.title;
          data.metadata.title = renameText(data.metadata.title, PRODUCT_RENAMING);
          if (data.metadata.title !== original) {
            console.log(`    ${drawingNumber} title: ${original} → ${data.metadata.title}`);
            changed = true;
          }
        }

        // overview.description を変換
        if (data.overview && data.overview.description) {
          const original = data.overview.description;
          data.overview.description = renameText(data.overview.description, PRODUCT_RENAMING);
          if (data.overview.description !== original) {
            console.log(`    ${drawingNumber} desc: 変換済み`);
            changed = true;
          }
        }

        if (changed) {
          fs.writeFileSync(instructionPath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`  ✓ drawing-${drawingNumber}/instruction.json (変更あり)`);
          changedCount++;
        } else {
          console.log(`  - drawing-${drawingNumber}/instruction.json (変更なし)`);
        }
        successCount++;
      } catch (error) {
        console.error(`  ✗ drawing-${drawingNumber}/instruction.json: ${error.message}`);
      }
    } else {
      console.log(`  - drawing-${drawingNumber} (ファイルなし)`);
    }
  }

  return { successCount, changedCount };
}

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('TV取材用製品名変換開始');
  console.log('対象: テレ東(株), ワールドビジネスサテライト(株)');
  console.log('==========================================\n');

  console.log('変換内容:');
  PRODUCT_RENAMING.forEach(({ original, masked }) => {
    console.log(`  ${original} → ${masked}`);
  });
  console.log('');

  let totalChanged = 0;

  // 1. companies.json
  const companiesPath = path.join(dataDir, 'companies.json');
  const r1 = processCompaniesJson(companiesPath);
  if (r1.changed) totalChanged++;

  // 2. search-index.json
  const searchIndexPath = path.join(dataDir, 'search-index.json');
  const r2 = processSearchIndex(searchIndexPath);
  if (r2.changed) totalChanged++;

  // 3. instruction.json
  const workInstructionsDir = path.join(dataDir, 'work-instructions');
  const r3 = processInstructionFiles(workInstructionsDir);
  totalChanged += r3.changedCount;

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log(`  変更: ${totalChanged} ファイル`);
  console.log('==========================================');
}

// 実行
main();
