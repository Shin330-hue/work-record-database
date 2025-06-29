// src/app/api/ai-advice/route.ts を修正
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    console.log('🔥 AI呼び出し開始:', prompt.substring(0, 100) + '...')
    
    // 🔥 正しいモデル名に修正
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',  // ← これが正解
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const advice = response.text()
    
    console.log('✅ AI回答生成完了:', advice.length, '文字')
    
    return NextResponse.json({ 
      advice,
      timestamp: new Date().toISOString(),
      length: advice.length
    })
    
  } catch (error) {
    console.error('❌ Gemini AI error:', error)
    return NextResponse.json(
      { 
        error: 'AI アドバイスの生成に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}