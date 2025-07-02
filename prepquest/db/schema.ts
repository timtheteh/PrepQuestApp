import * as SQLite from 'expo-sqlite';

export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  try {
    // First drop existing tables to ensure clean schema
    console.log('Dropping existing tables...');
    await db.execAsync('DROP TABLE IF EXISTS AIFlashcards');
    await db.execAsync('DROP TABLE IF EXISTS AIDecks');
    await db.execAsync('DROP TABLE IF EXISTS userFormEntries');
    await db.execAsync('DROP TABLE IF EXISTS flashcards');
    await db.execAsync('DROP TABLE IF EXISTS decks');
    await db.execAsync('DROP TABLE IF EXISTS folders');
    console.log('Existing tables dropped');
    
    // Now create tables with new schema - each in its own execAsync call
    console.log('Creating tables...');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS folders (
        folderID INTEGER PRIMARY KEY AUTOINCREMENT,
        folderName TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        lastModifiedDate TEXT,
        isFavorited INTEGER DEFAULT 0
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS decks (
        deckID INTEGER PRIMARY KEY AUTOINCREMENT,
        deckName TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        lastModifiedDate TEXT,
        isFavorited INTEGER DEFAULT 0,
        deckType TEXT NOT NULL CHECK (deckType IN ('study', 'interview')),
        creationMethod TEXT NOT NULL CHECK (creationMethod IN ('Manual', 'Gen AI Form', 'File Upload', 'Youtube Link', 'AI Suggested')),
        lastStudiedDate TEXT, 
        lastQuizzedDate TEXT,
        cardDesignIndex INTEGER NOT NULL DEFAULT 0 CHECK (cardDesignIndex IN (0, 1, 2, 3)),
        isAIDeck INTEGER DEFAULT 0,
        folderIDs TEXT,
        studyEducationLevel TEXT,
        studySubjects TEXT,
        studyTopicsSubtopics TEXT,
        studyExamQuiz TEXT,
        interviewJobRole TEXT,
        interviewType TEXT CHECK (interviewType IN ('technical', 'behavioral', 'brainteasers', 'case study', 'others')),
        interviewCompany TEXT,
        interviewExperienceLevel TEXT,
        interviewTopics TEXT,
        interviewCompanyIcon BLOB,
        AICardDesignIndex INTEGER DEFAULT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS flashcards (
        flashcardID INTEGER PRIMARY KEY AUTOINCREMENT,
        deckID INTEGER NOT NULL,
        difficultyRating TEXT NOT NULL DEFAULT 'None' CHECK (difficultyRating IN ('Easy', 'Good', 'Hard', 'Again', 'None')),
        cognitiveQnType TEXT NOT NULL DEFAULT 'Recall' CHECK (cognitiveQnType IN ('Recall', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation', 'Problem-Solving')),
        isFavorited INTEGER DEFAULT 0,
        questionType TEXT NOT NULL DEFAULT 'text' CHECK (questionType IN ('text', 'image', 'audio')),
        questionText TEXT,
        questionBlob BLOB,
        answerType TEXT NOT NULL DEFAULT 'text' CHECK (answerType IN ('text', 'mcq', 'image', 'audio', 'voice')),
        answerText TEXT,
        answerMCQ TEXT,
        answerBlob BLOB,
        timeTaken INTEGER,
        isMcqAnswerRight INTEGER DEFAULT 0,
        lastStudiedDate TEXT,
        lastQuizzedDate TEXT,
        FOREIGN KEY (deckID) REFERENCES decks (deckID)
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS userFormEntries (
        formEntryID INTEGER PRIMARY KEY AUTOINCREMENT,
        formEntryType TEXT CHECK (formEntryType IN ('study', 'interview')),
        formEntryMethod TEXT CHECK (formEntryMethod IN ('manual', 'genAIForm', 'fileUpload', 'youtubeLink')),
        formSubmissionDate TEXT NOT NULL,
        deckName TEXT NOT NULL,
        numberOfQuestions INTEGER NOT NULL,
        kindsOfQuestions TEXT,
        youtubeLink TEXT,
        studyEducationLevel TEXT,
        studySubjects TEXT,
        studyTopics TEXT,
        studySubtopics TEXT,
        studyExam TEXT,
        interviewJobRole TEXT,
        interviewType TEXT,
        interviewCompany TEXT,
        interviewExperienceLevel TEXT,
        interviewTopics TEXT
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS AIDecks (
        deckID INTEGER PRIMARY KEY AUTOINCREMENT,
        deckName TEXT NOT NULL,
        dateAdded TEXT,
        lastModifiedDate TEXT,
        isFavorited INTEGER DEFAULT 0,
        deckType TEXT NOT NULL CHECK (deckType IN ('study', 'interview')),
        creationMethod TEXT NOT NULL CHECK (creationMethod IN ('AI Suggested')),
        lastStudiedDate TEXT,
        lastQuizzedDate TEXT,
        cardDesignIndex INTEGER NOT NULL DEFAULT 0 CHECK (cardDesignIndex IN (0, 1, 2)),
        isAIDeck INTEGER DEFAULT 1,
        folderIDs TEXT,
        studyEducationLevel TEXT,
        studySubjects TEXT,
        studyTopicsSubtopics TEXT,
        studyExamQuiz TEXT,
        interviewJobRole TEXT,
        interviewType TEXT,
        interviewCompany TEXT,
        interviewExperienceLevel TEXT,
        interviewTopics TEXT,
        interviewCompanyIcon BLOB
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS AIFlashcards (
        flashcardID INTEGER PRIMARY KEY AUTOINCREMENT,
        deckID INTEGER NOT NULL,
        difficultyRating TEXT NOT NULL DEFAULT 'None' CHECK (difficultyRating IN ('Easy', 'Good', 'Hard', 'Again', 'None')),
        cognitiveQnType TEXT NOT NULL DEFAULT 'Recall' CHECK (cognitiveQnType IN ('Recall', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation', 'Problem-Solving')),
        isFavorited INTEGER DEFAULT 0,
        questionType TEXT NOT NULL DEFAULT 'text' CHECK (questionType IN ('text', 'image', 'audio')),
        questionText TEXT,
        questionBlob BLOB,
        answerType TEXT NOT NULL DEFAULT 'text' CHECK (answerType IN ('text', 'mcq', 'image', 'audio', 'voice')),
        answerText TEXT,
        answerMCQ TEXT,
        answerBlob BLOB,
        timeTaken INTEGER,
        isMcqAnswerRight INTEGER DEFAULT 0,
        lastStudiedDate TEXT,
        lastQuizzedDate TEXT,
        FOREIGN KEY (deckID) REFERENCES AIDecks (deckID)
      )
    `);

    // Create user statistics table for lifetime accumulated counters
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accumulatedDecksCreated INTEGER DEFAULT 0,
        accumulatedFlashcardsCreated INTEGER DEFAULT 0,
        accumulatedStudyDecksCreated INTEGER DEFAULT 0,
        accumulatedInterviewDecksCreated INTEGER DEFAULT 0,
        lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default user statistics record if it doesn't exist
    await db.execAsync(`
      INSERT OR IGNORE INTO users (id, accumulatedDecksCreated, accumulatedFlashcardsCreated, accumulatedStudyDecksCreated, accumulatedInterviewDecksCreated)
      VALUES (1, 0, 0, 0, 0)
    `);

    console.log('Database initialized successfully with new schema');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 