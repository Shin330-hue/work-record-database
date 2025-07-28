// src/lib/drawingUtils.ts - 図番管理ユーティリティ

import { mkdir, writeFile, readFile, access } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { sanitizeDrawingNumber } from './dataLoader'
import { Company, Product, SearchIndex, WorkInstruction } from './dataLoader'

// 環境に応じたデータパス取得
function getDataPath(): string {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATA_ROOT_PATH || '/mnt/nas/project-data'
  }
  
  if (process.env.USE_NAS === 'true') {
    return process.env.DATA_ROOT_PATH || '/mnt/project-nas/project-data'
  }
  
  return process.env.DEV_DATA_ROOT_PATH || './public/data'
}

// ID生成ユーティリティ
export function generateCompanyId(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30)
}

export function generateProductId(productName: string): string {
  // 製品名ベースのユニークID
  const sanitized = productName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '').substring(0, 10)
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substr(2, 4)
  return `product-${sanitized}-${timestamp}-${random}`
}

// フォルダ階層作成
export async function createDrawingDirectoryStructure(drawingNumber: string): Promise<void> {
  const safeDrawingNumber = sanitizeDrawingNumber(drawingNumber)
  const basePath = path.join(getDataPath(), 'work-instructions', `drawing-${safeDrawingNumber}`)
  
  // 運用手順書準拠の必須フォルダ一覧
  const requiredDirectories = [
    'images/overview',
    'images/step_01',
    'images/step_02',
    'images/step_03',
    'videos/overview',
    'videos/step_01',
    'videos/step_02',
    'videos/step_03',
    'pdfs/overview',      // PDFファイルはここに配置
    'pdfs/step_01',
    'pdfs/step_02',
    'pdfs/step_03',
    'programs/overview',   // dxfファイルはここに配置
    'programs/step_01',
    'programs/step_02',
    'programs/step_03',
    'contributions/files/images',  // 追記用
    'contributions/files/videos'   // 追記用
  ]
  
  // 並列でフォルダ作成（高速化）
  await Promise.all(
    requiredDirectories.map(async (dir) => {
      const fullPath = path.join(basePath, dir)
      try {
        await mkdir(fullPath, { recursive: true })
      } catch (error) {
        // フォルダが既に存在する場合は無視
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error
        }
      }
    })
  )
  
  console.log(`✅ フォルダ階層作成完了: drawing-${safeDrawingNumber}`)
}

// PDFファイル保存（pdfs/overview/に配置）
export async function savePdfFile(drawingNumber: string, pdfFile: File): Promise<string> {
  const safeDrawingNumber = sanitizeDrawingNumber(drawingNumber)
  const fileName = `${safeDrawingNumber}.pdf`
  const basePath = path.join(getDataPath(), 'work-instructions', `drawing-${safeDrawingNumber}`)
  const filePath = path.join(basePath, 'pdfs', 'overview', fileName)
  
  // ファイル検証
  if (!pdfFile.type.includes('pdf')) {
    throw new Error('PDFファイルのみアップロード可能です')
  }
  
  if (pdfFile.size > 10 * 1024 * 1024) { // 10MB制限
    throw new Error('ファイルサイズが大きすぎます（10MB以下にしてください）')
  }
  
  // バッファに変換して保存
  const buffer = await pdfFile.arrayBuffer()
  await writeFile(filePath, Buffer.from(buffer))
  
  console.log(`✅ PDFファイル保存完了: ${fileName}`)
  return fileName
}

// 図番重複チェック
export async function checkDrawingNumberExists(drawingNumber: string): Promise<boolean> {
  const safeDrawingNumber = sanitizeDrawingNumber(drawingNumber)
  const basePath = path.join(getDataPath(), 'work-instructions', `drawing-${safeDrawingNumber}`)
  
  try {
    await access(basePath)
    return true
  } catch {
    return false
  }
}

