/**
 * 社内データ検索・RAG機能モジュール V2
 * 検索精度向上版 - メタデータを最大限活用
 */

export interface ExtractedKeywords {
  materials: string[]
  machines: string[]
  processes: string[]
  tools: string[]
  drawings: string[]
  companies: string[]
  difficulties: string[]
  categories: string[]
  showAll?: boolean
  originalQuery: string
}

export interface SearchResult {
  companies: CompanyMatch[]
  drawings: DrawingMatch[]
  contributions: ContributionMatch[]
  statistics: SearchStatistics
}

export interface CompanyMatch {
  companyName: string
  productName: string
  category: string
  drawingNumbers: string[]
  relevanceScore: number
  matchedFields: string[]
}

export interface DrawingMatch {
  drawingNumber: string
  title: string
  companyId: string
  machineTypes: string[]
  materials: string[]
  difficulty: string
  estimatedTime: string
  toolsUsed: string[]
  relevanceScore: number
  matchedFields: string[]
  workStepsCount: number
}

export interface ContributionMatch {
  drawingNumber: string
  contributor: string
  content: string
  type: string
  timestamp: string
  relevanceScore: number
}

export interface SearchStatistics {
  totalCompanies: number
  totalDrawings: number
  totalContributions: number
  searchTerms: string[]
  processingTimeMs: number
}

/**
 * 高度なキーワード抽出（正規表現と辞書ベース）
 */
