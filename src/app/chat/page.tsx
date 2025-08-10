'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIModel {
  id: string
  name: string
  provider: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'こんにちは！田中工業AIです。🔧\n\n加工や作業手順について何でもお聞きください。例えば：\n・「SUS304の切削条件を教えて」\n・「アルミの薄物加工のコツは？」\n・「旋盤で真円度を出すには？」',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('gpt-oss:20b')
  const [enableRAG, setEnableRAG] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // モデル一覧を取得
  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => setModels(data.models))
      .catch(err => console.error('Failed to load models:', err))
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // コンポーネントのアンマウント時やページ離脱時にAPIリクエストをキャンセル
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 無効化：エラーの原因となるため
      // if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      //   abortControllerRef.current.abort()
      // }
    }

    const handleVisibilityChange = () => {
      // 無効化：エラーの原因となるため  
      // if (document.hidden && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      //   abortControllerRef.current.abort()
      // }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // クリーンアップ：進行中のリクエストをキャンセル
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // 新規チャット開始（履歴リセット）
  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'こんにちは！田中工業AIです。🔧\n\n加工や作業手順について何でもお聞きください。例えば：\n・「SUS304の切削条件を教えて」\n・「アルミの薄物加工のコツは？」\n・「旋盤で真円度を出すには？」',
        timestamp: new Date()
      }
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // 前回のリクエストがあればキャンセル
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort()
    }

    // 新しいAbortControllerを作成
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          model: selectedModel,
          enableRAG: enableRAG
        }),
        signal: abortController.signal
      })

      if (!response.ok) throw new Error('API request failed')

      const data = await response.json()
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Error:', error)
      
      // リクエストがキャンセルされた場合はエラーメッセージを表示しない
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'すみません、エラーが発生しました。もう一度お試しください。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      // リクエスト完了後、AbortControllerをクリア
      abortControllerRef.current = null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6 h-screen flex flex-col">
        {/* ヘッダー */}
        <div className="bg-black/40 rounded-xl p-4 mb-4 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '2rem' }}>🤖</span>
              <h1 className="text-2xl font-bold text-white">田中工業AI</h1>
              <span className="text-purple-300 text-sm">- 加工技術アシスタント</span>
            </div>
            
            {/* モデル選択プルダウンとボタン群 */}
            <div className="flex items-center gap-3">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-black/40 text-white rounded-lg px-3 py-2 border border-purple-500/30 focus:border-purple-400/50 focus:outline-none text-sm"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setEnableRAG(!enableRAG)}
                className={`custom-rect-button ${enableRAG ? 'green' : 'gray'} small`}
                title="社内データベース検索を有効/無効"
              >
                <span>{enableRAG ? '🧠 RAG:ON' : '🧠 RAG:OFF'}</span>
              </button>
              <button
                onClick={handleNewChat}
                className="custom-rect-button purple small"
                title="新規チャットを開始"
              >
                <span>🆕 新規</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="custom-rect-button gray small"
              >
                <span>ホームに戻る</span>
              </button>
            </div>
          </div>
        </div>

        {/* チャットエリア */}
        <div className="flex-1 bg-black/30 rounded-xl border border-purple-500/20 overflow-hidden flex flex-col">
          {/* メッセージ表示エリア */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600/40 border border-purple-500/30'
                      : 'bg-emerald-600/20 border border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </span>
                    <div className="flex-1">
                      <p className="text-white whitespace-pre-wrap" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                        {message.content}
                      </p>
                      <p className="text-xs mt-2 opacity-50 text-gray-300">
                        {message.timestamp.toLocaleTimeString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-purple-500/20">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                disabled={isLoading}
                className="flex-1 bg-black/40 text-white rounded-xl px-6 py-4 border border-purple-500/30 focus:border-purple-400/50 focus:outline-none disabled:opacity-50"
                style={{ fontSize: '1rem' }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="custom-rect-button purple disabled:opacity-50"
              >
                <span>送信</span>
              </button>
            </div>
          </form>
        </div>

        {/* 使い方のヒントと機能状態表示 */}
        <div className="mt-4 text-center text-sm text-purple-300/60">
          💡 ヒント: 具体的な材質や加工方法を含めると、より詳しい回答が得られます
          <br />
          📝 回答は500文字以内で簡潔にまとめられます
          {enableRAG && (
            <>
              <br />
              🧠 社内データベース検索が有効です（図番・材質・加工方法で関連情報を自動検索）
            </>
          )}
        </div>
      </div>
    </div>
  )
}