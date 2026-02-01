/**
 * 製品名マスキングスクリプト
 * テレ東(株)とワールドビジネスサテライト(株)以外の製品名をマスキング
 *
 * 使用方法:
 *   node doc/demo-version/mask-product-names.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// スキップ対象の会社ID
// ========================================
const SKIP_COMPANY_IDS = ['tvtokyo', 'wbs'];

// ========================================
// 汎用部品名リスト（ランダムに割り当て）
// ========================================
const GENERIC_PARTS = [
  '部品ユニットA', '部品ユニットB', '部品ユニットC', '部品ユニットD',
  'パーツセットE', 'パーツセットF', 'パーツセットG', 'パーツセットH',
  'コンポーネントI', 'コンポーネントJ', 'コンポーネントK', 'コンポーネントL',
  'アッセンブリM', 'アッセンブリN', 'アッセンブリO', 'アッセンブリP',
  '機構部品Q', '機構部品R', '機構部品S', '機構部品T',
  '加工品U', '加工品V', '加工品W', '加工品X',
  '構成部品Y', '構成部品Z', '構成部品AA', '構成部品AB',
  'モジュールAC', 'モジュールAD', 'モジュールAE', 'モジュールAF',
  'エレメントAG', 'エレメントAH', 'エレメントAI', 'エレメントAJ',
  'ユニットAK', 'ユニットAL', 'ユニットAM', 'ユニットAN',
  'パートAO', 'パートAP', 'パートAQ', 'パートAR',
  '部材AS', '部材AT', '部材AU', '部材AV',
  '製作品AW', '製作品AX', '製作品AY', '製作品AZ',
  '加工部品BA', '加工部品BB', '加工部品BC', '加工部品BD',
  '機械部品BE', '機械部品BF', '機械部品BG', '機械部品BH',
  '精密部品BI', '精密部品BJ', '精密部品BK', '精密部品BL',
  '金属部品BM', '金属部品BN', '金属部品BO', '金属部品BP',
  '特注品BQ', '特注品BR', '特注品BS', '特注品BT',
  '試作品BU', '試作品BV', '試作品BW', '試作品BX',
  'サンプルBY', 'サンプルBZ', 'サンプルCA', 'サンプルCB'
];

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('製品名マスキング');
  console.log('==========================================\n');

  // 1. companies.json から製品名を収集してマッピング作成
  console.log('[1/3] 製品名マッピングを作成');

  const companiesPath = path.join(dataDir, 'companies.json');
  const companiesContent = fs.readFileSync(companiesPath, 'utf8');
  const companiesData = JSON.parse(companiesContent);

  // 製品名 → マスク名のマッピング
  const productNameMapping = {};
  let partIndex = 0;

  // スキップ対象以外の製品名を収集
  for (const company of companiesData.companies) {
    if (SKIP_COMPANY_IDS.includes(company.id)) {
      console.log(`  スキップ: ${company.name}`);
      continue;
    }

    for (const product of company.products || []) {
      if (product.name && !productNameMapping[product.name]) {
        productNameMapping[product.name] = GENERIC_PARTS[partIndex % GENERIC_PARTS.length];
        partIndex++;
      }
    }
  }

  console.log(`  マッピング数: ${Object.keys(productNameMapping).length}`);

  // 2. companies.json を更新
  console.log('\n[2/3] companies.json を更新');

  for (const company of companiesData.companies) {
    if (SKIP_COMPANY_IDS.includes(company.id)) continue;

    for (const product of company.products || []) {
      if (product.name && productNameMapping[product.name]) {
        product.name = productNameMapping[product.name];
      }
      if (product.description && productNameMapping[product.description]) {
        product.description = productNameMapping[product.description];
      }
    }
  }

  fs.writeFileSync(companiesPath, JSON.stringify(companiesData, null, 2), 'utf8');
  console.log('  ✓ companies.json 更新完了');

  // 3. search-index.json を更新
  console.log('\n[3/3] search-index.json と instruction.json を更新');

  const searchIndexPath = path.join(dataDir, 'search-index.json');
  const searchIndexContent = fs.readFileSync(searchIndexPath, 'utf8');
  const searchIndex = JSON.parse(searchIndexContent);

  // スキップ対象の図番を収集
  const skipDrawings = new Set();
  for (const company of companiesData.companies) {
    if (SKIP_COMPANY_IDS.includes(company.id)) {
      for (const product of company.products || []) {
        for (const drawing of product.drawings || []) {
          skipDrawings.add(drawing);
        }
      }
    }
  }

  let searchIndexUpdated = 0;
  let instructionUpdated = 0;

  for (const drawing of searchIndex.drawings) {
    if (skipDrawings.has(drawing.drawingNumber)) continue;

    if (drawing.productName && productNameMapping[drawing.productName]) {
      drawing.productName = productNameMapping[drawing.productName];
      searchIndexUpdated++;
    }

    // instruction.json も更新
    const instructionPath = path.join(dataDir, 'work-instructions', `drawing-${drawing.drawingNumber}`, 'instruction.json');
    if (fs.existsSync(instructionPath)) {
      try {
        const instructionContent = fs.readFileSync(instructionPath, 'utf8');
        const instruction = JSON.parse(instructionContent);
        let changed = false;

        if (instruction.metadata?.productName && productNameMapping[instruction.metadata.productName]) {
          instruction.metadata.productName = productNameMapping[instruction.metadata.productName];
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(instructionPath, JSON.stringify(instruction, null, 2), 'utf8');
          instructionUpdated++;
        }
      } catch (error) {
        // ignore
      }
    }
  }

  fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex, null, 2), 'utf8');
  console.log(`  ✓ search-index.json: ${searchIndexUpdated} 件更新`);
  console.log(`  ✓ instruction.json: ${instructionUpdated} 件更新`);

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log('==========================================');

  console.log('\nマッピング一覧:');
  for (const [original, masked] of Object.entries(productNameMapping)) {
    console.log(`  ${original} → ${masked}`);
  }
}

// 実行
main();