export function extractKeywords(text: string): ExtractedKeywords {
  const lowerText = text.toLowerCase()
  const originalQuery = text
  
  // 全件表示を要求するクエリパターンの検出
  const showAllPatterns = [
    '全図番', '全ての図番', 'すべての図番', '図番を全て', '図番の数',
    '全部', 'すべて', '一覧', 'リスト', 'list all', 'show all', 'total'
  ]
  // 「何件」「何個」「何枚」は件数カウントのクエリなので除外
  const countingPatterns = ['何件', '何個', '何枚', 'いくつ', 'カウント']
  const isShowAllRequest = showAllPatterns.some(pattern => lowerText.includes(pattern)) && 
                           !countingPatterns.some(pattern => lowerText.includes(pattern))
  
  // 材質キーワード（拡張＋エイリアス対応）
  const materialPatterns = {
    'ss400': ['ss400', 'ｓｓ４００'],
    'sus304': ['sus304', 'ｓｕｓ３０４', 'ステンレス304'],
    'sus316': ['sus316', 'ｓｕｓ３１６', 'ステンレス316'],
    's45c': ['s45c', 'ｓ４５ｃ', '炭素鋼45'],
    'sph': ['sph', 'ｓｐｈ'],
    'sus': ['sus', 'ｓｕｓ', 'ステンレス', 'ステン'],
    'ss': ['ss', 'ｓｓ', '一般鋼'],
    'アルミ': ['アルミ', 'アルミニウム', 'al', 'aluminum', 'ａｌ'],
    'ジュラルミン': ['ジュラルミン', 'ドラル', 'dural', 'ａ２０１７', 'a2017'],
    '真鍮': ['真鍮', '黄銅', 'brass', 'ブラス'],
    '銅': ['銅', 'copper', 'カッパー'],
    '鉄': ['鉄', 'iron', 'アイアン'],
    '鋼': ['鋼', 'steel', 'スチール'],
    '炭素鋼': ['炭素鋼', 'carbon steel']
  }
  
  const materials: string[] = []
  for (const [key, patterns] of Object.entries(materialPatterns)) {
    if (patterns.some(p => lowerText.includes(p.toLowerCase()))) {
      materials.push(key)
    }
  }
  
  // 機械種別キーワード（正規化）
  const machinePatterns = {
    'マシニング': ['マシニング', 'machining', 'mc', 'マシニングセンタ', 'マシニングセンター', 'ﾏｼﾆﾝｸﾞ'],
    'CNC旋盤': ['cnc旋盤', 'ｃｎｃ旋盤', 'nc旋盤', 'ｎｃ旋盤'],
    '旋盤': ['旋盤', 'turning', 'ターニング', 'lathe', '旋削'],
    '横中': ['横中', 'よこなか', '横中ぐり', 'horizontal boring', 'ﾖｺﾅｶ'],
    'ラジアル': ['ラジアル', 'radial', 'ﾗｼﾞｱﾙ', 'ボール盤', 'drill press'],
    'その他': ['その他', 'other', '手仕上げ', '手加工'],
    '研削': ['研削', '研磨', 'grinding', 'グラインダー']
  }
  
  const machines: string[] = []
  for (const [key, patterns] of Object.entries(machinePatterns)) {
    if (patterns.some(p => lowerText.includes(p.toLowerCase()))) {
      machines.push(key)
    }
  }
  
  // 加工プロセスキーワード（詳細化）
  const processPatterns = {
    '切削': ['切削', 'cutting', 'カッティング'],
    '穴あけ': ['穴あけ', '穴開け', 'drilling', 'drill', 'ドリル', 'ボーリング', 'boring'],
    'タップ': ['タップ', 'tap', 'tapping', 'ねじ切り', 'thread', 'ネジ切り', 'ネジ'],
    '溝加工': ['あり溝', '溝', 'slot', 'slotting', 'キー溝', 'keyway', '溝入れ'],
    'フライス': ['フライス', 'milling', '正面フライス', 'end mill', 'エンドミル'],
    '旋削': ['旋削', '旋盤', 'turning', '外径', '内径', '端面'],
    '研削': ['研削', '研磨', 'grinding'],
    '仕上げ': ['仕上げ', 'finish', 'finishing', '仕上'],
    '面取り': ['面取り', 'chamfer', 'チャンファー'],
    'バリ取り': ['バリ取り', 'deburring', 'バリ除去', 'デバリング'],
    '測定': ['測定', '検査', 'measurement', 'inspection', '計測']
  }
  
  const processes: string[] = []
  for (const [key, patterns] of Object.entries(processPatterns)) {
    if (patterns.some(p => lowerText.includes(p.toLowerCase()))) {
      processes.push(key)
    }
  }
  
  // 工具キーワード抽出
  const toolPatterns = [
    'フルバック', 'ラフィング', 'エンドミル', '面取り', 'ドリル', 'センタードリル',
    'タップ', 'リーマ', 'ボーリングバー', 'フライス', 'バイト', 'チップ'
  ]
  const tools = toolPatterns.filter(tool => lowerText.includes(tool.toLowerCase()))
  
  // 図番パターン（改善版）
  const drawingPatterns = [
    /[A-Z0-9]{2,}-[A-Z0-9]{2,}/gi,  // XX-XXX形式
    /[A-Z]{1,3}[0-9]{4,}/gi,         // ABC1234形式
    /[0-9]{5,}[A-Z0-9\-]*/gi,        // 12345XXX形式
    /[A-Z0-9\-_]{8,}/gi              // 一般的な長い図番
  ]
  
  const drawingSet = new Set<string>()
  drawingPatterns.forEach(pattern => {
    const matches = text.match(pattern) || []
    matches.forEach(m => drawingSet.add(m.toUpperCase()))
  })
  const drawings = Array.from(drawingSet)
  
  // 会社名キーワード（拡張）
  const companyPatterns = {
    '中央鉄工所': ['中央鉄工所', '中央鉄工', 'chuo', 'ちゅうおう'],
    'サンエイ工業': ['サンエイ工業', 'サンエイ', 'sanei', 'さんえい'],
    '山本製作所': ['山本製作所', '山本', 'yamamoto', 'やまもと'],
    'テクノ': ['テクノ', 'techno', 'てくの']
  }
  
  const companies: string[] = []
  for (const [key, patterns] of Object.entries(companyPatterns)) {
    if (patterns.some(p => lowerText.includes(p.toLowerCase()))) {
      companies.push(key)
    }
  }
  
  // 難易度キーワード
  const difficultyPatterns = {
    '初級': ['初級', '簡単', 'easy', '初心者'],
    '中級': ['中級', '普通', 'medium', '標準'],
    '上級': ['上級', '難しい', 'hard', '熟練']
  }
  
  const difficulties: string[] = []
  for (const [key, patterns] of Object.entries(difficultyPatterns)) {
    if (patterns.some(p => lowerText.includes(p.toLowerCase()))) {
      difficulties.push(key)
    }
  }
  
  // カテゴリキーワード
  const categoryPatterns = [
    'ブラケット', 'フレーム', 'シャフト', 'ギア', 'カバー', 'プレート',
    'ハウジング', 'ボデー', 'リング', 'ピストン', 'リテーナー'
  ]
  const categories = categoryPatterns.filter(cat => lowerText.includes(cat.toLowerCase()))
  
  return {
    materials,
    machines, 
    processes,
    tools,
    drawings,
    companies,
    difficulties,
    categories,
    showAll: isShowAllRequest,
    originalQuery
  }
}

