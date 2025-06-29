import { db } from './index';

// Types for form operations
export interface UserFormEntry {
  formEntryID?: number;
  formEntryType?: 'study' | 'interview';
  formEntryMethod?: 'manual' | 'genAIForm' | 'fileUpload' | 'youtubeLink';
  formSubmissionDate: string;
  deckName: string;
  numberOfQuestions: number;
  kindsOfQuestions?: string; // JSON array
  // Study-specific fields (nullable for interview decks)
  studyEducationLevel?: string;
  studySubjects?: string;
  studyTopics?: string;
  studySubtopics?: string;
  studyExam?: string;
  // Interview-specific fields (nullable for study decks)
  interviewJobRole?: string;
  interviewType?: string;
  interviewCompany?: string;
  interviewExperienceLevel?: string;
  interviewTopics?: string;
  youtubeLink?: string;
}

// Helper function to safely escape SQL strings
const escapeSQL = (value: any): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return String(value);
};

// CREATE operations
export const createFormEntry = async (formEntry: UserFormEntry): Promise<number> => {
  const sql = `
    INSERT INTO userFormEntries (
      formEntryType, formEntryMethod, formSubmissionDate, deckName, numberOfQuestions,
      kindsOfQuestions, studyEducationLevel, studySubjects, studyTopics, studySubtopics,
      studyExam, interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel,
      interviewTopics, youtubeLink
    ) VALUES (
      ${escapeSQL(formEntry.formEntryType)}, ${escapeSQL(formEntry.formEntryMethod)}, 
      ${escapeSQL(formEntry.formSubmissionDate)}, ${escapeSQL(formEntry.deckName)}, 
      ${escapeSQL(formEntry.numberOfQuestions)}, ${escapeSQL(formEntry.kindsOfQuestions)},
      ${escapeSQL(formEntry.studyEducationLevel)}, ${escapeSQL(formEntry.studySubjects)},
      ${escapeSQL(formEntry.studyTopics)}, ${escapeSQL(formEntry.studySubtopics)},
      ${escapeSQL(formEntry.studyExam)}, ${escapeSQL(formEntry.interviewJobRole)},
      ${escapeSQL(formEntry.interviewType)}, ${escapeSQL(formEntry.interviewCompany)},
      ${escapeSQL(formEntry.interviewExperienceLevel)}, ${escapeSQL(formEntry.interviewTopics)},
      ${escapeSQL(formEntry.youtubeLink)}
    )
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Created form entry for deck: ${formEntry.deckName}`);
    return 1; // Placeholder - implement proper ID retrieval if needed
  } catch (error) {
    console.error('Error creating form entry:', error);
    throw error;
  }
};

// READ operations
export const getAllFormEntries = async (): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching all form entries:', error);
    throw error;
  }
};

export const getFormEntryById = async (formEntryID: number): Promise<UserFormEntry | null> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE formEntryID = ${formEntryID}
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result as UserFormEntry | null;
  } catch (error) {
    console.error('Error fetching form entry by ID:', error);
    throw error;
  }
};

export const getFormEntriesByType = async (formEntryType: 'study' | 'interview'): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE formEntryType = ${escapeSQL(formEntryType)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by type:', error);
    throw error;
  }
};

export const getFormEntriesByMethod = async (formEntryMethod: 'manual' | 'genAIForm' | 'fileUpload' | 'youtubeLink'): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE formEntryMethod = ${escapeSQL(formEntryMethod)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by method:', error);
    throw error;
  }
};

export const getFormEntriesByDeckName = async (deckName: string): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE deckName LIKE ${escapeSQL(`%${deckName}%`)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by deck name:', error);
    throw error;
  }
};

export const getRecentFormEntries = async (limit: number = 10): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    ORDER BY formSubmissionDate DESC
    LIMIT ${limit}
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching recent form entries:', error);
    throw error;
  }
};

export const getFormEntriesByDateRange = async (startDate: string, endDate: string): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE formSubmissionDate BETWEEN ${escapeSQL(startDate)} AND ${escapeSQL(endDate)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by date range:', error);
    throw error;
  }
};

// UPDATE operations
export const updateFormEntry = async (formEntryID: number, updates: Partial<UserFormEntry>): Promise<void> => {
  const updateFields: string[] = [];
  const values: any[] = [];
  
  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'formEntryID') { // Don't update the primary key
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }
  
  const sql = `
    UPDATE userFormEntries 
    SET ${updateFields.join(', ')}
    WHERE formEntryID = ${formEntryID}
  `;
  
  try {
    await db.execAsync(sql);
    console.log(`Updated form entry ID: ${formEntryID}`);
  } catch (error) {
    console.error('Error updating form entry:', error);
    throw error;
  }
};

// DELETE operations
export const deleteFormEntry = async (formEntryID: number): Promise<void> => {
  const sql = `DELETE FROM userFormEntries WHERE formEntryID = ${formEntryID}`;
  
  try {
    await db.execAsync(sql);
    console.log(`Deleted form entry ID: ${formEntryID}`);
  } catch (error) {
    console.error('Error deleting form entry:', error);
    throw error;
  }
};

export const deleteFormEntriesByDeckName = async (deckName: string): Promise<void> => {
  const sql = `DELETE FROM userFormEntries WHERE deckName = ${escapeSQL(deckName)}`;
  
  try {
    await db.execAsync(sql);
    console.log(`Deleted form entries for deck: ${deckName}`);
  } catch (error) {
    console.error('Error deleting form entries by deck name:', error);
    throw error;
  }
};

// Analytics and statistics
export const getFormEntryStats = async (): Promise<any> => {
  const sql = `
    SELECT 
      COUNT(*) as totalEntries,
      SUM(CASE WHEN formEntryType = 'study' THEN 1 ELSE 0 END) as studyEntries,
      SUM(CASE WHEN formEntryType = 'interview' THEN 1 ELSE 0 END) as interviewEntries,
      SUM(CASE WHEN formEntryMethod = 'manual' THEN 1 ELSE 0 END) as manualEntries,
      SUM(CASE WHEN formEntryMethod = 'genAIForm' THEN 1 ELSE 0 END) as genAIEntries,
      SUM(CASE WHEN formEntryMethod = 'fileUpload' THEN 1 ELSE 0 END) as fileUploadEntries,
      SUM(CASE WHEN formEntryMethod = 'youtubeLink' THEN 1 ELSE 0 END) as youtubeEntries,
      AVG(numberOfQuestions) as avgQuestionsPerEntry
    FROM userFormEntries
  `;
  
  try {
    const result = await db.getFirstAsync(sql);
    return result;
  } catch (error) {
    console.error('Error fetching form entry stats:', error);
    throw error;
  }
};

export const getFormEntriesByCompany = async (company: string): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE interviewCompany = ${escapeSQL(company)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by company:', error);
    throw error;
  }
};

export const getFormEntriesByEducationLevel = async (educationLevel: string): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE studyEducationLevel = ${escapeSQL(educationLevel)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by education level:', error);
    throw error;
  }
};

export const getFormEntriesByJobRole = async (jobRole: string): Promise<UserFormEntry[]> => {
  const sql = `
    SELECT * FROM userFormEntries 
    WHERE interviewJobRole = ${escapeSQL(jobRole)}
    ORDER BY formSubmissionDate DESC
  `;
  
  try {
    const result = await db.getAllAsync(sql);
    return result as UserFormEntry[];
  } catch (error) {
    console.error('Error fetching form entries by job role:', error);
    throw error;
  }
}; 