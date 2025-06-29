import * as SQLite from 'expo-sqlite';
import { initializeDatabase } from './schema';
// import { populateDummyData } from './dummyData';

// Open the database
export const db = SQLite.openDatabaseSync('prepquest.db');

// Setup function to initialize the database
export async function setupDatabase() {
  try {
    // Wait for schema initialization to complete
    await initializeDatabase(db);
    console.log('Schema initialization completed');
    
    // Wait a bit to ensure tables are fully created
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Populate with dummy data for testing
    // await populateDummyData();
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Export the database instance for use in other files
export default db; 