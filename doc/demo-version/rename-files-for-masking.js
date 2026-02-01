/**
 * PDFファイル・プログラムファイル名のマスキングスクリプト
 * ファイル名に含まれる図番を displayDrawingNumber に置換
 *
 * 使用方法:
 *   node doc/demo-version/rename-files-for-masking.js
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
  console.log('PDF・プログラムファイル名マスキング');
  console.log('==========================================\n');

  // 1. search-index.json から図番とマッピングを取得
  console.log('[1/2] マッピング情報を取得');
  const searchIndexPath = path.join(dataDir, 'search-index.json');

  if (!fs.existsSync(searchIndexPath)) {
    console.error('  ✗ search-index.json が見つかりません');
    return;
  }

  const searchIndexContent = fs.readFileSync(searchIndexPath, 'utf8');
  const searchIndex = JSON.parse(searchIndexContent);

  // displayDrawingNumber を持つ図番のマッピングを作成
  const drawingMap = {};
  for (const drawing of searchIndex.drawings) {
    if (drawing.displayDrawingNumber) {
      drawingMap[drawing.drawingNumber] = drawing.displayDrawingNumber;
    }
  }

  console.log(`  マッピング数: ${Object.keys(drawingMap).length}`);

  // 2. 各図番フォルダのファイルをリネーム
  console.log('\n[2/2] ファイルをリネーム');

  let totalRenamed = 0;
  const errors = [];

  // 図番を長さ順にソート（長いものから置換することで部分一致の問題を回避）
  const sortedDrawingNumbers = Object.keys(drawingMap).sort((a, b) => b.length - a.length);

  for (const drawingNumber of sortedDrawingNumbers) {
    const displayNumber = drawingMap[drawingNumber];
    const drawingDir = path.join(workInstructionsDir, `drawing-${drawingNumber}`);

    if (!fs.existsSync(drawingDir)) {
      continue;
    }

    // pdfs と programs フォルダを処理
    for (const folderType of ['pdfs', 'programs']) {
      const folderPath = path.join(drawingDir, folderType);

      if (!fs.existsSync(folderPath)) {
        continue;
      }

      // サブフォルダ（overview, step-1, step-2, ...）を走査
      const subFolders = fs.readdirSync(folderPath);

      for (const subFolder of subFolders) {
        const subFolderPath = path.join(folderPath, subFolder);

        if (!fs.statSync(subFolderPath).isDirectory()) {
          continue;
        }

        // フォルダ内のファイルを処理
        const files = fs.readdirSync(subFolderPath);

        for (const fileName of files) {
          const filePath = path.join(subFolderPath, fileName);

          if (!fs.statSync(filePath).isFile()) {
            continue;
          }

          // ファイル名に図番が含まれているかチェック
          if (fileName.includes(drawingNumber)) {
            // 図番を displayDrawingNumber に置換
            const newFileName = fileName.replace(new RegExp(escapeRegExp(drawingNumber), 'g'), displayNumber);
            const newFilePath = path.join(subFolderPath, newFileName);

            try {
              fs.renameSync(filePath, newFilePath);
              console.log(`  ✓ ${drawingNumber}/${folderType}/${subFolder}:`);
              console.log(`      ${fileName}`);
              console.log(`    → ${newFileName}`);
              totalRenamed++;
            } catch (error) {
              errors.push({ file: filePath, error: error.message });
              console.error(`  ✗ ${filePath}: ${error.message}`);
            }
          }
        }
      }
    }
  }

  // 結果表示
  console.log('\n==========================================');
  console.log('完了');
  console.log(`  リネーム: ${totalRenamed} ファイル`);
  if (errors.length > 0) {
    console.log(`  エラー: ${errors.length} 件`);
  }
  console.log('==========================================');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 実行
main();
