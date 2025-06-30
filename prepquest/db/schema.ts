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
        creationMethod TEXT NOT NULL CHECK (creationMethod IN ('manual', 'genAIForm', 'fileUpload', 'youtubeLink', 'AISuggested')),
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
        interviewType TEXT,
        interviewCompany TEXT,
        interviewExperienceLevel TEXT,
        interviewTopics TEXT,
        interviewCompanyIcon BLOB
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
        AIDeckID INTEGER PRIMARY KEY AUTOINCREMENT,
        AIDeckName TEXT NOT NULL,
        dateAdded TEXT,
        lastModifiedDate TEXT,
        isFavorited INTEGER DEFAULT 0,
        deckType TEXT NOT NULL CHECK (deckType IN ('study', 'interview')),
        creationMethod TEXT NOT NULL CHECK (creationMethod IN ('AISuggested')),
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
        AIflashcardID INTEGER PRIMARY KEY AUTOINCREMENT,
        AIDeckID INTEGER NOT NULL,
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
        FOREIGN KEY (AIDeckID) REFERENCES AIDecks (AIDeckID)
      )
    `);

    console.log('Database initialized successfully with new schema');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 