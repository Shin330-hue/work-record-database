import { NextRequest, NextResponse } from 'next/server'
import { 
  createDrawingDirectoryStructure, 
  generateBasicInstruction, 
  saveInstructionFile,
  checkMultipleDrawingNumbers
} from '@/lib/drawingUtils'
import { 
  createMultipleDrawings, 
  DataTransaction,
  NewDrawingData
} from '@/lib/dataTransaction'


// 入力データバリデーション
function validateDrawingData(data: NewDrawingData): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 必須フィールドチェック
  if (!data.drawingNumber?.trim()) {
    errors.push('図番は必須です')
  }
  
  if (!data.title?.trim()) {
    errors.push('タイトルは必須です')
  }
  
  if (!data.company?.name?.trim()) {
    errors.push('会社名は必須です')
  }
  
  if (!data.product?.name?.trim()) {
    errors.push('製品名は必須です')
  }
  
  if (!data.product?.category?.trim()) {
    errors.push('製品カテゴリは必須です')
  }
  
  if (!data.difficulty) {
    errors.push('難易度は必須です')
  }
  
  if (!data.estimatedTime) {
    errors.push('推定時間は必須です')
  }
  
  if (!data.machineType?.trim()) {
    errors.push('機械種別は必須です')
  }
  
  // 図番形式チェック
  if (data.drawingNumber && !/^[a-zA-Z0-9\-_]+$/.test(data.drawingNumber)) {
    errors.push('図番は英数字、ハイフン、アンダースコアのみ使用可能です')
  }
  
  // 推定時間の数値チェック
  if (data.estimatedTime && (isNaN(parseInt(data.estimatedTime)) || parseInt(data.estimatedTime) <= 0)) {
    errors.push('推定時間は正の数値で入力してください')
  }
  
  // 難易度の値チェック
  if (data.difficulty && !['初級', '中級', '上級'].includes(data.difficulty)) {
    errors.push('難易度は「初級」「中級」「上級」のいずれかを選択してください')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 複数件データのバリデーション
function validateMultipleDrawingInputs(drawings: NewDrawingData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const drawingNumbers = new Set<string>()
  
  drawings.forEach((drawing, index) => {
    const validation = validateDrawingData(drawing)
    if (!validation.valid) {
      errors.push(`図番 ${index + 1}: ${validation.errors.join(', ')}`)
    }
    
    // 図番重複チェック（同一リクエスト内）
    if (drawing.drawingNumber) {
      if (drawingNumbers.has(drawing.drawingNumber)) {
        errors.push(`図番 ${drawing.drawingNumber} が重複しています`)
      }
      drawingNumbers.add(drawing.drawingNumber)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// POST: 新規図番登録
export async function POST(request: NextRequest) {
  try {
    // 認証チェックは画面側で実施済みのため、API側では不要
    
    const formData = await request.formData()
    const drawingsDataStr = formData.get('drawings') as string
    
    if (!drawingsDataStr) {
      return NextResponse.json(
        { error: '図番データが必要です' },
        { status: 400 }
      )
    }
    
    let drawingsData: NewDrawingData[]
    try {
      drawingsData = JSON.parse(drawingsDataStr)
    } catch {
      return NextResponse.json(
        { error: '図番データの形式が不正です' },
        { status: 400 }
      )
    }
    
    // 配列でない場合は配列に変換
    if (!Array.isArray(drawingsData)) {
      drawingsData = [drawingsData]
    }
    
    // 入力データバリデーション
    const validation = validateMultipleDrawingInputs(drawingsData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: '入力データが不正です', details: validation.errors },
        { status: 400 }
      )
    }
    
    // 既存図番の重複チェック
    const drawingNumbers = drawingsData.map(d => d.drawingNumber)
    const duplicates = await checkMultipleDrawingNumbers(drawingNumbers)
    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: '図番が既に存在します', duplicates },
        { status: 409 }
      )
    }
    
    // 1. データ処理とファイル更新
    const dataResult = await createMultipleDrawings(drawingsData)
    if (!dataResult.success) {
      return NextResponse.json(
        { error: 'データ処理中にエラーが発生しました', details: dataResult.errors },
        { status: 500 }
      )
    }
    
    // 2. フォルダ階層作成とファイル処理
    const processResults: Array<{
      drawingNumber: string
      success: boolean
      error?: string
    }> = []
    
    for (const processedData of dataResult.processed) {
      try {
        // フォルダ階層作成
        await createDrawingDirectoryStructure(processedData.drawingNumber)
        
        // PDFファイル処理（複数対応）
        const pdfFiles: File[] = []
        let pdfIndex = 0
        while (formData.has(`pdf_${processedData.drawingNumber}_${pdfIndex}`)) {
          const pdfFile = formData.get(`pdf_${processedData.drawingNumber}_${pdfIndex}`) as File
          if (pdfFile && pdfFile.size > 0) {
            pdfFiles.push(pdfFile)
          }
          pdfIndex++
        }
        
        // PDFファイルがある場合は新しい一括アップロードAPIを使用
        if (pdfFiles.length > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('stepNumber', '0') // overview
          pdfFiles.forEach(file => {
            uploadFormData.append('files', file)
          })
          
          // 内部的に一括アップロードAPIを呼び出し
          const uploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/drawings/${processedData.drawingNumber}/files/batch`,
            {
              method: 'POST',
              body: uploadFormData
            }
          )
          
          if (uploadResponse.ok) {
            // 検索インデックスのPDFフラグ更新
            const transaction = new DataTransaction()
            await transaction.updateSearchIndexForPdf(processedData.drawingNumber)
          } else {
            // エラーの詳細をログ出力
            const errorText = await uploadResponse.text()
            console.error(`PDFアップロードエラー: ${processedData.drawingNumber}`, {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              error: errorText
            })
            // エラーでも処理は継続（部分的な成功を許可）
          }
        }
        
        // プログラムファイル処理（複数対応）
        const programFiles: File[] = []
        let programIndex = 0
        while (formData.has(`program_${processedData.drawingNumber}_${programIndex}`)) {
          const programFile = formData.get(`program_${processedData.drawingNumber}_${programIndex}`) as File
          if (programFile && programFile.size > 0) {
            programFiles.push(programFile)
          }
          programIndex++
        }
        
        // プログラムファイルがある場合も一括アップロードAPIを使用
        if (programFiles.length > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('stepNumber', '0') // overview
          programFiles.forEach(file => {
            uploadFormData.append('files', file)
          })
          
          const uploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/drawings/${processedData.drawingNumber}/files/batch`,
            {
              method: 'POST',
              body: uploadFormData
            }
          )
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error(`プログラムファイルアップロードエラー: ${processedData.drawingNumber}`, {
              status: uploadResponse.status,
              statusText: uploadResponse.statusText,
              error: errorText
            })
            // エラーでも処理は継続（PDFと同様の挙動）
          }
        }
        
        // 基本的なinstruction.json作成
        const instruction = generateBasicInstruction({
          drawingNumber: processedData.drawingNumber,
          title: processedData.title,
          companyId: processedData.companyId,
          productId: processedData.productId,
          difficulty: processedData.difficulty,
          estimatedTime: processedData.estimatedTime,
          machineType: processedData.machineType,
          description: processedData.description,
          warnings: processedData.warnings
        })
        
        await saveInstructionFile(processedData.drawingNumber, instruction)
        
        processResults.push({
          drawingNumber: processedData.drawingNumber,
          success: true
        })
        
      } catch (error) {
        console.error(`図番処理エラー (${processedData.drawingNumber}):`, error)
        processResults.push({
          drawingNumber: processedData.drawingNumber,
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー'
        })
      }
    }
    
    // 3. 整合性チェック
    const { validateMultipleDrawings } = await import('@/lib/drawingUtils')
    const validationResult = await validateMultipleDrawings(
      processResults.filter(r => r.success).map(r => r.drawingNumber)
    )
    
    // 4. 成功・失敗のサマリー
    const successful = processResults.filter(r => r.success)
    const failed = processResults.filter(r => !r.success)
    
    const response = {
      success: failed.length === 0,
      summary: {
        total: drawingsData.length,
        successful: successful.length,
        failed: failed.length
      },
      results: processResults,
      validation: validationResult
    }
    
    if (failed.length > 0) {
      return NextResponse.json(response, { status: 207 }) // 207 Multi-Status
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('図番登録API エラー:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// GET: 図番一覧取得（管理画面用）
export async function GET(request: NextRequest) {
  try {
    // 認証チェックは画面側で実施済みのため、API側では不要
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    // 検索インデックスから図番一覧を取得
    const { loadSearchIndex, loadCompanies } = await import('@/lib/dataLoader')
    const searchIndex = await loadSearchIndex()
    const companies = await loadCompanies()
    
    let drawings = searchIndex.drawings
    
    // 検索フィルタ
    if (search) {
      drawings = drawings.filter(drawing => 
        drawing.drawingNumber.toLowerCase().includes(search.toLowerCase()) ||
        drawing.title.toLowerCase().includes(search.toLowerCase()) ||
        drawing.productName.toLowerCase().includes(search.toLowerCase()) ||
        drawing.companyName.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // ページネーション
    const offset = (page - 1) * limit
    const paginatedDrawings = drawings.slice(offset, offset + limit)
    
    return NextResponse.json({
      drawings: paginatedDrawings,
      pagination: {
        page,
        limit,
        total: drawings.length,
        totalPages: Math.ceil(drawings.length / limit)
      },
      companies: companies.map(c => ({ id: c.id, name: c.name }))
    })
    
  } catch (error) {
    console.error('図番一覧取得API エラー:', error)
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}