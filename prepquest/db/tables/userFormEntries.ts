import { db } from '../index';
import { getCurrentUserID } from './users';

export async function getMostRecentManualFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT * FROM userFormEntries 
      WHERE formEntryType = ? AND userID = ? 
      ORDER BY formSubmissionDate DESC 
      LIMIT 1
    `;
    
    const result = await db.getFirstAsync(query, [mode, userID]);
    return result;
  } catch (error) {
    console.error('Error getting most recent manual form entry:', error);
    return null;
  }
}

export async function saveUserGenAIFormEntry({
  deckName,
  formEntryType,
  formEntryMethod,
  formSubmissionDate,
  numberOfQuestions,
  kindsOfQuestions,
  studyEducationLevel,
  studySubjects,
  studyTopics,
  studySubtopics,
  studyExam,
  interviewJobRole,
  interviewType,
  interviewCompany,
  interviewExperienceLevel,
  interviewTopics
}: {
  deckName: string;
  formEntryType: string;
  formEntryMethod: string;
  formSubmissionDate: string;
  numberOfQuestions: number;
  kindsOfQuestions: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  studyTopics?: string;
  studySubtopics?: string;
  studyExam?: string;
  interviewJobRole?: string;
  interviewType?: string;
  interviewCompany?: string;
  interviewExperienceLevel?: string;
  interviewTopics?: string;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      INSERT INTO userFormEntries (
        deckName, formEntryType, formEntryMethod, formSubmissionDate,
        numberOfQuestions, kindsOfQuestions, studyEducationLevel, studySubjects,
        studyTopics, studySubtopics, studyExam, interviewJobRole, interviewType,
        interviewCompany, interviewExperienceLevel, interviewTopics, userID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.runAsync(query, [
      deckName, formEntryType, formEntryMethod, formSubmissionDate,
      numberOfQuestions, kindsOfQuestions, studyEducationLevel || null, studySubjects || null,
      studyTopics || null, studySubtopics || null, studyExam || null, interviewJobRole || null, interviewType || null,
      interviewCompany || null, interviewExperienceLevel || null, interviewTopics || null, userID
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user GenAI form entry:', error);
    return { success: false };
  }
}

export async function getMostRecentGenAIFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT * FROM userFormEntries 
      WHERE formEntryType = ? AND userID = ? 
      ORDER BY formSubmissionDate DESC 
      LIMIT 1
    `;
    
    const result = await db.getFirstAsync(query, [mode, userID]);
    return result;
  } catch (error) {
    console.error('Error getting most recent GenAI form entry:', error);
    return null;
  }
}

export async function saveUserFileUploadFormEntry({
  deckName,
  studyEducationLevel,
  studySubjects,
  numberOfQuestions,
  interviewJobRole,
  interviewType
}: {
  deckName: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  numberOfQuestions: number;
  interviewJobRole?: string;
  interviewType?: string;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      INSERT INTO userFormEntries (
        deckName, formEntryType, formEntryMethod, formSubmissionDate,
        numberOfQuestions, studyEducationLevel, studySubjects,
        interviewJobRole, interviewType, userID
      ) VALUES (?, 'file_upload', 'file_upload', ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [
      deckName, currentDate, numberOfQuestions, studyEducationLevel || null, studySubjects || null,
      interviewJobRole || null, interviewType || null, userID
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user file upload form entry:', error);
    return { success: false };
  }
}

export async function saveUserYouTubeLinkFormEntry({
  deckName,
  studyEducationLevel,
  studySubjects,
  numberOfQuestions,
  interviewJobRole,
  interviewType,
  youtubeLink
}: {
  deckName: string;
  studyEducationLevel?: string;
  studySubjects?: string;
  numberOfQuestions: number;
  interviewJobRole?: string;
  interviewType?: string;
  youtubeLink: string;
}): Promise<{ success: boolean }> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      INSERT INTO userFormEntries (
        deckName, formEntryType, formEntryMethod, formSubmissionDate,
        numberOfQuestions, studyEducationLevel, studySubjects,
        interviewJobRole, interviewType, youtubeLink, userID
      ) VALUES (?, 'youtube', 'youtube', ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const currentDate = new Date().toISOString();
    
    await db.runAsync(query, [
      deckName, currentDate, numberOfQuestions, studyEducationLevel || null, studySubjects || null,
      interviewJobRole || null, interviewType || null, youtubeLink, userID
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user YouTube link form entry:', error);
    return { success: false };
  }
}

export async function getMostRecentFileUploadFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT * FROM userFormEntries 
      WHERE formEntryType = 'file_upload' AND userID = ? 
      ORDER BY formSubmissionDate DESC 
      LIMIT 1
    `;
    
    const result = await db.getFirstAsync(query, [userID]);
    return result;
  } catch (error) {
    console.error('Error getting most recent file upload form entry:', error);
    return null;
  }
}

export async function getMostRecentYouTubeLinkFormEntry(mode: 'study' | 'interview'): Promise<any | null> {
  try {
    const userID = await getCurrentUserID();
    const query = `
      SELECT * FROM userFormEntries 
      WHERE formEntryType = 'youtube' AND userID = ? 
      ORDER BY formSubmissionDate DESC 
      LIMIT 1
    `;
    
    const result = await db.getFirstAsync(query, [userID]);
    return result;
  } catch (error) {
    console.error('Error getting most recent YouTube link form entry:', error);
    return null;
  }
}
