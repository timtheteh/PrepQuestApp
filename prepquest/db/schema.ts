import * as SQLite from 'expo-sqlite';

export function initializeDatabase(db: SQLite.SQLiteDatabase) {
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS folders (
      folderID INTEGER PRIMARY KEY AUTOINCREMENT,
      folderName TEXT NOT NULL,
      dateAdded TEXT NOT NULL, -- Store as UTC ISO string
      lastModifiedDate TEXT -- Store as UTC ISO string
      isFavorited INTEGER DEFAULT 0,
    );

    CREATE TABLE IF NOT EXISTS decks (
      deckID INTEGER PRIMARY KEY AUTOINCREMENT,
      deckName TEXT NOT NULL,
      dateAdded TEXT NOT NULL, -- Store as UTC ISO string
      lastModifiedDate TEXT, -- Store as UTC ISO string
      isFavorited INTEGER DEFAULT 0,
      deckType TEXT NOT NULL CHECK (deckType IN ('study', 'interview')),
      creationMethod TEXT NOT NULL CHECK (creationMethod IN ('manual', 'genAIForm', 'fileUpload', 'youtubeLink', 'AISuggested')),
      lastStudiedDate TEXT, 
      lastQuizzedDate TEXT,
      cardDesignIndex INTEGER NOT NULL DEFAULT 0 CHECK (cardDesignIndex IN (0, 1, 2, 3)),
      isAIDeck INTEGER DEFAULT 0,
      folderID INTEGER,
      studyEducationLevel TEXT NOT NULL,
      studySubjects TEXT NOT NULL, -- Store as JSON array: ["subject1", "subject2", "subject3"]
      studyTopicsSubtopics TEXT, -- Store as JSON array: ["topic1", "topic2", "subtopic1"]
      studyExamQuiz TEXT,
      interviewJobRole TEXT NOT NULL,
      interviewType TEXT NOT NULL,
      interviewCompany TEXT,
      interviewExperienceLevel TEXT,
      interviewTopics TEXT, -- Store as JSON array: ["topic1", "topic2"]
      interviewCompanyIcon TEXT,
      FOREIGN KEY (folderID) REFERENCES folders (folderID)
    );

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
      answerBlob BLOB,
      timeTaken INTEGER,
      isMcqAnswerRight INTEGER DEFAULT 0,
      lastStudiedDate TEXT,
      lastQuizzedDate TEXT,
      FOREIGN KEY (deckID) REFERENCES decks (deckID)
    );

    CREATE TABLE IF NOT EXISTS userFormEntries (
      formEntryID INTEGER PRIMARY KEY AUTOINCREMENT,
      formEntryType TEXT CHECK (formEntryType IN ('study', 'interview')),
      formEntryMethod TEXT CHECK (formEntryMethod IN ('manual', 'genAIForm', 'fileUpload', 'youtubeLink')),
      formSubmissionDate TEXT NOT NULL,
      deckName TEXT NOT NULL,
      numberOfQuestions INTEGER NOT NULL,
      kindsOfQuestions TEXT, -- Store as JSON array: ["Recall", "Comprehesion"]
      studyEducationLevel TEXT NOT NULL,
      studySubjects TEXT NOT NULL, 
      studyTopics TEXT,
      studySubtopics TEXT, 
      studyExam TEXT,
      interviewJobRole TEXT NOT NULL,
      interviewType TEXT NOT NULL,
      interviewCompany TEXT,
      interviewExperienceLevel TEXT,
      interviewTopics TEXT, 
      youtubeLink TEXT
    );

    CREATE TABLE IF NOT EXISTS AIDecks (
      AIDeckID INTEGER PRIMARY KEY AUTOINCREMENT,
      AIDeckName TEXT NOT NULL,
      dateAdded TEXT, -- Store as UTC ISO string
      lastModifiedDate TEXT, -- Store as UTC ISO string
      isFavorited INTEGER DEFAULT 0,
      deckType TEXT NOT NULL CHECK (deckType IN ('study', 'interview')),
      creationMethod TEXT NOT NULL CHECK (creationMethod IN ('AISuggested')),
      lastStudiedDate TEXT, 
      lastQuizzedDate TEXT,
      cardDesignIndex INTEGER NOT NULL DEFAULT 0 CHECK (cardDesignIndex IN (0, 1, 2)),
      isAIDeck INTEGER DEFAULT 0,
      studyEducationLevel TEXT NOT NULL,
      studySubjects TEXT NOT NULL, -- Store as JSON array: ["subject1", "subject2", "subject3"]
      studyTopicsSubtopics TEXT, -- Store as JSON array: ["topic1", "topic2", "subtopic1"]
      studyExamQuiz TEXT,
      interviewJobRole TEXT NOT NULL,
      interviewType TEXT NOT NULL,
      interviewCompany TEXT,
      interviewExperienceLevel TEXT,
      interviewTopics TEXT, -- Store as JSON array: ["topic1", "topic2"]
      interviewCompanyIcon TEXT,
    );

    CREATE TABLE IF NOT EXISTS AIFlashcards (
      flashcardID INTEGER PRIMARY KEY AUTOINCREMENT,
      AIDeckID INTEGER NOT NULL,
      difficultyRating TEXT NOT NULL DEFAULT 'None' CHECK (difficultyRating IN ('Easy', 'Good', 'Hard', 'Again', 'None')),
      cognitiveQnType TEXT NOT NULL DEFAULT 'Recall' CHECK (cognitiveQnType IN ('Recall', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation', 'Problem-Solving')),
      isFavorited INTEGER DEFAULT 0,
      questionType TEXT NOT NULL DEFAULT 'text' CHECK (questionType IN ('text', 'image', 'audio')),
      questionText TEXT,
      questionBlob BLOB,
      answerType TEXT NOT NULL DEFAULT 'text' CHECK (answerType IN ('text', 'mcq', 'image', 'audio', 'voice')),
      answerText TEXT,
      answerBlob BLOB,
      timeTaken INTEGER,
      isMcqAnswerRight INTEGER DEFAULT 0,
      lastStudiedDate TEXT,
      lastQuizzedDate TEXT,
      FOREIGN KEY (AIDeckID) REFERENCES AIDecks (AIDeckID)
    );
  `).then(() => {
    console.log('Database initialized successfully');
  }).catch((error) => {
    console.error('Error initializing database:', error);
  });
} 