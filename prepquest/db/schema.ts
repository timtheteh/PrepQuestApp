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
    await db.execAsync('DROP TABLE IF EXISTS users');
    await db.execAsync('DROP TABLE IF EXISTS interviewCompanyIcons');
    await db.execAsync('DROP TABLE IF EXISTS streakBadgesTable');
    await db.execAsync('DROP TABLE IF EXISTS welcomeBadgesTable');
    await db.execAsync('DROP TABLE IF EXISTS lifetimeBadgesTable');
    await db.execAsync('DROP TABLE IF EXISTS customBadgesTable');
    console.log('Existing tables dropped');
    
    // Now create tables with new schema - each in its own execAsync call
    console.log('Creating tables...');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS folders (
        folderID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
        folderName TEXT NOT NULL,
        dateAdded TEXT NOT NULL,
        lastModifiedDate TEXT,
        isFavorited INTEGER DEFAULT 0
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS decks (
        deckID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
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
        interviewCompanyIcon TEXT,
        AICardDesignIndex INTEGER DEFAULT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS flashcards (
        flashcardID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
        deckID INTEGER NOT NULL,
        difficultyRating TEXT NOT NULL DEFAULT 'None' CHECK (difficultyRating IN ('Easy', 'Good', 'Hard', 'Again', 'None')),
        cognitiveQnType TEXT NOT NULL DEFAULT 'None' CHECK (cognitiveQnType IN ('Recall', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation', 'Problem-Solving', 'None')),
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
        userID TEXT NOT NULL,
        formEntryType TEXT CHECK (formEntryType IN ('study', 'interview')),
        formEntryMethod TEXT CHECK (formEntryMethod IN ('manual', 'genAIForm', 'fileUpload', 'youtubeLink')),
        formSubmissionDate TEXT NOT NULL,
        deckName TEXT NOT NULL,
        numberOfQuestions INTEGER,
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
        userID TEXT NOT NULL,
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
        interviewCompanyIcon TEXT
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS AIFlashcards (
        flashcardID INTEGER PRIMARY KEY AUTOINCREMENT,
        userID TEXT NOT NULL,
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
        userID TEXT PRIMARY KEY,
        dateJoined TEXT, 
        accumulatedDecksCreated INTEGER DEFAULT 0,
        accumulatedFlashcardsCreated INTEGER DEFAULT 0,
        accumulatedStudyDecksCreated INTEGER DEFAULT 0,
        accumulatedInterviewDecksCreated INTEGER DEFAULT 0,
        lastUpdated TEXT DEFAULT CURRENT_TIMESTAMP,
        notificationsEnabled INTEGER DEFAULT 1,
        autoDecksEnabled INTEGER DEFAULT 1,
        clozeQuestionsEnabled INTEGER DEFAULT 1,
        mcqQuestionsEnabled INTEGER DEFAULT 1,
        voiceRecordedQuestionsEnabled INTEGER DEFAULT 1,
        voiceRecordedTimer INTEGER DEFAULT 120,
        halfwayCheckpoint INTEGER DEFAULT 1,
        defaultTimer INTEGER DEFAULT 20,
        againTimer INTEGER DEFAULT 60,
        hardTimer INTEGER DEFAULT 45,
        goodTimer INTEGER DEFAULT 30,
        easyTimer INTEGER DEFAULT 15,
        language TEXT DEFAULT 'English',
        currentPlan TEXT DEFAULT 'Free Plan' CHECK (currentPlan IN ('Free Plan', 'Pro Plan', 'Premium Plan')),
        fileUploadRequests INTEGER DEFAULT 0,
        genAIFormRequests INTEGER DEFAULT 0,
        youtubeLinkRequests INTEGER DEFAULT 0,
        chatWithAIRequests INTEGER DEFAULT 0
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS interviewCompanyIcons (
        name TEXT PRIMARY KEY,
        icon BLOB NOT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS streakBadgesTable (
        badgeName TEXT NOT NULL,
        badgeSubtext TEXT NOT NULL,
        dayStreakRequirement INTEGER NOT NULL,
        badgeImageName TEXT NOT NULL,
        userIDs TEXT
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS welcomeBadgesTable (
        badgeName TEXT NOT NULL,
        badgeSubtext TEXT NOT NULL,
        badgeImageName TEXT NOT NULL,
        userIDs TEXT,
        badgeOrder INTEGER NOT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS lifetimeBadgesTable (
        badgeName TEXT NOT NULL,
        badgeSubtext TEXT NOT NULL,
        badgeImageName TEXT NOT NULL,
        userIDs TEXT,
        badgeOrder INTEGER NOT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS customBadgesTable (
        userID TEXT NOT NULL,
        badgeSubtext TEXT,
        badgeImageName TEXT,
        achieved INTEGER DEFAULT 0,
        numberOfDecksPledged INTEGER,
        numberOfConsecutiveDays INTEGER,
        dateCreated TEXT,
        expiryDate TEXT,
        boundForRemoval INTEGER DEFAULT 0,
        dateToBeRemoved TEXT
      )
    `);

    // Migration: Add badgeOrder column to existing welcomeBadgesTable if it doesn't exist
    try {
      await db.execAsync(`
        ALTER TABLE welcomeBadgesTable ADD COLUMN badgeOrder INTEGER DEFAULT 0
      `);
      console.log('✅ Added badgeOrder column to welcomeBadgesTable');
    } catch (error) {
      // Column already exists, ignore error
      console.log('ℹ️ badgeOrder column already exists in welcomeBadgesTable');
    }

    // Create optimized indexes for performance (minimal set for maximum impact)
    console.log('Creating database indexes for performance...');
    
    // Folders table indexes - Essential only (3 indexes)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_folders_userID ON folders (userID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_folders_userID_lastModifiedDate ON folders (userID, lastModifiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_folders_userID_isFavorited ON folders (userID, isFavorited)');

    // Decks table indexes - Essential only (8 indexes)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID ON decks (userID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_deckType ON decks (userID, deckType)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_lastModifiedDate ON decks (userID, lastModifiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_isFavorited ON decks (userID, isFavorited)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_deckID ON decks (userID, deckID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_lastQuizzedDate ON decks (userID, lastQuizzedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_lastStudiedDate ON decks (userID, lastStudiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_decks_userID_deckType_lastQuizzedDate ON decks (userID, deckType, lastQuizzedDate)');

    // Flashcards table indexes - Essential only (8 indexes)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID ON flashcards (userID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_deckID ON flashcards (userID, deckID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_lastStudiedDate ON flashcards (userID, lastStudiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_lastQuizzedDate ON flashcards (userID, lastQuizzedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_flashcardID ON flashcards (userID, flashcardID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_difficultyRating ON flashcards (userID, difficultyRating)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_timeTaken ON flashcards (userID, timeTaken)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_flashcards_userID_lastStudiedDate_lastQuizzedDate ON flashcards (userID, lastStudiedDate, lastQuizzedDate)');

    // AIDecks table indexes - Essential only (8 indexes)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID ON AIDecks (userID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_deckType ON AIDecks (userID, deckType)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_lastModifiedDate ON AIDecks (userID, lastModifiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_isFavorited ON AIDecks (userID, isFavorited)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_deckID ON AIDecks (userID, deckID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_lastQuizzedDate ON AIDecks (userID, lastQuizzedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_lastStudiedDate ON AIDecks (userID, lastStudiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aidecks_userID_deckType_lastQuizzedDate ON AIDecks (userID, deckType, lastQuizzedDate)');

    // AIFlashcards table indexes - Essential only (8 indexes)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID ON AIFlashcards (userID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_deckID ON AIFlashcards (userID, deckID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_lastStudiedDate ON AIFlashcards (userID, lastStudiedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_lastQuizzedDate ON AIFlashcards (userID, lastQuizzedDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_flashcardID ON AIFlashcards (userID, flashcardID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_difficultyRating ON AIFlashcards (userID, difficultyRating)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_timeTaken ON AIFlashcards (userID, timeTaken)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_aiflashcards_userID_lastStudiedDate_lastQuizzedDate ON AIFlashcards (userID, lastStudiedDate, lastQuizzedDate)');

    // Users table indexes - Essential only (userID is already primary key)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_users_lastUpdated ON users (lastUpdated)');

    // UserFormEntries table indexes - Essential only (3 indexes)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_userformentries_userID ON userFormEntries (userID)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_userformentries_formSubmissionDate ON userFormEntries (formSubmissionDate)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_userformentries_userID_formEntryType_formEntryMethod ON userFormEntries (userID, formEntryType, formEntryMethod)');

    // InterviewCompanyIcons table indexes - Essential only (name is already primary key)

    // StreakBadgesTable indexes - Essential only (1 index)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_streakbadges_dayStreakRequirement ON streakBadgesTable (dayStreakRequirement)');

    // WelcomeBadgesTable indexes - Essential only (1 index)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_welcomebadges_badgeImageName ON welcomeBadgesTable (badgeImageName)');

    // LifetimeBadgesTable indexes - Essential only (1 index)
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_lifetimebadges_badgeImageName ON lifetimeBadgesTable (badgeImageName)');

    console.log('Database indexes created successfully');

    // // Insert default user statistics record if it doesn't exist
    // await db.execAsync(`
    //   INSERT OR IGNORE INTO users (userID, accumulatedDecksCreated, accumulatedFlashcardsCreated, accumulatedStudyDecksCreated, accumulatedInterviewDecksCreated)
    //   VALUES ('1', 0, 0, 0, 0)
    // `);

    console.log('Database initialized successfully with new schema and indexes');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 