/**
 * 高度なスコアリングアルゴリズム
 */
function calculateRelevanceScore(
  keywords: ExtractedKeywords,
  metadata: Record<string, unknown>,
  matchedFields: string[]
): number {
  let score = 0
  const weights = {
    drawingNumber: 10,    // 図番完全一致
    title: 5,            // タイトル一致
    machineType: 4,      // 機械種別一致
    material: 4,         // 材質一致
    tool: 3,            // 工具一致
    process: 3,         // 加工プロセス一致
    difficulty: 2,       // 難易度一致
    category: 2,        // カテゴリ一致
    company: 2,         // 会社名一致
    partial: 1          // 部分一致
  }
  
  // 図番の完全一致チェック
  if (keywords.drawings.length > 0) {
    const drawingNumber = metadata.drawingNumber || ''
    if (keywords.drawings.some(d => d === drawingNumber)) {
      score += weights.drawingNumber
      matchedFields.push('図番完全一致')
    }
  }
  
  // タイトルマッチング（形態素解析風）
  const title = String(metadata.title || '').toLowerCase()
  if (title) {
    // 材質マッチ
    const materialMatch = keywords.materials.filter(m => 
      title.includes(m.toLowerCase())
    ).length
    if (materialMatch > 0) {
      score += weights.material * materialMatch
      matchedFields.push('材質')
    }
    
    // プロセスマッチ
    const processMatch = keywords.processes.filter(p => 
      title.includes(p.toLowerCase())
    ).length
    if (processMatch > 0) {
      score += weights.process * processMatch
      matchedFields.push('加工方法')
    }
    
    // カテゴリマッチ
    const categoryMatch = keywords.categories.filter(c => 
      title.includes(c.toLowerCase())
    ).length
    if (categoryMatch > 0) {
      score += weights.category * categoryMatch
      matchedFields.push('カテゴリ')
    }
  }
  
  // 機械種別マッチング
  const machineTypes = Array.isArray(metadata.machineType) ? metadata.machineType : []
  const machineMatch = keywords.machines.filter(m =>
    machineTypes.some((mt: string) => mt.toLowerCase().includes(m.toLowerCase()))
  ).length
  if (machineMatch > 0) {
    score += weights.machineType * machineMatch
    matchedFields.push('機械種別')
  }
  
  // 工具マッチング
  const toolsRequired = Array.isArray(metadata.toolsRequired) ? metadata.toolsRequired : []
  const toolMatch = keywords.tools.filter(t =>
    toolsRequired.some((tr: string) => tr.toLowerCase().includes(t.toLowerCase()))
  ).length
  if (toolMatch > 0) {
    score += weights.tool * toolMatch
    matchedFields.push('使用工具')
  }
  
  // 難易度マッチング
  if (keywords.difficulties.length > 0 && metadata.difficulty) {
    if (keywords.difficulties.includes(String(metadata.difficulty))) {
      score += weights.difficulty
      matchedFields.push('難易度')
    }
  }
  
  // クエリ文字列の部分一致（フォールバック）
  const queryWords = keywords.originalQuery.toLowerCase().split(/\s+/)
  const titleWords = title.split(/\s+/)
  const partialMatches = queryWords.filter(qw => 
    qw.length > 2 && titleWords.some(tw => tw.includes(qw))
  ).length
  if (partialMatches > 0) {
    score += weights.partial * partialMatches
    if (!matchedFields.length) matchedFields.push('部分一致')
  }
  
  // スコアブースト：複数フィールドマッチ時
  if (matchedFields.length >= 3) {
    score *= 1.5  // 1.5倍ブースト
  } else if (matchedFields.length >= 2) {
    score *= 1.2  // 1.2倍ブースト
  }
  
  return score
}

/**
 * 社内データを検索（改良版）
 */
