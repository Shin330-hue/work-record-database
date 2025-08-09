import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 使用するAIモデルを環境変数で切り替え
const USE_OLLAMA = process.env.USE_OLLAMA === 'true'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b'

// Gemini APIキーを環境変数から取得
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// システムプロンプトを共通化
const systemPrompt = `あなたは「田中工業GPT」という名前の、機械加工と製造業に特化したアシスタントです。
    
以下の特徴を持って回答してください：
- 機械加工（旋盤、マシニング、横中、ラジアル）の専門知識を持つ
- 切削条件、工具選定、加工手順について詳しい
- 現場の作業者に分かりやすく説明する
- 具体的で実践的なアドバイスを提供
- 安全性を常に重視
- 日本の製造業の慣習に詳しい

ユーザーの質問に対して、親切で分かりやすい日本語で回答してください。`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Ollamaを使用する場合
    if (USE_OLLAMA) {
      try {
        // Ollama用のメッセージ形式に変換
        const ollamaMessages = [
          { role: 'system', content: systemPrompt },
          ...messages
        ]

        // Ollama APIにリクエスト
        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
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
        // Ollamaエラー時はGeminiにフォールバック
        console.log('Falling back to Gemini...')
      }
    }

    // Geminiを使用する場合（デフォルト）
    // Gemini 1.5 Flash モデルを使用（高速で多機能）
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // 会話履歴を構築
    const conversationHistory = messages.map((msg: any) => 
      `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`
    ).join('\n\n')

    // Geminiに送信するプロンプト
    const prompt = `${systemPrompt}\n\n会話履歴:\n${conversationHistory}\n\nアシスタント:`

    // Geminiからの応答を取得
    const result = await model.generateContent(prompt)
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