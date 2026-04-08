export interface Token {
  id: string
  tokenNumber: number
  patientName: string
  date: string
  slot: 'morning' | 'evening'
}

const STORAGE_KEY = 'doctor-tokens'
const DATE_KEY = 'current-date'

export const getStoredTokens = (): Token[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const saveTokens = (tokens: Token[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  } catch (error) {
    console.error('Failed to save tokens:', error)
  }
}

export const getCurrentDateKey = (): string => {
  const today = new Date()
  return today.toISOString().split('T')[0] // YYYY-MM-DD format
}

export const getStoredDate = (): string | null => {
  return localStorage.getItem(DATE_KEY)
}

export const setStoredDate = (date: string) => {
  localStorage.setItem(DATE_KEY, date)
}

export const getTokensForDate = (date: string, slot?: 'morning' | 'evening'): Token[] => {
  const allTokens = getStoredTokens()
  let filtered = allTokens.filter(token => token.date === date)
  
  if (slot) {
    filtered = filtered.filter(token => token.slot === slot)
  }
  
  return filtered.sort((a, b) => a.tokenNumber - b.tokenNumber)
}

export const getNextTokenNumber = (date: string, slot: 'morning' | 'evening'): number => {
  const tokens = getTokensForDate(date, slot)
  if (tokens.length === 0) return 1
  return Math.max(...tokens.map(t => t.tokenNumber)) + 1
}

export const addToken = (token: Omit<Token, 'id'>): Token => {
  const newToken: Token = {
    ...token,
    id: `${token.date}-${token.slot}-${token.tokenNumber}-${Date.now()}`,
  }
  const allTokens = getStoredTokens()
  allTokens.push(newToken)
  saveTokens(allTokens)
  return newToken
}

export const clearOldTokens = (currentDate: string) => {
  const allTokens = getStoredTokens()
  const filtered = allTokens.filter(token => token.date === currentDate)
  saveTokens(filtered)
}


