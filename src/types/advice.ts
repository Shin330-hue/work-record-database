// src/types/advice.ts (新規作成)
export interface AIAdviceResponse {
    advice: string
    timestamp: string
    length: number
  }
  
  export interface AIAdviceError {
    error: string
    details: string
  }