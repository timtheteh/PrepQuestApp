import { db } from '../index';
import { getCurrentUserID } from './users';

// Helper function to convert hex string to image source
export function convertHexToImageSource(hexString: string | null): { uri: string } | undefined {
  if (!hexString) return undefined;
  
  try {
    // Convert hex string to base64
    const base64 = hexString.match(/.{1,2}/g)
      ?.map(hex => String.fromCharCode(parseInt(hex, 16)))
      .join('') || '';
    
    return { uri: `data:image/png;base64,${btoa(base64)}` };
  } catch (error) {
    console.error('Error converting hex to image source:', error);
    return undefined;
  }
}

// Helper function to get company icon from interviewCompanyIcons table
export async function getCompanyIconImageSource(companyName: string | null): Promise<{ uri: string } | undefined> {
  if (!companyName) return undefined;
  
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT companyIcon FROM interviewCompanyIcons WHERE companyName = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [companyName, userID]) as { companyIcon: string } | null;
    
    if (!result) return undefined;
    
    return convertHexToImageSource(result.companyIcon);
  } catch (error) {
    console.error('Error getting company icon image source:', error);
    return undefined;
  }
}

// Helper function to get all company names from interviewCompanyIcons table
export async function getAllCompanyNames(): Promise<string[]> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT DISTINCT companyName FROM interviewCompanyIcons WHERE userID = ? ORDER BY companyName ASC';
    const result = await db.getAllAsync(query, [userID]) as Array<{ companyName: string }>;
    return result.map(row => row.companyName);
  } catch (error) {
    console.error('Error getting all company names:', error);
    return [];
  }
}

// Helper function to get company icon image source by name
export async function getCompanyIconByName(companyName: string): Promise<{ uri: string } | undefined> {
  try {
    const userID = await getCurrentUserID();
    const query = 'SELECT companyIcon FROM interviewCompanyIcons WHERE companyName = ? AND userID = ?';
    const result = await db.getFirstAsync(query, [companyName, userID]) as { companyIcon: string } | null;
    
    if (!result) return undefined;
    
    return convertHexToImageSource(result.companyIcon);
  } catch (error) {
    console.error('Error getting company icon by name:', error);
    return undefined;
  }
}
