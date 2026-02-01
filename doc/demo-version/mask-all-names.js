/**
 * 全ての名前情報マスキングスクリプト
 * - auth/passwords.json のユーザー情報
 * - instruction.json の author フィールド
 * - contributions.json の userName, userId
 *
 * 使用方法:
 *   node doc/demo-version/mask-all-names.js
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
  console.log('全名前情報マスキング');
  console.log('==========================================\n');

  // 収集した全ての名前
  const allNames = new Set();

  // ========================================
  // 1. passwords.json からユーザー情報を収集
  // ========================================
  console.log('[1/4] passwords.json からユーザー情報を収集');

  const passwordsPath = path.join(dataDir, 'auth', 'passwords.json');
  let passwordsData = null;

  if (fs.existsSync(passwordsPath)) {
    const content = fs.readFileSync(passwordsPath, 'utf8');
    passwordsData = JSON.parse(content);

    for (const user of passwordsData.passwords || []) {
      if (user.name && user.name !== '管理者') allNames.add(user.name);
      if (user.displayName && user.displayName !== '管理者') allNames.add(user.displayName);
      if (user.id && !['admin'].includes(user.id)) allNames.add(user.id);
    }
  }

  // ========================================
  // 2. instruction.json から author を収集
  // ========================================
  console.log('[2/4] instruction.json から author を収集');

  const instructionFiles = [];
  const systemAuthors = ['管理画面', 'データ移行', 'Claude', 'システム'];

  const drawingDirs = fs.readdirSync(workInstructionsDir);

  for (const drawingDir of drawingDirs) {
    const instructionPath = path.join(workInstructionsDir, drawingDir, 'instruction.json');

    if (fs.existsSync(instructionPath)) {
      try {
        const content = fs.readFileSync(instructionPath, 'utf8');
        const data = JSON.parse(content);
        instructionFiles.push({ path: instructionPath, data });

        // metadata.author
        if (data.metadata?.author && !systemAuthors.includes(data.metadata.author)) {
          allNames.add(data.metadata.author);
        }

        // steps[].author
        for (const step of data.steps || []) {
          if (step.author && !systemAuthors.includes(step.author)) {
            allNames.add(step.author);
          }
        }
      } catch (error) {
        // ignore
      }
    }
  }

  // ========================================
  // 3. contributions.json から userName/userId を収集
  // ========================================
  console.log('[3/4] contributions.json から userName/userId を収集');

  const contributionFiles = [];

  for (const drawingDir of drawingDirs) {
    const contributionsPath = path.join(workInstructionsDir, drawingDir, 'contributions', 'contributions.json');

    if (fs.existsSync(contributionsPath)) {
      try {
        const content = fs.readFileSync(contributionsPath, 'utf8');
        const data = JSON.parse(content);
        contributionFiles.push({ path: contributionsPath, data });

        for (const contribution of data.contributions || []) {
          if (contribution.userName) allNames.add(contribution.userName);
          if (contribution.userId) allNames.add(contribution.userId);
        }
      } catch (error) {
        // ignore
      }
    }
  }

  // ========================================
  // マッピングを作成
  // ========================================
  console.log('\n  収集した名前:');

  // 既にマスキング済みの名前を除外
  const namesToMask = [...allNames].filter(name => !name.startsWith('作業者'));

  console.log(`    合計: ${namesToMask.length} 件`);

  // マッピング作成（A, B, C, ... AA, AB, ...）
  const nameMapping = {};
  let index = 0;

  for (const name of namesToMask) {
    const letter = index < 26
      ? String.fromCharCode(65 + index)
      : String.fromCharCode(65 + Math.floor(index / 26) - 1) + String.fromCharCode(65 + (index % 26));
    nameMapping[name] = `作業者${letter}`;
    index++;
  }

  console.log('\n  マッピング:');
  for (const [original, masked] of Object.entries(nameMapping)) {
    console.log(`    ${original} → ${masked}`);
  }

  // ========================================
  // 4. ファイルを更新
  // ========================================
  console.log('\n[4/4] ファイルを更新');

  let updatedCount = 0;

  // passwords.json を更新
  if (passwordsData) {
    let changed = false;

    for (const user of passwordsData.passwords || []) {
      if (user.id === 'admin') continue; // 管理者はスキップ

      if (user.name && nameMapping[user.name]) {
        user.name = nameMapping[user.name];
        changed = true;
      }
      if (user.displayName && nameMapping[user.displayName]) {
        user.displayName = nameMapping[user.displayName];
        changed = true;
      }
      if (user.id && nameMapping[user.id]) {
        // IDもマスキング（ローマ字 → user_a, user_b, ...）
        const maskedName = nameMapping[user.id];
        const letter = maskedName.replace('作業者', '').toLowerCase();
        user.id = `user_${letter}`;
        user.password = `Demo@2025`; // パスワードも統一
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(passwordsPath, JSON.stringify(passwordsData, null, 2), 'utf8');
      console.log('  ✓ auth/passwords.json');
      updatedCount++;
    }
  }

  // instruction.json を更新
  for (const { path: filePath, data } of instructionFiles) {
    let changed = false;

    if (data.metadata?.author && nameMapping[data.metadata.author]) {
      data.metadata.author = nameMapping[data.metadata.author];
      changed = true;
    }

    for (const step of data.steps || []) {
      if (step.author && nameMapping[step.author]) {
        step.author = nameMapping[step.author];
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

  // contributions.json を更新
  for (const { path: filePath, data } of contributionFiles) {
    let changed = false;

    for (const contribution of data.contributions || []) {
      if (contribution.userName && nameMapping[contribution.userName]) {
        contribution.userName = nameMapping[contribution.userName];
        changed = true;
      }
      if (contribution.userId && nameMapping[contribution.userId]) {
        contribution.userId = nameMapping[contribution.userId];
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
