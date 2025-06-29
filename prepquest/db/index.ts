import * as SQLite from 'expo-sqlite';
import { initializeDatabase } from './schema';

// Open the database
export const db = SQLite.openDatabaseSync('prepquest.db');

// Setup function to initialize the database
export function setupDatabase() {
  initializeDatabase(db);
}

// Export the database instance for use in other files
export default db; 