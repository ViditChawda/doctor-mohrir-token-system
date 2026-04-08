# API Functions

This folder contains all Firestore database functions for the token booking system.

## Firestore Indexes Required

When you first run the application, Firestore may require you to create composite indexes for the following queries:

1. **Collection: `tokens`**
   - Fields: `date` (Ascending), `tokenNumber` (Ascending)
   
2. **Collection: `tokens`**
   - Fields: `date` (Ascending), `slot` (Ascending), `tokenNumber` (Ascending)

Firestore will automatically show you a link to create these indexes when you first run queries that need them. Click the link to create the indexes in the Firebase Console.

## Functions

- `getCurrentDateKey()` - Returns current date in YYYY-MM-DD format
- `getTokensForDate(date, slot?)` - Get tokens for a specific date and optional slot
- `getNextTokenNumber(date, slot)` - Get the next available token number
- `addToken(token)` - Add a new token to Firestore
- `clearOldTokens(currentDate)` - Delete tokens that are not for the current date
- `deleteToken(tokenId)` - Delete a specific token by ID
- `subscribeToTokens(date, slot, callback)` - Real-time subscription to tokens for a date and slot
- `subscribeToAllTokensForDate(date, callback)` - Real-time subscription to all tokens for a date


