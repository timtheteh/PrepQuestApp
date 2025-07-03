import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeDatabase } from './schema';
import { populateDummyData, verifyDataLoad } from './dummyData';

// Open the database
export const db = SQLite.openDatabaseSync('prepquest.db');

// Setup function to initialize the database
export async function setupDatabase() {
  try {
    // Initialize AsyncStorage with userID as 1
    await AsyncStorage.setItem('userID', '1');
    console.log('✅ AsyncStorage initialized with userID: 1');
    
    // Wait for schema initialization to complete
    await initializeDatabase(db);
    console.log('Schema initialization completed');
    
    // Wait a bit to ensure tables are fully created
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Populate with dummy data for testing
    await populateDummyData();
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Export the database instance for use in other files
export default db;

// Export verification function
export { verifyDataLoad }; 