export async function searchKnowledgeBase(
  query: string,
  conversationHistory: string[] = []
): Promise<SearchResult> {
  const startTime = Date.now()
  
  // まず現在のクエリからキーワード抽出
  const keywords = extractKeywords(query)
  
  // キーワードが少ない場合のみ、会話履歴から補完
  if (keywords.materials.length === 0 && 
      keywords.machines.length === 0 && 
      keywords.processes.length === 0 &&
      keywords.drawings.length === 0 &&
      keywords.categories.length === 0) {
    // 直近1つの会話履歴のみ参考にする
    if (conversationHistory.length > 0) {
      const contextKeywords = extractKeywords(conversationHistory[conversationHistory.length - 1])
      // 図番と会社名のみ補完（材質や機械は補完しない）
      keywords.drawings.push(...contextKeywords.drawings)
      keywords.companies.push(...contextKeywords.companies)
    }
  }
  
  console.log('🔍 抽出されたキーワード:', {
    materials: keywords.materials,
    machines: keywords.machines,
    processes: keywords.processes,
    tools: keywords.tools,
    drawings: keywords.drawings,
    categories: keywords.categories
  })
  
  try {
    // 各データソースから検索
    const [companyMatches, drawingMatches, contributionMatches] = await Promise.all([
      searchCompanies(keywords),
      searchDrawings(keywords),
      searchContributions(keywords)
    ])
    
    const statistics: SearchStatistics = {
      totalCompanies: companyMatches.length,
      totalDrawings: drawingMatches.length,
      totalContributions: contributionMatches.length,
      searchTerms: [
        ...keywords.materials,
        ...keywords.machines,
        ...keywords.processes,
        ...keywords.tools,
        ...keywords.drawings,
        ...keywords.companies,
        ...keywords.categories
      ].filter((v, i, a) => a.indexOf(v) === i), // 重複除去
      processingTimeMs: Date.now() - startTime
    }
    
    return {
      companies: companyMatches,
      drawings: drawingMatches,
      contributions: contributionMatches,
      statistics
    }
    
  } catch (error) {
    console.error('Knowledge search error:', error)
    
    return {
      companies: [],
      drawings: [],
      contributions: [],
      statistics: {
        totalCompanies: 0,
        totalDrawings: 0,
        totalContributions: 0,
        searchTerms: [],
        processingTimeMs: Date.now() - startTime
      }
    }
  }
}

/**
 * 会社・製品データから検索（改良版）
 */
async function searchCompanies(keywords: ExtractedKeywords): Promise<CompanyMatch[]> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const useNAS = process.env.USE_NAS === 'true'
    const dataRootPath = useNAS 
      ? process.env.DATA_ROOT_PATH || './public/data'
      : process.env.DEV_DATA_ROOT_PATH || './public/data'
      
    const companiesPath = path.join(dataRootPath, 'companies.json')
    const companiesData = await fs.readFile(companiesPath, 'utf-8')
    const data = JSON.parse(companiesData)
    
    const matches: CompanyMatch[] = []
    
    for (const company of data.companies) {
      for (const product of company.products) {
        const matchedFields: string[] = []
        let relevanceScore = 0
        
        // 会社名マッチ
        const companyName = company.shortName || company.name
        if (keywords.companies.some(c => 
          companyName.toLowerCase().includes(c.toLowerCase())
        )) {
          relevanceScore += 3
          matchedFields.push('会社名')
        }
        
        // カテゴリマッチ
        if (keywords.categories.some(cat => 
          product.category.toLowerCase().includes(cat.toLowerCase())
        )) {
          relevanceScore += 4
          matchedFields.push('カテゴリ')
        }
        
        // 製品名マッチ
        if (keywords.processes.some(p => 
          product.name.toLowerCase().includes(p.toLowerCase())
        )) {
          relevanceScore += 2
          matchedFields.push('製品名')
        }
        
        // 図番完全マッチ
        const drawingMatch = keywords.drawings.filter(d => 
          product.drawings.includes(d)
        ).length
        if (drawingMatch > 0) {
          relevanceScore += 8 * drawingMatch
          matchedFields.push('図番')
        }
        
        // 説明文マッチ
        const description = product.description || ''
        const descWords = keywords.originalQuery.toLowerCase().split(/\s+/)
        const descMatch = descWords.filter(w => 
          w.length > 2 && description.toLowerCase().includes(w)
        ).length
        if (descMatch > 0) {
          relevanceScore += descMatch
          matchedFields.push('説明')
        }
        
        if (relevanceScore > 0 || keywords.showAll) {
          matches.push({
            companyName: company.shortName,
            productName: product.name,
            category: product.category,
            drawingNumbers: product.drawings,
            relevanceScore,
            matchedFields
          })
        }
      }
    }
    
    // スコアでソートし、上位を返す
    const limit = keywords.showAll ? 30 : 10
    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
    
  } catch (error) {
    console.error('Company search error:', error)
    return []
  }
}

/**
 * 作業手順データから検索（改良版）
 */
