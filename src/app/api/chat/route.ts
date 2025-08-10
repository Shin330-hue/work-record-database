import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { searchKnowledgeBase, formatSearchResults } from '@/lib/knowledge-search'

// 使用するAIモデルを環境変数で切り替え
const USE_OLLAMA = process.env.USE_OLLAMA === 'true'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b'

// RAG機能フラグ
const ENABLE_RAG = process.env.ENABLE_RAG === 'true'

// 利用可能なモデル一覧
const AVAILABLE_MODELS = [
  { id: 'gpt-oss:20b', name: 'GPT-OSS 20B', provider: 'ollama' },
  { id: 'qwen2.5:7b-instruct-q4_k_m', name: 'Qwen2.5 7B Q4_K_M', provider: 'ollama' },
  { id: 'llama3.1:8b-instruct-q4_k_m', name: 'Llama3.1 8B Q4_K_M', provider: 'ollama' },
  { id: 'gemma3:12b', name: 'Gemma3 12B', provider: 'ollama' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' }
]

// Gemini APIキーを環境変数から取得
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// システムプロンプトを共通化
const systemPrompt = `あなたは「田中工業AI」という名前の、機械加工と製造業に特化したアシスタントです。
    
以下の特徴を持って回答してください：
- 機械加工（旋盤、マシニング、横中、ラジアル）の専門知識を持つ
- 切削条件、工具選定、加工手順について詳しい
- 現場の作業者に分かりやすく説明する
- 具体的で実践的なアドバイスを提供
- 安全性を常に重視
- 日本の製造業の慣習に詳しい
- 回答は500文字以内で簡潔にまとめる

ユーザーの質問に対して、親切で分かりやすい日本語で回答してください。`

// モデル一覧を取得するGETエンドポイント
export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS })
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model, enableRAG } = await request.json()
    
    // 選択されたモデル情報を取得
    const selectedModel = AVAILABLE_MODELS.find(m => m.id === model) || AVAILABLE_MODELS[0]
    const useOllamaForThisRequest = selectedModel.provider === 'ollama'
    const modelId = selectedModel.id
    
    // RAG機能：社内データ検索（環境変数またはリクエストで有効化）
    let ragContext = ''
    const shouldUseRAG = ENABLE_RAG || enableRAG
    
    if (shouldUseRAG && messages.length > 0) {
      try {
        const lastMessage = messages[messages.length - 1]
        const conversationHistory = messages.slice(0, -1).map(m => m.content)
        
        console.log('🔍 RAG検索開始:', lastMessage.content)
        const searchResults = await searchKnowledgeBase(lastMessage.content, conversationHistory)
        ragContext = formatSearchResults(searchResults)
        console.log('📊 RAG検索結果:', searchResults.statistics)
      } catch (ragError) {
        console.error('RAG検索エラー:', ragError)
        // RAG失敗時も通常のチャットは継続
      }
    }
    
    // プロンプトにRAGコンテキストを追加
    const enhancedSystemPrompt = ragContext 
      ? `${systemPrompt}\n\n${ragContext}\n\n上記の社内データベース情報も参考にして回答してください。`
      : systemPrompt

    // Ollamaモデルを使用する場合
    if (useOllamaForThisRequest) {
      try {
        // Ollama用のメッセージ形式に変換
        const ollamaMessages = [
          { role: 'system', content: enhancedSystemPrompt },
          ...messages
        ]

        // Ollama APIにリクエスト
        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            messages: ollamaMessages,
            stream: false
          })
        })

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama API error: ${ollamaResponse.status}`)
        }

        const ollamaData = await ollamaResponse.json()
        return NextResponse.json({ response: ollamaData.message.content })
        
      } catch (ollamaError) {
        console.error('Ollama error:', ollamaError)
        // Ollamaエラー時はエラーを返す（フォールバックなし）
        return NextResponse.json({ 
          response: `${selectedModel.name} でエラーが発生しました。別のモデルをお試しください。\n\nエラー: ${ollamaError instanceof Error ? ollamaError.message : 'Unknown error'}` 
        }, { status: 500 })
      }
    }

    // Geminiを使用する場合
    const geminiModel = genAI.getGenerativeModel({ model: modelId })

    // 会話履歴を構築
    const conversationHistory = messages.map((msg: any) => 
      `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`
    ).join('\n\n')

    // Geminiに送信するプロンプト
    const prompt = `${enhancedSystemPrompt}\n\n会話履歴:\n${conversationHistory}\n\nアシスタント:`

    // Geminiからの応答を取得
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // APIキーが設定されていない場合のメッセージ
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        response: '申し訳ございません。現在、AIアシスタント機能は準備中です。\n\nGemini APIキーを環境変数に設定してください：\n1. .env.localファイルを作成\n2. GEMINI_API_KEY=your-api-key を追加\n3. サーバーを再起動\n\n詳しくは管理者にお問い合わせください。' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      response: 'エラーが発生しました。しばらく経ってからもう一度お試しください。' 
    }, { status: 500 })
  }
}