// 複数図番の一括重複チェック
export async function checkMultipleDrawingNumbers(drawingNumbers: string[]): Promise<string[]> {
  const duplicates: string[] = []
  
  await Promise.all(
    drawingNumbers.map(async (drawingNumber) => {
      const exists = await checkDrawingNumberExists(drawingNumber)
      if (exists) {
        duplicates.push(drawingNumber)
      }
    })
  )
  
  return duplicates
}

// 基本的なinstruction.json生成
export function generateBasicInstruction(data: {
  drawingNumber: string
  title: string
  companyId: string
  productId: string
  difficulty: string
  estimatedTime: string
  machineType: string
  description?: string
  warnings?: string[]
}): WorkInstruction {
  const totalTime = parseInt(data.estimatedTime) || 180
  const prepTime = Math.min(30, Math.floor(totalTime * 0.2))
  const processTime = totalTime - prepTime
  
  return {
    metadata: {
      drawingNumber: data.drawingNumber,
      title: data.title,
      companyId: data.companyId,
      productId: data.productId,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      author: "管理画面",
      estimatedTime: `${data.estimatedTime}分`,
      machineType: data.machineType,
      difficulty: data.difficulty,
      toolsRequired: []
    },
    overview: {
      description: data.description || `${data.title}の加工を行います`,
      warnings: data.warnings || [],
      preparationTime: `${prepTime}分`,
      processingTime: `${processTime}分`
    },
    workSteps: [
      {
        stepNumber: 1,
        title: "準備・段取り",
        description: "作業準備と材料セットアップを行います",
        detailedInstructions: [
          "図面を確認する",
          "材料を準備する",
          "工具を準備する",
          "機械の点検を行う"
        ],
        images: [],
        videos: [],
        timeRequired: `${prepTime}分`,
        warningLevel: "normal" as const,
        qualityCheck: {
          items: [
            { checkPoint: "材料の確認" },
            { checkPoint: "工具の状態確認" },
            { checkPoint: "機械の動作確認", inspectionTool: "目視確認" }
          ]
        }
      },
      {
        stepNumber: 2,
        title: "メイン加工",
        description: "主要な加工作業を実施します",
        detailedInstructions: [
          "加工条件を設定する",
          "加工プログラムを確認する",
          "加工を開始する",
          "加工状況を監視する"
        ],
        images: [],
        videos: [],
        timeRequired: `${Math.floor(processTime * 0.8)}分`,
        warningLevel: "important" as const,
        qualityCheck: {
          items: [
            { checkPoint: "加工寸法の確認", inspectionTool: "ノギス" },
            { checkPoint: "表面状態の確認" },
            { checkPoint: "工具の状態確認", inspectionTool: "マイクロメーター" }
          ]
        }
      },
      {
        stepNumber: 3,
        title: "仕上げ・検査",
        description: "仕上げ作業と最終検査を行います",
        detailedInstructions: [
          "仕上げ加工を行う",
          "寸法検査を実施する",
          "外観検査を行う",
          "清掃・片付けを行う"
        ],
        images: [],
        videos: [],
        timeRequired: `${Math.ceil(processTime * 0.2)}分`,
        warningLevel: "normal" as const,
        qualityCheck: {
          items: [
            { checkPoint: "最終寸法", inspectionTool: "ノギス" },
            { checkPoint: "表面仕上げ", inspectionTool: "表面粗さ計" },
            { checkPoint: "外観品質", inspectionTool: "マイクロメーター" }
          ]
        }
      }
    ],
    relatedDrawings: [],
    troubleshooting: [
      {
        problem: "寸法精度が出ない",
        cause: "工具の摩耗、機械の熱変形、切削条件の不適切",
        solution: "工具交換、機械の暖機運転、切削条件の見直し"
      },
      {
        problem: "表面粗さが悪い",
        cause: "切削速度の不適切、工具の選定ミス、クーラントの不足",
        solution: "切削速度の調整、工具の選定見直し、クーラント供給の確認"
      }
    ],
    revisionHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        author: "管理画面",
        changes: "新規作成"
      }
    ]
  }
}

