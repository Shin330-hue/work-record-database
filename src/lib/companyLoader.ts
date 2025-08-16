// src/lib/companyLoader.ts - 企業・製品データローダー

import { Company, Product } from './types'

// 企業データ読み込み
export const loadCompanies = async (): Promise<Company[]> => {
  try {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG_DATA_LOADING === 'true') {
      console.log('🔍 会社データ読み込み情報:', {
        isServerSide: typeof window === 'undefined',
        nodeEnv: process.env.NODE_ENV
      })
    }
    // APIエンドポイントから取得（キャッシュされない）
    const response = await fetch('/api/companies');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.companies || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('会社データの読み込みに失敗:', error);
    }
    return [];
  }
}

// 企業IDから企業データを取得
export const getCompanyById = (companies: Company[], companyId: string): Company | null => {
  return companies.find(company => company.id === companyId) || null
}

// 製品IDから製品データを取得
export const getProductById = (company: Company, productId: string): Product | null => {
  return company.products.find(product => product.id === productId) || null
}