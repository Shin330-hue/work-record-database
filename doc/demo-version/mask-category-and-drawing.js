/**
 * カテゴリ名と図番マスキングスクリプト
 * - カテゴリ名: カテゴリA, カテゴリB... 形式に変換
 * - 図番: 表示用のみマスキング（フォルダ名はそのまま）
 *
 * 使用方法:
 *   node doc/demo-version/mask-category-and-drawing.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// スキップ対象の会社ID
// ========================================
const SKIP_COMPANY_IDS = ['tvtokyo', 'wbs'];

// ========================================
// 汎用部品カテゴリ名リスト
// ========================================
const GENERIC_CATEGORIES = [
  'シャフト部品', 'ギア部品', 'ハウジング', 'ベアリング部品',
  'プレート部品', 'ブロック', 'スリーブ', 'カラー部品',
  'フランジ部品', 'カバー部品', 'ケース', 'ボディ部品',
  'サポート', 'ホルダー', 'アダプター', 'ジョイント',
  'コネクタ', 'マウント', 'ブラケット部品', 'フレーム部品',
  'ベース部品', 'プーリー', 'スプロケット', 'カップリング',
  'リテーナ部品', 'スペーサー', 'ワッシャー', 'ブッシュ',
  'ピン部品', 'ローラー', 'ガイド部品', 'レール部品',
  'クランプ', 'チャック', 'コレット', 'アーバー'
];

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');

  console.log('==========================================');
  console.log('カテゴリ名・図番マスキング');
  console.log('==========================================\n');

  // 1. companies.json を読み込み
  console.log('[1/4] companies.json を読み込み');
  const companiesPath = path.join(dataDir, 'companies.json');
  const companiesContent = fs.readFileSync(companiesPath, 'utf8');
  const companiesData = JSON.parse(companiesContent);

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
  console.log(`  スキップ対象図番: ${skipDrawings.size} 件`);

  // 2. カテゴリ名マッピング作成
  console.log('\n[2/4] カテゴリ名マッピングを作成');
  const categoryMapping = {};
  let categoryIndex = 0;

  for (const company of companiesData.companies) {
    if (SKIP_COMPANY_IDS.includes(company.id)) {
      console.log(`  スキップ: ${company.name}`);
      continue;
    }

    for (const product of company.products || []) {
      if (product.category && !categoryMapping[product.category]) {
        categoryMapping[product.category] = GENERIC_CATEGORIES[categoryIndex % GENERIC_CATEGORIES.length];
        categoryIndex++;
      }
    }
  }
  console.log(`  カテゴリマッピング数: ${Object.keys(categoryMapping).length}`);

  // 3. 図番マッピング作成（表示用）
  console.log('\n[3/4] 図番マッピングを作成');
  const drawingMapping = {};
  let drawingIndex = 1;

  for (const company of companiesData.companies) {
    if (SKIP_COMPANY_IDS.includes(company.id)) continue;

    for (const product of company.products || []) {
      for (const drawing of product.drawings || []) {
        if (!drawingMapping[drawing]) {
          drawingMapping[drawing] = `DRW-${String(drawingIndex).padStart(3, '0')}`;
          drawingIndex++;
        }
      }
    }
  }
  console.log(`  図番マッピング数: ${Object.keys(drawingMapping).length}`);

  // 4. companies.json のカテゴリを更新
  console.log('\n[4/4] データファイルを更新');

  let companiesUpdated = 0;
  for (const company of companiesData.companies) {
    if (SKIP_COMPANY_IDS.includes(company.id)) continue;

    for (const product of company.products || []) {
      if (product.category && categoryMapping[product.category]) {
        product.category = categoryMapping[product.category];
        companiesUpdated++;
      }
    }
  }
  fs.writeFileSync(companiesPath, JSON.stringify(companiesData, null, 2), 'utf8');
  console.log(`  ✓ companies.json: ${companiesUpdated} 件カテゴリ更新`);

  // 5. search-index.json を更新
  const searchIndexPath = path.join(dataDir, 'search-index.json');
  const searchIndexContent = fs.readFileSync(searchIndexPath, 'utf8');
  const searchIndex = JSON.parse(searchIndexContent);

  let searchIndexUpdated = 0;
  for (const drawing of searchIndex.drawings) {
    if (skipDrawings.has(drawing.drawingNumber)) continue;

    // カテゴリ更新
    if (drawing.category && categoryMapping[drawing.category]) {
      drawing.category = categoryMapping[drawing.category];
      searchIndexUpdated++;
    }

    // 表示用図番を追加
    if (drawingMapping[drawing.drawingNumber]) {
      drawing.displayDrawingNumber = drawingMapping[drawing.drawingNumber];
    }
  }
  fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex, null, 2), 'utf8');
  console.log(`  ✓ search-index.json: ${searchIndexUpdated} 件カテゴリ更新`);

  // 6. instruction.json を更新
  const workInstructionsDir = path.join(dataDir, 'work-instructions');
  let instructionUpdated = 0;

  if (fs.existsSync(workInstructionsDir)) {
    const drawingFolders = fs.readdirSync(workInstructionsDir);

    for (const folder of drawingFolders) {
      if (!folder.startsWith('drawing-')) continue;

      const drawingNumber = folder.replace('drawing-', '');
      if (skipDrawings.has(drawingNumber)) continue;

      const instructionPath = path.join(workInstructionsDir, folder, 'instruction.json');

      if (fs.existsSync(instructionPath)) {
        try {
          const instructionContent = fs.readFileSync(instructionPath, 'utf8');
          const instruction = JSON.parse(instructionContent);
          let changed = false;

          // カテゴリ更新
          if (instruction.metadata?.category && categoryMapping[instruction.metadata.category]) {
            instruction.metadata.category = categoryMapping[instruction.metadata.category];
            changed = true;
          }

          // 表示用図番を設定
          if (drawingMapping[drawingNumber]) {
            instruction.metadata.displayDrawingNumber = drawingMapping[drawingNumber];
            changed = true;
          }

          // overview.description の図番を置換
          if (instruction.overview?.description) {
            const originalDesc = instruction.overview.description;
            // 図番部分を表示用に置換
            if (drawingMapping[drawingNumber] && originalDesc.includes(drawingNumber)) {
              instruction.overview.description = originalDesc.replace(
                drawingNumber,
                drawingMapping[drawingNumber]
              );
              changed = true;
            }
          }

          // title内の図番も置換
          if (instruction.metadata?.title && drawingMapping[drawingNumber]) {
            if (instruction.metadata.title.includes(drawingNumber)) {
              instruction.metadata.title = instruction.metadata.title.replace(
                drawingNumber,
                drawingMapping[drawingNumber]
              );
              changed = true;
            }
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
  }
  console.log(`  ✓ instruction.json: ${instructionUpdated} 件更新`);

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log('==========================================');

  console.log('\nカテゴリマッピング一覧:');
  for (const [original, masked] of Object.entries(categoryMapping)) {
    console.log(`  ${original} → ${masked}`);
  }

  console.log(`\n図番マッピング: ${Object.keys(drawingMapping).length} 件`);
  // 最初の10件だけ表示
  const entries = Object.entries(drawingMapping).slice(0, 10);
  for (const [original, masked] of entries) {
    console.log(`  ${original} → ${masked}`);
  }
  if (Object.keys(drawingMapping).length > 10) {
    console.log(`  ... 他 ${Object.keys(drawingMapping).length - 10} 件`);
  }
}

// 実行
main();