// instruction.json保存
export async function saveInstructionFile(drawingNumber: string, instruction: WorkInstruction): Promise<void> {
  try {
    const safeDrawingNumber = sanitizeDrawingNumber(drawingNumber)
    const basePath = path.join(getDataPath(), 'work-instructions', `drawing-${safeDrawingNumber}`)
    const filePath = path.join(basePath, 'instruction.json')
    
    console.log(`📝 instruction.json保存開始: ${filePath}`)
    
    // フォルダが存在するか確認
    try {
      await access(basePath)
    } catch {
      console.error(`❌ フォルダが存在しません: ${basePath}`)
      throw new Error(`フォルダが存在しません: drawing-${safeDrawingNumber}`)
    }
    
    await writeFile(filePath, JSON.stringify(instruction, null, 2))
    console.log(`✅ instruction.json保存完了: drawing-${safeDrawingNumber}`)
  } catch (error) {
    console.error(`❌ instruction.json保存エラー:`, error)
    throw error
  }
}

// データ整合性チェック
export async function validateDataIntegrity(drawingNumber: string): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []
  const safeDrawingNumber = sanitizeDrawingNumber(drawingNumber)
  
  try {
    // 1. フォルダ存在チェック
    const basePath = path.join(getDataPath(), 'work-instructions', `drawing-${safeDrawingNumber}`)
    if (!existsSync(basePath)) {
      errors.push(`フォルダが存在しません: drawing-${safeDrawingNumber}`)
    }
    
    // 2. instruction.json存在チェック
    const instructionPath = path.join(basePath, 'instruction.json')
    if (!existsSync(instructionPath)) {
      errors.push(`instruction.jsonが存在しません: drawing-${safeDrawingNumber}`)
    }
    
    // 3. 必須フォルダ存在チェック
    const requiredDirs = ['images', 'videos', 'pdfs', 'programs']
    for (const dir of requiredDirs) {
      const dirPath = path.join(basePath, dir)
      if (!existsSync(dirPath)) {
        errors.push(`必須フォルダが存在しません: ${dir}`)
      }
    }
    
    // 4. companies.jsonとsearch-index.jsonの整合性チェック
    const companiesPath = path.join(getDataPath(), 'companies.json')
    const searchIndexPath = path.join(getDataPath(), 'search-index.json')
    
    if (existsSync(companiesPath)) {
      const companies = JSON.parse(await readFile(companiesPath, 'utf-8'))
      const foundInCompanies = companies.companies.some((company: Company) =>
        company.products.some((product: Product) =>
          product.drawings.includes(drawingNumber)
        )
      )
      if (!foundInCompanies) {
        errors.push(`companies.jsonに図番が見つかりません: ${drawingNumber}`)
      }
    }
    
    if (existsSync(searchIndexPath)) {
      const searchIndex: SearchIndex = JSON.parse(await readFile(searchIndexPath, 'utf-8'))
      const foundInSearch = searchIndex.drawings.some(d => d.drawingNumber === drawingNumber)
      if (!foundInSearch) {
        errors.push(`search-index.jsonに図番が見つかりません: ${drawingNumber}`)
      }
    }
    
  } catch (error) {
    errors.push(`整合性チェック中にエラーが発生しました: ${error}`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 複数図番の一括整合性チェック
export async function validateMultipleDrawings(drawingNumbers: string[]): Promise<{
  valid: boolean
  results: Record<string, { valid: boolean; errors: string[] }>
}> {
  const results: Record<string, { valid: boolean; errors: string[] }> = {}
  
  await Promise.all(
    drawingNumbers.map(async (drawingNumber) => {
      const result = await validateDataIntegrity(drawingNumber)
      results[drawingNumber] = result
    })
  )
  
  const allValid = Object.values(results).every(r => r.valid)
  
  return {
    valid: allValid,
    results
  }
}