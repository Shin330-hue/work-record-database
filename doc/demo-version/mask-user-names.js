/**
 * 作業者名マスキングスクリプト
 * contributions.json 内の userId と userName を匿名化
 *
 * 使用方法:
 *   node doc/demo-version/mask-user-names.js
 */

const fs = require('fs');
const path = require('path');

// ========================================
// メイン処理
// ========================================

function main() {
  const dataDir = path.join(__dirname, '../../public/data_demo');
  const workInstructionsDir = path.join(dataDir, 'work-instructions');

  console.log('==========================================');
  console.log('作業者名マスキング');
  console.log('==========================================\n');

  // 1. 全contributions.jsonから作業者名を収集
  console.log('[1/3] 作業者名を収集');

  const userNames = new Set();
  const contributionFiles = [];

  const drawingDirs = fs.readdirSync(workInstructionsDir);

  for (const drawingDir of drawingDirs) {
    const contributionsPath = path.join(workInstructionsDir, drawingDir, 'contributions', 'contributions.json');

    if (fs.existsSync(contributionsPath)) {
      try {
        const content = fs.readFileSync(contributionsPath, 'utf8');
        const data = JSON.parse(content);

        contributionFiles.push({ path: contributionsPath, data });

        for (const contribution of data.contributions || []) {
          if (contribution.userName) {
            userNames.add(contribution.userName);
          }
          if (contribution.userId) {
            userNames.add(contribution.userId);
          }
        }
      } catch (error) {
        console.error(`  ✗ ${contributionsPath}: ${error.message}`);
      }
    }
  }

  console.log(`  作業者名: ${userNames.size} 人`);
  console.log(`  対象ファイル: ${contributionFiles.length} 件\n`);

  // 2. マッピングを作成
  console.log('[2/3] マッピングを作成');

  const userMapping = {};
  let index = 1;

  for (const userName of userNames) {
    userMapping[userName] = `作業者${String.fromCharCode(64 + index)}`; // 作業者A, 作業者B, ...
    index++;
  }

  console.log('  マッピング:');
  for (const [original, masked] of Object.entries(userMapping)) {
    console.log(`    ${original} → ${masked}`);
  }
  console.log('');

  // 3. ファイルを更新
  console.log('[3/3] ファイルを更新');

  let updatedCount = 0;

  for (const { path: filePath, data } of contributionFiles) {
    let changed = false;

    for (const contribution of data.contributions || []) {
      if (contribution.userName && userMapping[contribution.userName]) {
        contribution.userName = userMapping[contribution.userName];
        changed = true;
      }
      if (contribution.userId && userMapping[contribution.userId]) {
        contribution.userId = userMapping[contribution.userId];
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      const relativePath = path.relative(dataDir, filePath);
      console.log(`  ✓ ${relativePath}`);
      updatedCount++;
    }
  }

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log(`  更新: ${updatedCount} ファイル`);
  console.log('==========================================');
}

// 実行
main();