async function searchDrawings(keywords: ExtractedKeywords): Promise<DrawingMatch[]> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const useNAS = process.env.USE_NAS === 'true'
    const dataRootPath = useNAS 
      ? process.env.DATA_ROOT_PATH || './public/data'
      : process.env.DEV_DATA_ROOT_PATH || './public/data'
      
    const workInstructionsPath = path.join(dataRootPath, 'work-instructions')
    
    try {
      await fs.access(workInstructionsPath)
    } catch {
      console.log('work-instructionsディレクトリが見つかりません')
      return []
    }
    
    const matches: DrawingMatch[] = []
    const drawingDirs = await fs.readdir(workInstructionsPath, { withFileTypes: true })
    
    for (const dir of drawingDirs) {
      if (!dir.isDirectory()) continue
      
      try {
        const instructionPath = path.join(workInstructionsPath, dir.name, 'instruction.json')
        const instructionData = await fs.readFile(instructionPath, 'utf-8')
        const instruction = JSON.parse(instructionData)
        
        const metadata = instruction.metadata || {}
        const matchedFields: string[] = []
        
        // 高度なスコアリング
        const relevanceScore = calculateRelevanceScore(keywords, metadata, matchedFields)
        
        // 作業ステップ数を取得
        let workStepsCount = 0
        if (instruction.workStepsByMachine) {
          for (const steps of Object.values(instruction.workStepsByMachine)) {
            if (Array.isArray(steps)) {
              workStepsCount += steps.length
            }
          }
        }
        
        // しきい値チェック（全件表示モード以外）
        if (relevanceScore > 0 || keywords.showAll) {
          // 材質を抽出（タイトルから）
          const title = metadata.title || ''
          const detectedMaterials = keywords.materials.filter(m => 
            title.toLowerCase().includes(m.toLowerCase())
          )
          
          matches.push({
            drawingNumber: metadata.drawingNumber || dir.name,
            title: title,
            companyId: metadata.companyId || 'unknown',
            machineTypes: Array.isArray(metadata.machineType) ? metadata.machineType : [],
            materials: detectedMaterials,
            difficulty: metadata.difficulty || 'unknown',
            estimatedTime: metadata.estimatedTime || 'unknown',
            toolsUsed: Array.isArray(metadata.toolsRequired) ? metadata.toolsRequired : [],
            relevanceScore,
            matchedFields: Array.isArray(matchedFields) ? matchedFields : [],
            workStepsCount
          })
        }
        
      } catch {
        // 個別ファイル読み込みエラーは無視
        continue
      }
    }
    
    // スコアでソートし、上位を返す
    const limit = keywords.showAll ? 50 : 15
    return matches
      .sort((a, b) => {
        // 複数条件でソート
        if (Math.abs(b.relevanceScore - a.relevanceScore) > 0.1) {
          return b.relevanceScore - a.relevanceScore
        }
        // スコアが同じ場合は作業ステップ数でソート
        return b.workStepsCount - a.workStepsCount
      })
      .slice(0, limit)
    
  } catch (error) {
    console.error('Drawing search error:', error)
    return []
  }
}

/**
 * 追記データから検索（実装）
 */
async function searchContributions(keywords: ExtractedKeywords): Promise<ContributionMatch[]> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const useNAS = process.env.USE_NAS === 'true'
    const dataRootPath = useNAS 
      ? process.env.DATA_ROOT_PATH || './public/data'
      : process.env.DEV_DATA_ROOT_PATH || './public/data'
      
    const workInstructionsPath = path.join(dataRootPath, 'work-instructions')
    const matches: ContributionMatch[] = []
    
    try {
      await fs.access(workInstructionsPath)
    } catch {
      return []
    }
    
    const drawingDirs = await fs.readdir(workInstructionsPath, { withFileTypes: true })
    
    for (const dir of drawingDirs) {
      if (!dir.isDirectory()) continue
      
      try {
        const contributionsPath = path.join(
          workInstructionsPath, 
          dir.name, 
          'contributions', 
          'contributions.json'
        )
        
        const contributionsData = await fs.readFile(contributionsPath, 'utf-8')
        const data = JSON.parse(contributionsData)
        
        if (data.contributions && Array.isArray(data.contributions)) {
          for (const contrib of data.contributions) {
            let relevanceScore = 0
            const text = (contrib.text || '').toLowerCase()
            
            // キーワードマッチング
            if (text) {
              // プロセスマッチ
              relevanceScore += keywords.processes.filter(p => 
                text.includes(p.toLowerCase())
              ).length * 2
              
              // 工具マッチ
              relevanceScore += keywords.tools.filter(t => 
                text.includes(t.toLowerCase())
              ).length * 2
              
              // クエリ単語マッチ
              const queryWords = keywords.originalQuery.toLowerCase().split(/\s+/)
              relevanceScore += queryWords.filter(w => 
                w.length > 2 && text.includes(w)
              ).length
            }
            
            if (relevanceScore > 0) {
              matches.push({
                drawingNumber: data.drawingNumber || dir.name,
                contributor: contrib.userName || 'unknown',
                content: contrib.text || '',
                type: contrib.type || 'comment',
                timestamp: contrib.timestamp || '',
                relevanceScore
              })
            }
          }
        }
      } catch {
        // エラーは無視して続行
        continue
      }
    }
    
    // スコアでソートし、上位を返す
    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10)
    
  } catch (error) {
    console.error('Contribution search error:', error)
    return []
  }
}

