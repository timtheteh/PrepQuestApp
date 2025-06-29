import { db } from './index';
import { 
  getAnswerTypeForIndex, 
  getRandomDifficulty, 
  getRandomCognitiveType, 
  generateQuestionText, 
  generateAnswerText, 
  generateRandomDate 
} from './flashcardData';

export async function populateDummyData() {
  // Helper function to generate random dates from last month to this month
  const generateRandomDate = (): string => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const timeDiff = now.getTime() - lastMonth.getTime();
    const randomTime = lastMonth.getTime() + Math.random() * timeDiff;
    return new Date(randomTime).toISOString();
  };

  // Helper function to generate a date that's after a given date
  const generateDateAfter = (afterDate: string): string => {
    const baseDate = new Date(afterDate);
    const now = new Date();
    const timeDiff = now.getTime() - baseDate.getTime();
    const randomTime = baseDate.getTime() + Math.random() * timeDiff;
    return new Date(randomTime).toISOString();
  };

  // Create realistic folders with random dates
  const folders = [
    {
      folderName: 'High School Prep',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1
    },
    {
      folderName: 'University Studies',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0
    },
    {
      folderName: 'Tech Interviews',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1
    },
    {
      folderName: 'Product & Design',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0
    },
    {
      folderName: 'Finance & Data',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1
    }
  ];

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

  // Insert folders first
  const folderPromises = folders.map((folder, index) => {
    const sql = `
      INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited)
      VALUES (${escapeSQL(folder.folderName)}, ${escapeSQL(folder.dateAdded)}, ${escapeSQL(folder.lastModifiedDate)}, ${escapeSQL(folder.isFavorited)})
    `;
    
    return db.execAsync(sql).then(() => {
      console.log(`Inserted folder: ${folder.folderName}`);
      return index + 1; // Return folderID (1-based)
    }).catch((error) => {
      console.error(`Error inserting folder ${folder.folderName}:`, error);
      return null;
    });
  });

  // Wait for folders to be created and get their IDs
  const folderIds = await Promise.all(folderPromises);
  const validFolderIds = folderIds.filter(id => id !== null);
  
  // Dummy study decks with folder assignments and random dates
  const studyDecks = [
    {
      deckName: 'AP Biology Exam Prep',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1,
      deckType: 'study',
      creationMethod: 'manual',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: generateRandomDate(),
      cardDesignIndex: 0,
      isAIDeck: 0,
      folderID: validFolderIds[0], // High School Prep
      studyEducationLevel: 'High School',
      studySubjects: JSON.stringify(['Biology', 'Science']),
      studyTopicsSubtopics: JSON.stringify(['Cell Biology', 'Genetics', 'Evolution', 'Ecology']),
      studyExamQuiz: 'AP Biology',
      interviewJobRole: null,
      interviewType: null,
      interviewCompany: null,
      interviewExperienceLevel: null,
      interviewTopics: null,
      interviewCompanyIcon: null
    },
    {
      deckName: 'SAT Math Practice',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0,
      deckType: 'study',
      creationMethod: 'manual',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: generateRandomDate(),
      cardDesignIndex: 3,
      isAIDeck: 0,
      folderID: validFolderIds[0], // High School Prep
      studyEducationLevel: 'High School',
      studySubjects: JSON.stringify(['Mathematics', 'Algebra', 'Geometry']),
      studyTopicsSubtopics: JSON.stringify(['Algebra', 'Geometry', 'Trigonometry', 'Statistics']),
      studyExamQuiz: 'SAT Math',
      interviewJobRole: null,
      interviewType: null,
      interviewCompany: null,
      interviewExperienceLevel: null,
      interviewTopics: null,
      interviewCompanyIcon: null
    },
    {
      deckName: 'World History - Ancient Civilizations',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0,
      deckType: 'study',
      creationMethod: 'youtubeLink',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: null,
      cardDesignIndex: 1,
      isAIDeck: 0,
      folderID: validFolderIds[0], // High School Prep
      studyEducationLevel: 'High School',
      studySubjects: JSON.stringify(['History', 'World History']),
      studyTopicsSubtopics: JSON.stringify(['Ancient Egypt', 'Greece', 'Rome', 'Mesopotamia']),
      studyExamQuiz: 'World History AP',
      interviewJobRole: null,
      interviewType: null,
      interviewCompany: null,
      interviewExperienceLevel: null,
      interviewTopics: null,
      interviewCompanyIcon: null
    },
    {
      deckName: 'JavaScript ES6+ Mastery',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0,
      deckType: 'study',
      creationMethod: 'genAIForm',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: null,
      cardDesignIndex: 1,
      isAIDeck: 0,
      folderID: validFolderIds[1], // University Studies
      studyEducationLevel: 'University',
      studySubjects: JSON.stringify(['Computer Science', 'Programming', 'Web Development']),
      studyTopicsSubtopics: JSON.stringify(['JavaScript', 'ES6', 'Async Programming', 'Promises']),
      studyExamQuiz: 'Web Development Certification',
      interviewJobRole: null,
      interviewType: null,
      interviewCompany: null,
      interviewExperienceLevel: null,
      interviewTopics: null,
      interviewCompanyIcon: null
    },
    {
      deckName: 'Calculus Derivatives & Integrals',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1,
      deckType: 'study',
      creationMethod: 'fileUpload',
      lastStudiedDate: null,
      lastQuizzedDate: null,
      cardDesignIndex: 2,
      isAIDeck: 0,
      folderID: validFolderIds[1], // University Studies
      studyEducationLevel: 'University',
      studySubjects: JSON.stringify(['Mathematics', 'Calculus']),
      studyTopicsSubtopics: JSON.stringify(['Derivatives', 'Integrals', 'Chain Rule', 'Product Rule']),
      studyExamQuiz: 'Calculus I Final',
      interviewJobRole: null,
      interviewType: null,
      interviewCompany: null,
      interviewExperienceLevel: null,
      interviewTopics: null,
      interviewCompanyIcon: null
    },
    {
      deckName: 'Organic Chemistry Reactions',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1,
      deckType: 'study',
      creationMethod: 'genAIForm',
      lastStudiedDate: null,
      lastQuizzedDate: generateRandomDate(),
      cardDesignIndex: 0,
      isAIDeck: 0,
      folderID: validFolderIds[1], // University Studies
      studyEducationLevel: 'University',
      studySubjects: JSON.stringify(['Chemistry', 'Organic Chemistry']),
      studyTopicsSubtopics: JSON.stringify(['Reactions', 'Mechanisms', 'Stereochemistry']),
      studyExamQuiz: 'Organic Chemistry II',
      interviewJobRole: null,
      interviewType: null,
      interviewCompany: null,
      interviewExperienceLevel: null,
      interviewTopics: null,
      interviewCompanyIcon: null
    }
  ];

  // Dummy interview decks with folder assignments and random dates
  const interviewDecks = [
    {
      deckName: 'Software Engineer - Google',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1,
      deckType: 'interview',
      creationMethod: 'manual',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: generateRandomDate(),
      cardDesignIndex: 0,
      isAIDeck: 0,
      folderID: validFolderIds[2], // Tech Interviews
      studyEducationLevel: null,
      studySubjects: null,
      studyTopicsSubtopics: null,
      studyExamQuiz: null,
      interviewJobRole: 'Software Engineer',
      interviewType: 'Technical',
      interviewCompany: 'Google',
      interviewExperienceLevel: 'Mid-level',
      interviewTopics: JSON.stringify(['Algorithms', 'System Design', 'Data Structures', 'Coding']),
      interviewCompanyIcon: 'GoogleIcon.png'
    },
    {
      deckName: 'Frontend Developer - Google',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0,
      deckType: 'interview',
      creationMethod: 'manual',
      lastStudiedDate: null,
      lastQuizzedDate: generateRandomDate(),
      cardDesignIndex: 3,
      isAIDeck: 0,
      folderID: validFolderIds[2], // Tech Interviews
      studyEducationLevel: null,
      studySubjects: null,
      studyTopicsSubtopics: null,
      studyExamQuiz: null,
      interviewJobRole: 'Frontend Developer',
      interviewType: 'Technical',
      interviewCompany: 'Google',
      interviewExperienceLevel: 'Mid-level',
      interviewTopics: JSON.stringify(['React', 'JavaScript', 'CSS', 'Web Performance']),
      interviewCompanyIcon: 'GoogleIcon.png'
    },
    {
      deckName: 'Product Manager - Meta',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0,
      deckType: 'interview',
      creationMethod: 'genAIForm',
      lastStudiedDate: null,
      lastQuizzedDate: null,
      cardDesignIndex: 1,
      isAIDeck: 0,
      folderID: validFolderIds[3], // Product & Design
      studyEducationLevel: null,
      studySubjects: null,
      studyTopicsSubtopics: null,
      studyExamQuiz: null,
      interviewJobRole: 'Product Manager',
      interviewType: 'Behavioral',
      interviewCompany: 'Meta',
      interviewExperienceLevel: 'Senior',
      interviewTopics: JSON.stringify(['Product Strategy', 'User Research', 'Go-to-Market', 'Metrics']),
      interviewCompanyIcon: 'MetaIcon.png'
    },
    {
      deckName: 'UX Designer - Meta',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1,
      deckType: 'interview',
      creationMethod: 'genAIForm',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: null,
      cardDesignIndex: 0,
      isAIDeck: 0,
      folderID: validFolderIds[3], // Product & Design
      studyEducationLevel: null,
      studySubjects: null,
      studyTopicsSubtopics: null,
      studyExamQuiz: null,
      interviewJobRole: 'UX Designer',
      interviewType: 'Behavioral',
      interviewCompany: 'Meta',
      interviewExperienceLevel: 'Senior',
      interviewTopics: JSON.stringify(['User Research', 'Design Systems', 'Prototyping', 'Usability']),
      interviewCompanyIcon: 'MetaIcon.png'
    },
    {
      deckName: 'Data Scientist - JPMorgan',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 1,
      deckType: 'interview',
      creationMethod: 'youtubeLink',
      lastStudiedDate: generateRandomDate(),
      lastQuizzedDate: null,
      cardDesignIndex: 2,
      isAIDeck: 0,
      folderID: validFolderIds[4], // Finance & Data
      studyEducationLevel: null,
      studySubjects: null,
      studyTopicsSubtopics: null,
      studyExamQuiz: null,
      interviewJobRole: 'Data Scientist',
      interviewType: 'Technical',
      interviewCompany: 'JPMorgan',
      interviewExperienceLevel: 'Entry-level',
      interviewTopics: JSON.stringify(['Machine Learning', 'Statistics', 'Python', 'SQL']),
      interviewCompanyIcon: 'JPMIcon.png'
    },
    {
      deckName: 'Quantitative Analyst - JPMorgan',
      dateAdded: generateRandomDate(),
      lastModifiedDate: generateRandomDate(),
      isFavorited: 0,
      deckType: 'interview',
      creationMethod: 'fileUpload',
      lastStudiedDate: null,
      lastQuizzedDate: generateRandomDate(),
      cardDesignIndex: 1,
      isAIDeck: 0,
      folderID: validFolderIds[4], // Finance & Data
      studyEducationLevel: null,
      studySubjects: null,
      studyTopicsSubtopics: null,
      studyExamQuiz: null,
      interviewJobRole: 'Quantitative Analyst',
      interviewType: 'Technical',
      interviewCompany: 'JPMorgan',
      interviewExperienceLevel: 'Entry-level',
      interviewTopics: JSON.stringify(['Financial Modeling', 'Statistics', 'Python', 'Risk Management']),
      interviewCompanyIcon: 'JPMIcon.png'
    }
  ];

  // Insert study decks and store their IDs
  const studyDeckIds = [];
  for (const deck of studyDecks) {
    const sql = `
      INSERT INTO decks (
        deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
        lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderID,
        studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
        interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel,
        interviewTopics, interviewCompanyIcon
      ) VALUES (
        ${escapeSQL(deck.deckName)}, ${escapeSQL(deck.dateAdded)}, ${escapeSQL(deck.lastModifiedDate)}, 
        ${escapeSQL(deck.isFavorited)}, ${escapeSQL(deck.deckType)}, ${escapeSQL(deck.creationMethod)},
        ${escapeSQL(deck.lastStudiedDate)}, ${escapeSQL(deck.lastQuizzedDate)}, ${escapeSQL(deck.cardDesignIndex)}, 
        ${escapeSQL(deck.isAIDeck)}, ${escapeSQL(deck.folderID)}, ${escapeSQL(deck.studyEducationLevel)},
        ${escapeSQL(deck.studySubjects)}, ${escapeSQL(deck.studyTopicsSubtopics)}, ${escapeSQL(deck.studyExamQuiz)},
        ${escapeSQL(deck.interviewJobRole)}, ${escapeSQL(deck.interviewType)}, ${escapeSQL(deck.interviewCompany)},
        ${escapeSQL(deck.interviewExperienceLevel)}, ${escapeSQL(deck.interviewTopics)}, ${escapeSQL(deck.interviewCompanyIcon)}
      )
    `;
    
    try {
      await db.execAsync(sql);
      console.log(`Inserted study deck: ${deck.deckName}`);
      // Estimate deck ID based on insertion order
      studyDeckIds.push(studyDeckIds.length + 1);
    } catch (error) {
      console.error(`Error inserting study deck ${deck.deckName}:`, error);
    }
  }

  // Insert interview decks and store their IDs
  const interviewDeckIds = [];
  for (const deck of interviewDecks) {
    const sql = `
      INSERT INTO decks (
        deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
        lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderID,
        studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
        interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel,
        interviewTopics, interviewCompanyIcon
      ) VALUES (
        ${escapeSQL(deck.deckName)}, ${escapeSQL(deck.dateAdded)}, ${escapeSQL(deck.lastModifiedDate)}, 
        ${escapeSQL(deck.isFavorited)}, ${escapeSQL(deck.deckType)}, ${escapeSQL(deck.creationMethod)},
        ${escapeSQL(deck.lastStudiedDate)}, ${escapeSQL(deck.lastQuizzedDate)}, ${escapeSQL(deck.cardDesignIndex)}, 
        ${escapeSQL(deck.isAIDeck)}, ${escapeSQL(deck.folderID)}, ${escapeSQL(deck.studyEducationLevel)},
        ${escapeSQL(deck.studySubjects)}, ${escapeSQL(deck.studyTopicsSubtopics)}, ${escapeSQL(deck.studyExamQuiz)},
        ${escapeSQL(deck.interviewJobRole)}, ${escapeSQL(deck.interviewType)}, ${escapeSQL(deck.interviewCompany)},
        ${escapeSQL(deck.interviewExperienceLevel)}, ${escapeSQL(deck.interviewTopics)}, ${escapeSQL(deck.interviewCompanyIcon)}
      )
    `;
    
    try {
      await db.execAsync(sql);
      console.log(`Inserted interview deck: ${deck.deckName}`);
      // Estimate deck ID based on insertion order
      interviewDeckIds.push(studyDeckIds.length + interviewDeckIds.length + 1);
    } catch (error) {
      console.error(`Error inserting interview deck ${deck.deckName}:`, error);
    }
  }

  // Now create flashcards for each deck
  const flashcardPromises = [];
  
  // Create flashcards for study decks
  for (let i = 0; i < studyDecks.length; i++) {
    if (studyDeckIds[i]) {
      const flashcards = generateFlashcardsForDeck(studyDeckIds[i], studyDecks[i].deckName);
      flashcardPromises.push(...flashcards);
    }
  }
  
  // Create flashcards for interview decks
  for (let i = 0; i < interviewDecks.length; i++) {
    if (interviewDeckIds[i]) {
      const flashcards = generateFlashcardsForDeck(interviewDeckIds[i], interviewDecks[i].deckName);
      flashcardPromises.push(...flashcards);
    }
  }

  // Insert all flashcards
  await Promise.all(flashcardPromises);
  console.log('All dummy data inserted successfully');
}

