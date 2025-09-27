// This file now serves as a re-export hub for all table-specific functions
// All functions have been moved to their respective table files for better organization

// Re-export everything from table-specific files
export * from './tables/decks';
export * from './tables/flashcards';
export * from './tables/folders';
export * from './tables/aiDecks';
export * from './tables/users';
export * from './tables/userFormEntries';
export * from './tables/interviewCompanyIcons';
export * from './tables/attemptedFlashcards';
export * from './tables/grades';
export * from './tables/statistics';
export * from './tables/manualDeckCreation';
export * from './tables/genAIDeckCreation';
export * from './tables/sortPreferences';
export * from './tables/flashcardView';
export * from './tables/folderOperations';

// Helper function to safely parse JSON (kept here as it's used across multiple files)
export function safeParseJSON(val: any, fallback: any[] = []): any[] {
  if (!val) return fallback;
  try {
    return JSON.parse(val);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}