/**
 * 検索結果を詳細なコンテキスト文字列にフォーマット
 */
export function formatSearchResults(results: SearchResult): string {
  let context = `【社内データベース検索結果】\n\n`
  
  // 統計情報
  const hasResults = results.statistics.totalDrawings > 0 || 
                    results.statistics.totalCompanies > 0 || 
                    results.statistics.totalContributions > 0
  
  if (hasResults) {
    context += `📊 検索結果サマリー:\n`
    if (results.statistics.totalDrawings > 0) {
      context += `  • 図番: ${results.statistics.totalDrawings}件\n`
    }
    if (results.statistics.totalCompanies > 0) {
      context += `  • 会社/製品: ${results.statistics.totalCompanies}件\n`
    }
    if (results.statistics.totalContributions > 0) {
      context += `  • 追記情報: ${results.statistics.totalContributions}件\n`
    }
    if (results.statistics.searchTerms.length > 0) {
      context += `  • 検索キーワード: ${results.statistics.searchTerms.join(', ')}\n`
    }
    context += `\n`
  }
  
  // 図番情報（最重要）
  if (results.drawings.length > 0) {
    context += `🔧 関連作業手順:\n`
    results.drawings.slice(0, 5).forEach((drawing, idx) => {
      context += `\n${idx + 1}. 図番: ${drawing.drawingNumber}\n`
      context += `   タイトル: ${drawing.title}\n`
      if (Array.isArray(drawing.machineTypes) && drawing.machineTypes.length > 0) {
        context += `   使用機械: ${drawing.machineTypes.join('、')}\n`
      }
      if (Array.isArray(drawing.materials) && drawing.materials.length > 0) {
        context += `   材質: ${drawing.materials.join('、')}\n`
      }
      context += `   難易度: ${drawing.difficulty}、推定時間: ${drawing.estimatedTime}\n`
      if (Array.isArray(drawing.toolsUsed) && drawing.toolsUsed.length > 0) {
        context += `   使用工具: ${drawing.toolsUsed.slice(0, 5).join('、')}\n`
      }
      if (Array.isArray(drawing.matchedFields) && drawing.matchedFields.length > 0) {
        context += `   マッチ項目: ${drawing.matchedFields.join('、')}\n`
      }
      context += `   作業ステップ数: ${drawing.workStepsCount}工程\n`
    })
    context += `\n`
  }
  
  // 会社・製品情報
  if (results.companies.length > 0) {
    context += `🏢 関連会社・製品:\n`
    results.companies.slice(0, 3).forEach((company, idx) => {
      context += `\n${idx + 1}. ${company.companyName}: ${company.productName}\n`
      context += `   カテゴリ: ${company.category}\n`
      context += `   関連図番: ${company.drawingNumbers.join(', ')}\n`
      if (company.matchedFields.length > 0) {
        context += `   マッチ項目: ${company.matchedFields.join('、')}\n`
      }
    })
    context += `\n`
  }
  
  // 追記・現場知見
  if (results.contributions.length > 0) {
    context += `💡 現場からの追記情報:\n`
    results.contributions.slice(0, 3).forEach((contrib, idx) => {
      context += `\n${idx + 1}. [${contrib.drawingNumber}] ${contrib.contributor}さんの${contrib.type}:\n`
      context += `   「${contrib.content}」\n`
    })
    context += `\n`
  }
  
  // 検索結果なしの場合
  if (!hasResults) {
    context += `⚠️ 該当するデータが見つかりませんでした。\n`
    context += `検索キーワードを変更するか、より具体的な情報（図番、材質、機械種別など）を含めてお試しください。\n`
  }
  
  return context
}