// Function to generate flashcards for a specific deck
function generateFlashcardsForDeck(deckID: number, deckName: string) {
  const flashcards = [];
  
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

  // Generate 15 flashcards per deck (5 for each question type)
  for (let i = 1; i <= 15; i++) {
    const questionType = i <= 5 ? 'text' : i <= 10 ? 'image' : 'audio';
    const answerType = getAnswerTypeForIndex(i);
    
    const flashcard = {
      deckID: deckID,
      difficultyRating: getRandomDifficulty(),
      cognitiveQnType: getRandomCognitiveType(),
      isFavorited: Math.random() > 0.7 ? 1 : 0,
      questionType: questionType,
      questionText: questionType === 'text' ? generateQuestionText(deckName, i) : null,
      questionBlob: questionType === 'text' ? null : 'dummy_JPEG_photo.jpg',
      answerType: answerType,
      answerText: generateAnswerText(answerType, deckName, i),
      answerBlob: answerType === 'text' || answerType === 'mcq' ? null : 
                  answerType === 'audio' ? 'dummy_m4a_audio.m4a' : 'dummy_JPEG_photo.jpg',
      timeTaken: Math.random() > 0.5 ? Math.floor(Math.random() * 120) + 30 : null,
      isMcqAnswerRight: answerType === 'mcq' ? (Math.random() > 0.5 ? 1 : 0) : null,
      lastStudiedDate: Math.random() > 0.3 ? generateRandomDate() : null,
      lastQuizzedDate: Math.random() > 0.4 ? generateRandomDate() : null
    };

    const sql = `
      INSERT INTO flashcards (
        deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
        answerType, answerText, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
      ) VALUES (
        ${escapeSQL(flashcard.deckID)}, ${escapeSQL(flashcard.difficultyRating)}, ${escapeSQL(flashcard.cognitiveQnType)},
        ${escapeSQL(flashcard.isFavorited)}, ${escapeSQL(flashcard.questionType)}, ${escapeSQL(flashcard.questionText)},
        ${escapeSQL(flashcard.questionBlob)}, ${escapeSQL(flashcard.answerType)}, ${escapeSQL(flashcard.answerText)},
        ${escapeSQL(flashcard.answerBlob)}, ${escapeSQL(flashcard.timeTaken)}, ${escapeSQL(flashcard.isMcqAnswerRight)},
        ${escapeSQL(flashcard.lastStudiedDate)}, ${escapeSQL(flashcard.lastQuizzedDate)}
      )
    `;

    flashcards.push(
      db.execAsync(sql).then(() => {
        console.log(`Inserted flashcard ${i} for deck: ${deckName}`);
      }).catch((error) => {
        console.error(`Error inserting flashcard ${i} for deck ${deckName}:`, error);
      })
    );
  }

  return flashcards;
} 