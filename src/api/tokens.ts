import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  deleteDoc, 
  doc,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase'

export interface Token {
  id: string
  tokenNumber: number
  patientName: string
  date: string
  slot: 'morning' | 'evening'
  createdAt?: Timestamp
  isActive?: boolean
}

const TOKENS_COLLECTION = 'tokens'

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDateKey = (): string => {
  const today = new Date()
  const yyyy = String(today.getFullYear())
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Get all tokens for a specific date and optionally filter by slot
 */
export const getTokensForDate = async (
  date: string, 
  slot?: 'morning' | 'evening'
): Promise<Token[]> => {
  try {
    const tokensRef = collection(db, TOKENS_COLLECTION)
    let q = query(
      tokensRef,
      where('date', '==', date),
      orderBy('tokenNumber', 'asc')
    )

    if (slot) {
      q = query(
        tokensRef,
        where('date', '==', date),
        where('slot', '==', slot),
        orderBy('tokenNumber', 'asc')
      )
    }

    const querySnapshot = await getDocs(q)
    const tokens: Token[] = []
    
    querySnapshot.forEach((docSnapshot) => {
      tokens.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Token)
    })

    return tokens
  } catch (error) {
    console.error('Error getting tokens:', error)
    return []
  }
}

/**
 * Get next token number for a date and slot
 */
export const getNextTokenNumber = async (
  date: string, 
  slot: 'morning' | 'evening'
): Promise<number> => {
  try {
    const tokens = await getTokensForDate(date, slot)
    if (tokens.length === 0) return 1
    return Math.max(...tokens.map(t => t.tokenNumber)) + 1
  } catch (error) {
    console.error('Error getting next token number:', error)
    return 1
  }
}

/**
 * Add a new token to Firestore
 */
export const addToken = async (token: Omit<Token, 'id'>): Promise<Token | null> => {
  try {
    const tokensRef = collection(db, TOKENS_COLLECTION)
    const docRef = await addDoc(tokensRef, {
      ...token,
      isActive: token.isActive ?? false,
      createdAt: Timestamp.now(),
    })
    
    return {
      id: docRef.id,
      ...token,
    } as Token
  } catch (error) {
    console.error('Error adding token:', error)
    return null
  }
}

/**
 * Delete old tokens (keep only tokens for the current date)
 */
export const clearOldTokens = async (currentDate: string): Promise<void> => {
  try {
    const tokensRef = collection(db, TOKENS_COLLECTION)
    const q = query(tokensRef, where('date', '!=', currentDate))
    const querySnapshot = await getDocs(q)
    
    const deletePromises = querySnapshot.docs.map((docSnapshot) => 
      deleteDoc(doc(db, TOKENS_COLLECTION, docSnapshot.id))
    )
    
    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Error clearing old tokens:', error)
  }
}

/**
 * Delete a specific token by ID
 */
export const deleteToken = async (tokenId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, TOKENS_COLLECTION, tokenId))
    return true
  } catch (error) {
    console.error('Error deleting token:', error)
    return false
  }
}

/**
 * Subscribe to tokens for a specific date and slot (real-time updates)
 */
export const subscribeToTokens = (
  date: string,
  slot: 'morning' | 'evening',
  callback: (tokens: Token[]) => void
): (() => void) => {
  const tokensRef = collection(db, TOKENS_COLLECTION)
  const q = query(
    tokensRef,
    where('date', '==', date),
    where('slot', '==', slot),
    orderBy('tokenNumber', 'asc')
  )

  return onSnapshot(q, (querySnapshot) => {
    const tokens: Token[] = []
    querySnapshot.forEach((docSnapshot) => {
      tokens.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Token)
    })
    callback(tokens)
  }, (error) => {
    console.error('Error subscribing to tokens:', error)
    callback([])
  })
}

/**
 * Subscribe to all tokens for a specific date (real-time updates)
 */
export const subscribeToAllTokensForDate = (
  date: string,
  callback: (tokens: Token[]) => void
): (() => void) => {
  const tokensRef = collection(db, TOKENS_COLLECTION)
  const q = query(
    tokensRef,
    where('date', '==', date),
    orderBy('tokenNumber', 'asc')
  )

  return onSnapshot(q, (querySnapshot) => {
    const tokens: Token[] = []
    querySnapshot.forEach((docSnapshot) => {
      tokens.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Token)
    })
    callback(tokens)
  }, (error) => {
    console.error('Error subscribing to tokens:', error)
    callback([])
  })
}

/**
 * Mark exactly one token as active for the given date+slot.
 * This stores state on the existing `tokens` documents (no extra collection).
 */
export const setActiveTokenForSlot = async (
  date: string,
  slot: 'morning' | 'evening',
  activeTokenNumber: number
): Promise<boolean> => {
  try {
    const tokensRef = collection(db, TOKENS_COLLECTION)
    const q = query(tokensRef, where('date', '==', date), where('slot', '==', slot))
    const snap = await getDocs(q)

    const batch = writeBatch(db)
    snap.docs.forEach((d) => {
      const data = d.data() as Partial<Token>
      const tokenNumber = typeof data.tokenNumber === 'number' ? data.tokenNumber : NaN
      batch.update(d.ref, { isActive: tokenNumber === activeTokenNumber })
    })

    await batch.commit()
    return true
  } catch (error) {
    console.error('Error setting active token:', error)
    return false
  }
}


