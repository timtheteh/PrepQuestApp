import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function populateDummyData() {
  try {
    console.log('📊 Starting to populate dummy data...');
    const startTime = Date.now();
    
    // Get database instance
    const { db } = await import('./index');

    // Initialize users table with dummy data
    console.log('📊 Step 1/8: Populating users table...');
    
    // Clear existing users data and insert fresh dummy data
    await db.execAsync('DELETE FROM users');
    
    const userData = [
      {
        userID: 'user_30PMYkuSIjxOb4NNiYju8mp3uuK',
        accumulatedDecksCreated: 200,
        accumulatedFlashcardsCreated: 1020,
        accumulatedStudyDecksCreated: 120,
        accumulatedInterviewDecksCreated: 80,
        lastUpdated: '2025-01-27T10:30:00.000Z'
      }
    ];

    // Insert users
    for (const user of userData) {
      await db.execAsync(`
        INSERT INTO users (userID, accumulatedDecksCreated, accumulatedFlashcardsCreated, accumulatedStudyDecksCreated, accumulatedInterviewDecksCreated, lastUpdated)
        VALUES ('${user.userID}', ${user.accumulatedDecksCreated}, ${user.accumulatedFlashcardsCreated}, ${user.accumulatedStudyDecksCreated}, ${user.accumulatedInterviewDecksCreated}, '${user.lastUpdated}')
      `);
    }

    console.log('✅ Users table populated successfully');
    
    // Helper function to read asset as blob
    async function readAssetAsBlob(asset: Asset): Promise<Uint8Array | null> {
      await asset.downloadAsync();
      const uri = asset.localUri || asset.uri;
      if (!uri) return null;
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Convert base64 to Uint8Array
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    // Load actual asset files
    console.log('📊 Step 2/8: Loading asset files...');
    const googleIconAsset = Asset.fromModule(require('../assets/companyIcons/GoogleIcon.png'));
    const jpmIconAsset = Asset.fromModule(require('../assets/companyIcons/JPMIcon.png'));
    const metaIconAsset = Asset.fromModule(require('../assets/companyIcons/MetaIcon.png'));
    const microsoftIconAsset = Asset.fromModule(require('../assets/companyIcons/Microsoft.png'));
    const dummyPhotoAsset = Asset.fromModule(require('../assets/dummyPhotos/dummy_JPEG_photo.jpg'));
    const dummyAudioAsset = Asset.fromModule(require('../assets/dummyAudio/dummy_m4a_audio.m4a'));

    const googleIconBlob = await readAssetAsBlob(googleIconAsset);
    const jpmIconBlob = await readAssetAsBlob(jpmIconAsset);
    const metaIconBlob = await readAssetAsBlob(metaIconAsset);
    const microsoftIconBlob = await readAssetAsBlob(microsoftIconAsset);
    const dummyPhotoBlob = await readAssetAsBlob(dummyPhotoAsset);
    const dummyAudioBlob = await readAssetAsBlob(dummyAudioAsset);

    console.log('✅ Assets loaded as blobs!');

    // Populate folders table first
    console.log('📊 Step 3/8: Populating folders table...');
    
    const folderData = [
      // 3 folders with study decks only
      {
        folderName: 'Computer Science Fundamentals',
        dateAdded: '2025-05-15T10:30:00.000Z',
        lastModifiedDate: '2025-06-10T14:20:00.000Z',
        isFavorited: 1
      },
      {
        folderName: 'Mathematics & Statistics',
        dateAdded: '2025-05-18T09:15:00.000Z',
        lastModifiedDate: '2025-06-12T16:45:00.000Z',
        isFavorited: 0
      },
      {
        folderName: 'Physics & Engineering',
        dateAdded: '2025-05-22T11:45:00.000Z',
        lastModifiedDate: '2025-06-15T13:30:00.000Z',
        isFavorited: 0
      },
      
      // 5 folders with interview decks only
      {
        folderName: 'Software Engineering Interviews',
        dateAdded: '2025-05-10T08:00:00.000Z',
        lastModifiedDate: '2025-06-08T17:15:00.000Z',
        isFavorited: 1
      },
      {
        folderName: 'Data Science Interviews',
        dateAdded: '2025-05-12T14:30:00.000Z',
        lastModifiedDate: '2025-06-11T10:20:00.000Z',
        isFavorited: 0
      },
      {
        folderName: 'Product Management Interviews',
        dateAdded: '2025-05-20T16:45:00.000Z',
        lastModifiedDate: '2025-06-13T11:30:00.000Z',
        isFavorited: 0
      },
      {
        folderName: 'UX/UI Design Interviews',
        dateAdded: '2025-05-25T12:00:00.000Z',
        lastModifiedDate: '2025-06-14T15:45:00.000Z',
        isFavorited: 0
      },
      {
        folderName: 'Business Analyst Interviews',
        dateAdded: '2025-05-28T13:20:00.000Z',
        lastModifiedDate: '2025-06-16T09:10:00.000Z',
        isFavorited: 0
      },
      
      // 2 folders with mixed study and interview decks
      {
        folderName: 'Machine Learning & AI',
        dateAdded: '2025-05-05T15:30:00.000Z',
        lastModifiedDate: '2025-06-09T12:00:00.000Z',
        isFavorited: 1
      },
      {
        folderName: 'Web Development',
        dateAdded: '2025-05-08T10:00:00.000Z',
        lastModifiedDate: '2025-06-07T18:30:00.000Z',
        isFavorited: 0
      }
    ];

    // Insert folders
    for (const folder of folderData) {
      await db.execAsync(`
        INSERT INTO folders (userID, folderName, dateAdded, lastModifiedDate, isFavorited)
        VALUES ('user_30PMYkuSIjxOb4NNiYju8mp3uuK', '${folder.folderName}', '${folder.dateAdded}', '${folder.lastModifiedDate}', ${folder.isFavorited})
      `);
    }

    console.log('✅ Folders table populated successfully');

    // Populate decks table
    console.log('📊 Step 4/8: Populating decks table...');

    const deckData = [
      // 9 study decks for the 3 study folders (3 each)
      // Computer Science Fundamentals folder (folderID: 1)
      {
        deckName: 'Data Structures & Algorithms',
        dateAdded: '2025-05-16T09:00:00.000Z',
        lastModifiedDate: '2025-06-11T15:30:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[1]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Computer Science", "Algorithms"]',
        studyTopicsSubtopics: '["Arrays", "Linked Lists", "Trees", "Graphs", "Sorting"]',
        studyExamQuiz: 'CS Fundamentals Final'
      },
      {
        deckName: 'Object-Oriented Programming',
        dateAdded: '2025-05-17T11:30:00.000Z',
        lastModifiedDate: '2025-06-12T16:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: '2025-06-11T09:30:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[1]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Computer Science", "Programming"]',
        studyTopicsSubtopics: '["Classes", "Inheritance", "Polymorphism", "Encapsulation"]',
        studyExamQuiz: null
      },
      {
        deckName: 'Database Systems',
        dateAdded: '2025-05-18T14:15:00.000Z',
        lastModifiedDate: '2025-06-13T12:20:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[1]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Computer Science", "Database Management"]',
        studyTopicsSubtopics: '["SQL", "Normalization", "Indexing", "Transactions"]',
        studyExamQuiz: 'Database Midterm'
      },

      // Mathematics & Statistics folder (folderID: 2)
      {
        deckName: 'Calculus I',
        dateAdded: '2025-05-19T08:45:00.000Z',
        lastModifiedDate: '2025-06-14T10:15:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Manual',
        lastStudiedDate: '2025-06-13T11:00:00.000Z',
        lastQuizzedDate: '2025-06-12T14:30:00.000Z',
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[2]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Mathematics", "Calculus"]',
        studyTopicsSubtopics: '["Limits", "Derivatives", "Integrals", "Applications"]',
        studyExamQuiz: 'Calculus Final Exam'
      },
      {
        deckName: 'Linear Algebra',
        dateAdded: '2025-05-20T13:20:00.000Z',
        lastModifiedDate: '2025-06-15T17:00:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'Youtube Link',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[2]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Mathematics", "Linear Algebra"]',
        studyTopicsSubtopics: '["Vectors", "Matrices", "Eigenvalues", "Vector Spaces"]',
        studyExamQuiz: null
      },
      {
        deckName: 'Probability & Statistics',
        dateAdded: '2025-05-21T16:30:00.000Z',
        lastModifiedDate: '2025-06-16T09:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[2]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Mathematics", "Statistics"]',
        studyTopicsSubtopics: '["Probability", "Distributions", "Hypothesis Testing", "Regression"]',
        studyExamQuiz: 'Statistics Quiz'
      },

      // Physics & Engineering folder (folderID: 3)
      {
        deckName: 'Classical Mechanics',
        dateAdded: '2025-05-23T10:00:00.000Z',
        lastModifiedDate: '2025-06-17T14:30:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: '2025-06-15T19:45:00.000Z',
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[3]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Physics", "Mechanics"]',
        studyTopicsSubtopics: '["Newton\'s Laws", "Energy", "Momentum", "Oscillations"]',
        studyExamQuiz: 'Physics Midterm'
      },
      {
        deckName: 'Electromagnetism',
        dateAdded: '2025-05-24T12:45:00.000Z',
        lastModifiedDate: '2025-06-18T11:20:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[3]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Physics", "Electromagnetism"]',
        studyTopicsSubtopics: '["Electric Fields", "Magnetic Fields", "Maxwell\'s Equations"]',
        studyExamQuiz: null
      },
      {
        deckName: 'Thermodynamics',
        dateAdded: '2025-05-25T15:30:00.000Z',
        lastModifiedDate: '2025-06-19T16:45:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'Youtube Link',
        lastStudiedDate: '2025-06-18T10:30:00.000Z',
        lastQuizzedDate: '2025-06-17T17:00:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[3]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Physics", "Thermodynamics"]',
        studyTopicsSubtopics: '["Laws of Thermodynamics", "Heat Engines", "Entropy"]',
        studyExamQuiz: 'Thermodynamics Final'
      },

      // 15 interview decks for the 5 interview folders (3 each)
      // Software Engineering Interviews folder (folderID: 4)
      {
        deckName: 'Google SWE Interview Prep',
        dateAdded: '2025-05-11T09:15:00.000Z',
        lastModifiedDate: '2025-06-09T14:30:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: '2025-06-08T11:00:00.000Z',
        lastQuizzedDate: '2025-06-07T15:45:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[4]',
        interviewJobRole: 'Software Engineer',
        interviewType: 'technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Algorithms", "System Design", "Behavioral"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta Frontend Interview',
        dateAdded: '2025-05-12T11:30:00.000Z',
        lastModifiedDate: '2025-06-10T16:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[4]',
        interviewJobRole: 'Frontend Engineer',
        interviewType: 'technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["React", "JavaScript", "CSS"]',
        interviewCompanyIcon: 'Meta'
      },
      {
        deckName: 'JPMorgan Backend Interview',
        dateAdded: '2025-05-13T14:45:00.000Z',
        lastModifiedDate: '2025-06-11T12:00:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[4]',
        interviewJobRole: 'Backend Engineer',
        interviewType: 'technical',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Java", "Spring", "Databases"]',
        interviewCompanyIcon: 'JPMorgan Chase'
      },

      // Data Science Interviews folder (folderID: 5)
      {
        deckName: 'Google Data Scientist Interview',
        dateAdded: '2025-05-13T16:20:00.000Z',
        lastModifiedDate: '2025-06-12T15:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[5]',
        interviewJobRole: 'Data Scientist',
        interviewType: 'technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Machine Learning", "Statistics", "Python"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta ML Engineer Interview',
        dateAdded: '2025-05-14T10:30:00.000Z',
        lastModifiedDate: '2025-06-13T17:20:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'Youtube Link',
        lastStudiedDate: '2025-06-12T12:45:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[5]',
        interviewJobRole: 'ML Engineer',
        interviewType: 'technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Deep Learning", "PyTorch", "System Design"]',
        interviewCompanyIcon: 'Meta'
      },
      {
        deckName: 'JPMorgan Quant Interview',
        dateAdded: '2025-05-15T13:15:00.000Z',
        lastModifiedDate: '2025-06-14T11:30:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[5]',
        interviewJobRole: 'Quantitative Analyst',
        interviewType: 'technical',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Financial Modeling", "Statistics", "Programming"]',
        interviewCompanyIcon: 'JPMorgan Chase'
      },

      // Product Management Interviews folder (folderID: 6)
      {
        deckName: 'Google PM Interview',
        dateAdded: '2025-05-21T09:45:00.000Z',
        lastModifiedDate: '2025-06-15T14:20:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[6]',
        interviewJobRole: 'Product Manager',
        interviewType: 'behavioral',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Product Strategy", "User Research", "Metrics"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta Product Strategy Interview',
        dateAdded: '2025-05-22T12:00:00.000Z',
        lastModifiedDate: '2025-06-16T18:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[6]',
        interviewJobRole: 'Senior Product Manager',
        interviewType: 'case study',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Product Vision", "Go-to-Market", "Competitive Analysis"]',
        interviewCompanyIcon: 'Meta'
      },
      {
        deckName: 'JPMorgan Product Owner Interview',
        dateAdded: '2025-05-23T15:30:00.000Z',
        lastModifiedDate: '2025-06-17T10:15:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'Youtube Link',
        lastStudiedDate: '2025-06-16T13:45:00.000Z',
        lastQuizzedDate: '2025-06-15T17:30:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[6]',
        interviewJobRole: 'Product Owner',
        interviewType: 'behavioral',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Agile", "Stakeholder Management", "Requirements"]',
        interviewCompanyIcon: 'JPMorgan Chase'
      },

      // UX/UI Design Interviews folder (folderID: 7)
      {
        deckName: 'Google UX Designer Interview',
        dateAdded: '2025-05-26T10:15:00.000Z',
        lastModifiedDate: '2025-06-18T15:30:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[7]',
        interviewJobRole: 'UX Designer',
        interviewType: 'others',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["User Research", "Wireframing", "Prototyping"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta UI Designer Interview',
        dateAdded: '2025-05-27T13:45:00.000Z',
        lastModifiedDate: '2025-06-19T12:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: '2025-06-18T18:20:00.000Z',
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[7]',
        interviewJobRole: 'UI Designer',
        interviewType: 'others',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Visual Design", "Design Systems", "Accessibility"]',
        interviewCompanyIcon: 'Meta'
      },
      {
        deckName: 'JPMorgan Design Systems Interview',
        dateAdded: '2025-05-28T16:20:00.000Z',
        lastModifiedDate: '2025-06-20T09:30:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[7]',
        interviewJobRole: 'Design Systems Lead',
        interviewType: 'technical',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Design Tokens", "Component Libraries", "Documentation"]',
        interviewCompanyIcon: 'JPMorgan Chase'
      },

      // Business Analyst Interviews folder (folderID: 8)
      {
        deckName: 'Google Business Analyst Interview',
        dateAdded: '2025-05-29T11:30:00.000Z',
        lastModifiedDate: '2025-06-21T14:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: '2025-06-20T13:30:00.000Z',
        lastQuizzedDate: '2025-06-19T15:45:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[8]',
        interviewJobRole: 'Business Analyst',
        interviewType: 'case study',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Data Analysis", "SQL", "Business Intelligence"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta Analytics Interview',
        dateAdded: '2025-05-30T14:45:00.000Z',
        lastModifiedDate: '2025-06-22T17:20:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Youtube Link',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[8]',
        interviewJobRole: 'Analytics Manager',
        interviewType: 'technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["A/B Testing", "Data Visualization", "Metrics"]',
        interviewCompanyIcon: 'Meta'
      },
      {
        deckName: 'JPMorgan Risk Analyst Interview',
        dateAdded: '2025-05-31T17:15:00.000Z',
        lastModifiedDate: '2025-06-23T10:45:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[8]',
        interviewJobRole: 'Risk Analyst',
        interviewType: 'behavioral',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Risk Modeling", "Regulatory Compliance", "Financial Analysis"]',
        interviewCompanyIcon: 'JPMorgan Chase'
      },

      // Mixed folders - Machine Learning & AI (folderID: 9) - 2 study + 2 interview
      {
        deckName: 'Deep Learning Fundamentals',
        dateAdded: '2025-05-06T08:30:00.000Z',
        lastModifiedDate: '2025-06-10T16:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[9]',
        studyEducationLevel: 'Graduate',
        studySubjects: '["Computer Science", "Machine Learning"]',
        studyTopicsSubtopics: '["Neural Networks", "Backpropagation", "Convolutional Networks"]',
        studyExamQuiz: 'ML Final Exam'
      },
      {
        deckName: 'Natural Language Processing',
        dateAdded: '2025-05-07T12:15:00.000Z',
        lastModifiedDate: '2025-06-11T13:20:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[9]',
        studyEducationLevel: 'Graduate',
        studySubjects: '["Computer Science", "Linguistics"]',
        studyTopicsSubtopics: '["Tokenization", "Embeddings", "Transformers"]',
        studyExamQuiz: null
      },
      {
        deckName: 'Google ML Engineer Interview',
        dateAdded: '2025-05-08T15:45:00.000Z',
        lastModifiedDate: '2025-06-12T18:30:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[9]',
        interviewJobRole: 'ML Engineer',
        interviewType: 'technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Machine Learning", "System Design", "Python"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta AI Research Interview',
        dateAdded: '2025-05-09T10:20:00.000Z',
        lastModifiedDate: '2025-06-13T11:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[9]',
        interviewJobRole: 'AI Research Scientist',
        interviewType: 'others',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'PhD',
        interviewTopics: '["Research Papers", "Algorithm Design", "Publications"]',
        interviewCompanyIcon: 'Meta'
      },

      // Mixed folders - Web Development (folderID: 10) - 2 study + 2 interview
      {
        deckName: 'React & Modern JavaScript',
        dateAdded: '2025-05-09T13:30:00.000Z',
        lastModifiedDate: '2025-06-14T15:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Youtube Link',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[10]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Computer Science", "Web Development"]',
        studyTopicsSubtopics: '["React Hooks", "ES6+", "State Management"]',
        studyExamQuiz: 'Web Development Project'
      },
      {
        deckName: 'Full Stack Development',
        dateAdded: '2025-05-10T16:45:00.000Z',
        lastModifiedDate: '2025-06-15T12:30:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[10]',
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Computer Science", "Software Engineering"]',
        studyTopicsSubtopics: '["Frontend", "Backend", "Databases", "Deployment"]',
        studyExamQuiz: null
      },
      {
        deckName: 'Google Frontend Interview',
        dateAdded: '2025-05-11T09:15:00.000Z',
        lastModifiedDate: '2025-06-16T19:20:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[10]',
        interviewJobRole: 'Frontend Engineer',
        interviewType: 'technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["JavaScript", "React", "CSS", "Performance"]',
        interviewCompanyIcon: 'Google'
      },
      {
        deckName: 'Meta Full Stack Interview',
        dateAdded: '2025-05-12T12:30:00.000Z',
        lastModifiedDate: '2025-06-17T14:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[10]',
        interviewJobRole: 'Full Stack Engineer',
        interviewType: 'technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["System Design", "Database Design", "API Design"]',
        interviewCompanyIcon: 'Meta'
      },

      // 3 additional study decks not in any folder
      {
        deckName: 'Advanced Algorithms',
        dateAdded: '2025-05-26T14:20:00.000Z',
        lastModifiedDate: '2025-06-20T16:30:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: null,
        studyEducationLevel: 'Graduate',
        studySubjects: '["Computer Science", "Algorithms"]',
        studyTopicsSubtopics: '["Dynamic Programming", "Graph Algorithms", "Advanced Data Structures"]',
        studyExamQuiz: 'Algorithms Qualifier'
      },
      {
        deckName: 'Computer Networks',
        dateAdded: '2025-05-27T17:45:00.000Z',
        lastModifiedDate: '2025-06-21T11:15:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'Youtube Link',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: null,
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Computer Science", "Networking"]',
        studyTopicsSubtopics: '["TCP/IP", "Routing", "Network Security"]',
        studyExamQuiz: null
      },
      {
        deckName: 'Software Architecture',
        dateAdded: '2025-05-28T10:30:00.000Z',
        lastModifiedDate: '2025-06-22T13:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'Gen AI Form',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: null,
        studyEducationLevel: 'Graduate',
        studySubjects: '["Computer Science", "Software Engineering"]',
        studyTopicsSubtopics: '["Design Patterns", "Microservices", "Scalability"]',
        studyExamQuiz: 'Architecture Design Review'
      },

      // 3 additional interview decks not in any folder
      {
        deckName: 'Apple iOS Developer Interview',
        dateAdded: '2025-05-29T13:15:00.000Z',
        lastModifiedDate: '2025-06-23T17:30:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Manual',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: null,
        interviewJobRole: 'iOS Developer',
        interviewType: 'brainteasers',
        interviewCompany: 'Apple',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Swift", "iOS Development", "App Store Guidelines"]',
        interviewCompanyIcon: null
      },
      {
        deckName: 'Netflix Backend Interview',
        dateAdded: '2025-05-30T16:45:00.000Z',
        lastModifiedDate: '2025-06-24T12:20:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'File Upload',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: null,
        interviewJobRole: 'Backend Engineer',
        interviewType: 'case study',
        interviewCompany: 'Netflix',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Scalability", "Microservices", "Cloud Infrastructure"]',
        interviewCompanyIcon: null
      },
      {
        deckName: 'Microsoft Azure Interview',
        dateAdded: '2025-05-31T19:30:00.000Z',
        lastModifiedDate: '2025-06-25T15:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'Youtube Link',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: null,
        interviewJobRole: 'Cloud Engineer',
        interviewType: 'technical',
        interviewCompany: 'Microsoft',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Azure Services", "DevOps", "Infrastructure as Code"]',
        interviewCompanyIcon: null
      }
    ];

    // Helper function to escape SQL strings
    const escapeSqlString = (str: string | null | undefined): string => {
      if (str === null || str === undefined) return 'NULL';
      return `'${str.replace(/'/g, "''")}'`;
    };

    // Insert decks
    for (const deck of deckData) {
      await db.execAsync(`
        INSERT INTO decks (
          userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
        ) VALUES (
          'user_30PMYkuSIjxOb4NNiYju8mp3uuK', ${escapeSqlString(deck.deckName)}, ${escapeSqlString(deck.dateAdded)}, ${escapeSqlString(deck.lastModifiedDate)}, ${deck.isFavorited}, ${escapeSqlString(deck.deckType)}, ${escapeSqlString(deck.creationMethod)},
          ${escapeSqlString(deck.lastStudiedDate)}, ${escapeSqlString(deck.lastQuizzedDate)}, ${deck.cardDesignIndex}, ${deck.isAIDeck}, ${escapeSqlString(deck.folderIDs)},
          ${escapeSqlString(deck.studyEducationLevel)}, ${escapeSqlString(deck.studySubjects)}, ${escapeSqlString(deck.studyTopicsSubtopics)}, ${escapeSqlString(deck.studyExamQuiz)},
          ${escapeSqlString(deck.interviewJobRole)}, ${escapeSqlString(deck.interviewType)}, ${escapeSqlString(deck.interviewCompany)}, ${escapeSqlString(deck.interviewExperienceLevel)}, ${escapeSqlString(deck.interviewTopics)}, ${escapeSqlString(deck.interviewCompanyIcon)}
        )
      `);
    }

    console.log('✅ Decks table populated successfully');
    
    // Populate interviewCompanyIcons table
    console.log('📊 Step 5/8: Populating interviewCompanyIcons table...');
    
    // Clear existing company icons data
    await db.execAsync('DELETE FROM interviewCompanyIcons');
    
    // Insert company icons with their blob data
    const companyIconsData = [
      {
        name: 'Google',
        icon: googleIconBlob
      },
      {
        name: 'Meta',
        icon: metaIconBlob
      },
      {
        name: 'JPMorgan Chase',
        icon: jpmIconBlob
      },
      {
        name: 'Microsoft',
        icon: microsoftIconBlob
      }
    ];

    for (const companyIcon of companyIconsData) {
      if (companyIcon.icon) {
        const iconBlob = `X'${Array.from(companyIcon.icon).map(b => b.toString(16).padStart(2, '0')).join('')}'`;
        await db.execAsync(`
          INSERT INTO interviewCompanyIcons (name, icon)
          VALUES ('${companyIcon.name}', ${iconBlob})
        `);
      }
    }

    console.log('✅ InterviewCompanyIcons table populated successfully');
    
    // Populate flashcards table
    console.log('📊 Step 6/8: Populating flashcards table...');

    // Get deck IDs from the deckData array (assuming they are inserted in order)
    const deckIds = Array.from({ length: deckData.length }, (_, i) => i + 1);

    // Create flashcards for each deck
    for (const deckId of deckIds) {
      const deck = deckData[deckId - 1]; // Get the deck data for this deck
      const deckLastStudiedDate = deck.lastStudiedDate;
      const deckLastQuizzedDate = deck.lastQuizzedDate;
      
      // Determine how many flashcards should be studied/quizzed based on deck status
      const totalFlashcards = 7; // We create 7 flashcards per deck
      
      // For study dates: if deck has lastStudiedDate, all flashcards are studied; otherwise realistic portion
      const studiedFlashcardsCount = deckLastStudiedDate 
        ? totalFlashcards 
        : Math.max(1, Math.floor(Math.random() * (Math.floor(totalFlashcards * 0.6) + 1))); // 1 to 60% of flashcards (ensures at least 1)
        
      // For quiz dates: if deck has lastQuizzedDate, all flashcards are quizzed; otherwise realistic portion
      const quizzedFlashcardsCount = deckLastQuizzedDate 
        ? totalFlashcards 
        : Math.max(1, Math.floor(Math.random() * (Math.floor(totalFlashcards * 0.6) + 1))); // 1 to 60% of flashcards (ensures at least 1)
      
      // Create array of flashcard indices that are studied/quizzed
      const studiedIndices = new Set<number>();
      const quizzedIndices = new Set<number>();
      
      // Randomly select flashcards for studying
      while (studiedIndices.size < studiedFlashcardsCount) {
        studiedIndices.add(Math.floor(Math.random() * totalFlashcards));
      }
      
      // Randomly select flashcards for quizzing
      while (quizzedIndices.size < quizzedFlashcardsCount) {
        quizzedIndices.add(Math.floor(Math.random() * totalFlashcards));
      }
      
      // Helper function to get appropriate date for flashcards
      const getFlashcardStudyDate = (flashcardIndex: number): string | null => {
        if (!studiedIndices.has(flashcardIndex)) {
          return null; // This flashcard was not studied
        }
        
        if (deckLastStudiedDate) {
          // If deck has a study date, all studied flashcards have dates on or before deck date
          const deckDate = new Date(deckLastStudiedDate);
          // Generate a date within 7 days before the deck's study date
          const daysOffset = Math.floor(Math.random() * 8); // 0-7 days before
          const flashcardDate = new Date(deckDate);
          flashcardDate.setDate(deckDate.getDate() - daysOffset);
          return flashcardDate.toISOString();
        } else {
          // If deck has no study date, assign random dates to studied flashcards
          const baseDate = new Date('2025-06-15T10:00:00.000Z');
          const daysOffset = Math.floor(Math.random() * 30); // Random date within 30 days
          const flashcardDate = new Date(baseDate);
          flashcardDate.setDate(baseDate.getDate() - daysOffset);
          return flashcardDate.toISOString();
        }
      };
      
      const getFlashcardQuizDate = (flashcardIndex: number): string | null => {
        if (!quizzedIndices.has(flashcardIndex)) {
          return null; // This flashcard was not quizzed
        }
        
        if (deckLastQuizzedDate) {
          // If deck has a quiz date, all quizzed flashcards have dates on or before deck date
          const deckDate = new Date(deckLastQuizzedDate);
          // Generate a date within 7 days before the deck's quiz date
          const daysOffset = Math.floor(Math.random() * 8); // 0-7 days before
          const flashcardDate = new Date(deckDate);
          flashcardDate.setDate(deckDate.getDate() - daysOffset);
          return flashcardDate.toISOString();
        } else {
          // If deck has no quiz date, assign random dates to quizzed flashcards
          const baseDate = new Date('2025-06-14T10:00:00.000Z');
          const daysOffset = Math.floor(Math.random() * 30); // Random date within 30 days
          const flashcardDate = new Date(baseDate);
          flashcardDate.setDate(baseDate.getDate() - daysOffset);
          return flashcardDate.toISOString();
        }
      };
      
      const flashcardData = [
        // 1. qn type text, answer type text
        {
          deckID: deckId,
          difficultyRating: 'Good',
          cognitiveQnType: 'Recall',
          isFavorited: 0,
          questionType: 'text',
          questionText: `What is the fundamental concept behind ${deckId % 2 === 0 ? 'object-oriented programming' : 'functional programming'}?`,
          questionBlob: null,
          answerType: 'text',
          answerText: deckId % 2 === 0 ? 'Encapsulation, inheritance, and polymorphism' : 'Pure functions and immutability',
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(0);
            const quizDate = getFlashcardQuizDate(0);
            return (studyDate === null && quizDate === null) ? null : 45;
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getFlashcardStudyDate(0),
          lastQuizzedDate: getFlashcardQuizDate(0)
        },
        // 2. qn type image, answer type text
        {
          deckID: deckId,
          difficultyRating: 'Easy',
          cognitiveQnType: 'Comprehension',
          isFavorited: 1,
          questionType: 'image',
          questionText: null,
          questionBlob: dummyPhotoBlob,
          answerType: 'text',
          answerText: 'This diagram shows the relationship between different components in a system architecture.',
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(1);
            const quizDate = getFlashcardQuizDate(1);
            return (studyDate === null && quizDate === null) ? null : 30;
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getFlashcardStudyDate(1),
          lastQuizzedDate: getFlashcardQuizDate(1)
        },
        // 3. qn type audio, answer type text
        {
          deckID: deckId,
          difficultyRating: 'Hard',
          cognitiveQnType: 'Application',
          isFavorited: 0,
          questionType: 'audio',
          questionText: null,
          questionBlob: dummyAudioBlob,
          answerType: 'text',
          answerText: 'The audio describes a problem-solving approach using divide and conquer strategy.',
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(2);
            const quizDate = getFlashcardQuizDate(2);
            return (studyDate === null && quizDate === null) ? null : 60;
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getFlashcardStudyDate(2),
          lastQuizzedDate: getFlashcardQuizDate(2)
        },
        // 4. qn type text, answer type mcq
        {
          deckID: deckId,
          difficultyRating: 'Good',
          cognitiveQnType: 'Analysis',
          isFavorited: 0,
          questionType: 'text',
          questionText: `Which of the following best describes the time complexity of ${deckId % 3 === 0 ? 'binary search' : deckId % 3 === 1 ? 'bubble sort' : 'merge sort'}?`,
          questionBlob: null,
          answerType: 'mcq',
          answerText: null,
          answerMCQ: JSON.stringify([
            {"option": "O(1)", "ans": false},
            {"option": deckId % 3 === 0 ? "O(log n)" : deckId % 3 === 1 ? "O(n²)" : "O(n log n)", "ans": true},
            {"option": "O(n)", "ans": false},
            {"option": "O(n²)", "ans": false}
          ]),
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(3);
            const quizDate = getFlashcardQuizDate(3);
            return (studyDate === null && quizDate === null) ? null : 25;
          })(),
          isMcqAnswerRight: 1,
          lastStudiedDate: getFlashcardStudyDate(3),
          lastQuizzedDate: getFlashcardQuizDate(3)
        },
        // 5. qn type text, answer type image
        {
          deckID: deckId,
          difficultyRating: 'Easy',
          cognitiveQnType: 'Synthesis',
          isFavorited: 0,
          questionType: 'text',
          questionText: 'What does this code snippet demonstrate?',
          questionBlob: null,
          answerType: 'image',
          answerText: null,
          answerMCQ: null,
          answerBlob: dummyPhotoBlob,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(4);
            const quizDate = getFlashcardQuizDate(4);
            return (studyDate === null && quizDate === null) ? null : 35;
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getFlashcardStudyDate(4),
          lastQuizzedDate: getFlashcardQuizDate(4)
        },
        // 6. qn type text, answer type audio
        {
          deckID: deckId,
          difficultyRating: 'Hard',
          cognitiveQnType: 'Evaluation',
          isFavorited: 1,
          questionType: 'text',
          questionText: 'Explain the concept of recursion with an example.',
          questionBlob: null,
          answerType: 'audio',
          answerText: null,
          answerMCQ: null,
          answerBlob: dummyAudioBlob,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(5);
            const quizDate = getFlashcardQuizDate(5);
            return (studyDate === null && quizDate === null) ? null : 90;
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getFlashcardStudyDate(5),
          lastQuizzedDate: getFlashcardQuizDate(5)
        },
        // 7. qn type text, answer type voice
        {
          deckID: deckId,
          difficultyRating: 'Good',
          cognitiveQnType: 'Problem-Solving',
          isFavorited: 0,
          questionType: 'text',
          questionText: 'How would you approach debugging a memory leak in a production system?',
          questionBlob: null,
          answerType: 'voice',
          answerText: null,
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getFlashcardStudyDate(6);
            const quizDate = getFlashcardQuizDate(6);
            return (studyDate === null && quizDate === null) ? null : 120;
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getFlashcardStudyDate(6),
          lastQuizzedDate: getFlashcardQuizDate(6)
        }
      ];

      // Insert flashcards for this deck
      for (const flashcard of flashcardData) {
        const questionBlobHex = flashcard.questionBlob ? `X'${Array.from(flashcard.questionBlob).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        const answerBlobHex = flashcard.answerBlob ? `X'${Array.from(flashcard.answerBlob).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        
        await db.execAsync(`
          INSERT INTO flashcards (
            userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            'user_30PMYkuSIjxOb4NNiYju8mp3uuK', ${flashcard.deckID}, ${escapeSqlString(flashcard.difficultyRating)}, ${escapeSqlString(flashcard.cognitiveQnType)}, ${flashcard.isFavorited}, ${escapeSqlString(flashcard.questionType)}, 
            ${escapeSqlString(flashcard.questionText)}, ${questionBlobHex},
            ${escapeSqlString(flashcard.answerType)}, ${escapeSqlString(flashcard.answerText)}, 
            ${escapeSqlString(flashcard.answerMCQ)}, ${answerBlobHex},
            ${flashcard.timeTaken}, ${flashcard.isMcqAnswerRight !== null ? flashcard.isMcqAnswerRight : 'NULL'}, 
            ${escapeSqlString(flashcard.lastStudiedDate)}, 
            ${escapeSqlString(flashcard.lastQuizzedDate)}
          )
        `);
      }
    }

    console.log('✅ Flashcards table populated successfully');
    
    // Populate AIDecks table
    console.log('📊 Step 7/8: Populating AIDecks table...');

    const aiDeckData = [
      // 1. Study deck - AI suggested
      {
        deckName: 'AI-Generated Machine Learning Fundamentals',
        dateAdded: '2025-06-01T10:00:00.000Z',
        lastModifiedDate: '2025-06-01T10:00:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'AI Suggested',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 1,
        folderIDs: null,
        studyEducationLevel: 'Graduate',
        studySubjects: '["Computer Science", "Machine Learning", "Artificial Intelligence"]',
        studyTopicsSubtopics: '["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Deep Learning", "Model Evaluation"]',
        studyExamQuiz: 'ML Fundamentals Assessment',
        interviewJobRole: null,
        interviewType: null,
        interviewCompany: null,
        interviewExperienceLevel: null,
        interviewTopics: null,
        interviewCompanyIcon: null
      },
      // 2. Study deck - AI suggested
      {
        deckName: 'AI-Curated Data Science Essentials',
        dateAdded: '2025-06-02T14:30:00.000Z',
        lastModifiedDate: '2025-06-02T14:30:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'AI Suggested',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 1,
        folderIDs: null,
        studyEducationLevel: 'Undergraduate',
        studySubjects: '["Statistics", "Data Analysis", "Programming"]',
        studyTopicsSubtopics: '["Data Visualization", "Statistical Testing", "Python Programming", "SQL", "Data Cleaning"]',
        studyExamQuiz: null,
        interviewJobRole: null,
        interviewType: null,
        interviewCompany: null,
        interviewExperienceLevel: null,
        interviewTopics: null,
        interviewCompanyIcon: null
      },
      // 3. Interview deck - AI suggested
      {
        deckName: 'AI-Prepared Google Technical Interview',
        dateAdded: '2025-06-03T09:15:00.000Z',
        lastModifiedDate: '2025-06-03T09:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'AI Suggested',
        lastStudiedDate: null,
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 1,
        folderIDs: null,
        studyEducationLevel: null,
        studySubjects: null,
        studyTopicsSubtopics: null,
        studyExamQuiz: null,
        interviewJobRole: 'Software Engineer',
        interviewType: 'technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Algorithms", "System Design", "Data Structures", "Problem Solving"]',
        interviewCompanyIcon: 'Google'
      }
    ];

    // Insert AIDecks
    for (const aiDeck of aiDeckData) {
      await db.execAsync(`
        INSERT INTO AIDecks (
          userID, deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
        ) VALUES (
          'user_30PMYkuSIjxOb4NNiYju8mp3uuK', ${escapeSqlString(aiDeck.deckName)}, ${escapeSqlString(aiDeck.dateAdded)}, ${escapeSqlString(aiDeck.lastModifiedDate)}, ${aiDeck.isFavorited}, ${escapeSqlString(aiDeck.deckType)}, ${escapeSqlString(aiDeck.creationMethod)},
          ${escapeSqlString(aiDeck.lastStudiedDate)}, ${escapeSqlString(aiDeck.lastQuizzedDate)}, ${aiDeck.cardDesignIndex}, ${aiDeck.isAIDeck}, ${escapeSqlString(aiDeck.folderIDs)},
          ${escapeSqlString(aiDeck.studyEducationLevel)}, ${escapeSqlString(aiDeck.studySubjects)}, ${escapeSqlString(aiDeck.studyTopicsSubtopics)}, ${escapeSqlString(aiDeck.studyExamQuiz)},
          ${escapeSqlString(aiDeck.interviewJobRole)}, ${escapeSqlString(aiDeck.interviewType)}, ${escapeSqlString(aiDeck.interviewCompany)}, ${escapeSqlString(aiDeck.interviewExperienceLevel)}, ${escapeSqlString(aiDeck.interviewTopics)}, ${escapeSqlString(aiDeck.interviewCompanyIcon)}
        )
      `);
    }

    console.log('✅ AIDecks table populated successfully');
    
    // Populate AIFlashcards table
    console.log('📊 Step 8/8: Populating AIFlashcards table...');

    // Get AI deck IDs from the aiDeckData array (assuming they are inserted in order)
    const aiDeckIds = Array.from({ length: aiDeckData.length }, (_, i) => i + 1);

    // Create AI flashcards for each AI deck
    for (const aiDeckId of aiDeckIds) {
      const aiDeck = aiDeckData[aiDeckId - 1]; // Get the AI deck data for this deck
      
      // Determine study/quiz status based on AI deck ID
      // AI Deck 1: No attempts (all null dates)
      // AI Deck 2 & 3: Some attempts (10-50% not attempted, rest attempted)
      const isFirstDeck = aiDeckId === 1;
      
      // For AI decks 2 and 3, determine how many flashcards should be studied/quizzed
      const totalFlashcards = 7;
      
      let studiedFlashcardsCount = 0;
      let quizzedFlashcardsCount = 0;
      
      if (!isFirstDeck) {
        // For AI decks 2 and 3, 10-50% of flashcards are NOT attempted (remain null)
        // So 50-90% of flashcards ARE attempted
        const notAttemptedPercentage = Math.random() * 0.4 + 0.1; // 10% to 50%
        const attemptedPercentage = 1 - notAttemptedPercentage; // 50% to 90%
        
        studiedFlashcardsCount = Math.floor(totalFlashcards * attemptedPercentage);
        quizzedFlashcardsCount = Math.floor(totalFlashcards * attemptedPercentage);
        
        // Ensure at least 1 flashcard is attempted for decks 2 and 3
        studiedFlashcardsCount = Math.max(1, studiedFlashcardsCount);
        quizzedFlashcardsCount = Math.max(1, quizzedFlashcardsCount);
      }
      
      // Create array of flashcard indices that are studied/quizzed
      const studiedIndices = new Set<number>();
      const quizzedIndices = new Set<number>();
      
      // Randomly select flashcards for studying (for AI decks 2 and 3)
      while (studiedIndices.size < studiedFlashcardsCount) {
        studiedIndices.add(Math.floor(Math.random() * totalFlashcards));
      }
      
      // Randomly select flashcards for quizzing (for AI decks 2 and 3)
      while (quizzedIndices.size < quizzedFlashcardsCount) {
        quizzedIndices.add(Math.floor(Math.random() * totalFlashcards));
      }
      
      // Helper function to get appropriate date for AI flashcards
      const getAIFlashcardStudyDate = (flashcardIndex: number): string | null => {
        if (isFirstDeck || !studiedIndices.has(flashcardIndex)) {
          return null; // This flashcard was not studied
        }
        
        // Assign random dates to studied flashcards for AI decks 2 and 3
        const baseDate = new Date('2025-06-20T10:00:00.000Z');
        const daysOffset = Math.floor(Math.random() * 15); // Random date within 15 days
        const flashcardDate = new Date(baseDate);
        flashcardDate.setDate(baseDate.getDate() - daysOffset);
        return flashcardDate.toISOString();
      };
      
      const getAIFlashcardQuizDate = (flashcardIndex: number): string | null => {
        if (isFirstDeck || !quizzedIndices.has(flashcardIndex)) {
          return null; // This flashcard was not quizzed
        }
        
        // Assign random dates to quizzed flashcards for AI decks 2 and 3
        const baseDate = new Date('2025-06-18T10:00:00.000Z');
        const daysOffset = Math.floor(Math.random() * 15); // Random date within 15 days
        const flashcardDate = new Date(baseDate);
        flashcardDate.setDate(baseDate.getDate() - daysOffset);
        return flashcardDate.toISOString();
      };
      
      const aiFlashcardData = [
        // 1. text qn to text ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Recall',
          isFavorited: 0,
          questionType: 'text',
          questionText: `What is the primary difference between ${aiDeckId === 1 ? 'supervised and unsupervised learning' : aiDeckId === 2 ? 'descriptive and inferential statistics' : 'arrays and linked lists'}?`,
          questionBlob: null,
          answerType: 'text',
          answerText: aiDeckId === 1 ? 'Supervised learning uses labeled data for training, while unsupervised learning finds patterns in unlabeled data' : aiDeckId === 2 ? 'Descriptive statistics summarize data, while inferential statistics make predictions about populations' : 'Arrays have contiguous memory allocation, while linked lists have non-contiguous memory with pointers',
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(0);
            const quizDate = getAIFlashcardQuizDate(0);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 60) + 20; // 20-80 seconds
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getAIFlashcardStudyDate(0),
          lastQuizzedDate: getAIFlashcardQuizDate(0)
        },
        // 2. image qn to text ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Comprehension',
          isFavorited: 1,
          questionType: 'image',
          questionText: null,
          questionBlob: dummyPhotoBlob,
          answerType: 'text',
          answerText: `This ${aiDeckId === 1 ? 'neural network architecture diagram' : aiDeckId === 2 ? 'data visualization chart' : 'system design diagram'} demonstrates the relationship between different components and their interactions.`,
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(1);
            const quizDate = getAIFlashcardQuizDate(1);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 45) + 15; // 15-60 seconds
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getAIFlashcardStudyDate(1),
          lastQuizzedDate: getAIFlashcardQuizDate(1)
        },
        // 3. audio qn to text ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Application',
          isFavorited: 0,
          questionType: 'audio',
          questionText: null,
          questionBlob: dummyAudioBlob,
          answerType: 'text',
          answerText: `The audio describes a ${aiDeckId === 1 ? 'machine learning algorithm implementation' : aiDeckId === 2 ? 'statistical analysis process' : 'coding interview problem'} and its step-by-step solution approach.`,
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(2);
            const quizDate = getAIFlashcardQuizDate(2);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 90) + 30; // 30-120 seconds
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getAIFlashcardStudyDate(2),
          lastQuizzedDate: getAIFlashcardQuizDate(2)
        },
        // 4. text qn to mcq ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Analysis',
          isFavorited: 0,
          questionType: 'text',
          questionText: `Which of the following best describes the time complexity of ${aiDeckId === 1 ? 'gradient descent optimization' : aiDeckId === 2 ? 'linear regression' : 'binary search'}?`,
          questionBlob: null,
          answerType: 'mcq',
          answerText: null,
          answerMCQ: JSON.stringify([
            {"option": "O(1)", "ans": false},
            {"option": aiDeckId === 1 ? "O(n)" : aiDeckId === 2 ? "O(n²)" : "O(log n)", "ans": true},
            {"option": "O(n)", "ans": false},
            {"option": "O(n²)", "ans": false}
          ]),
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(3);
            const quizDate = getAIFlashcardQuizDate(3);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 40) + 10; // 10-50 seconds
          })(),
          isMcqAnswerRight: 1,
          lastStudiedDate: getAIFlashcardStudyDate(3),
          lastQuizzedDate: getAIFlashcardQuizDate(3)
        },
        // 5. text qn to image ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Synthesis',
          isFavorited: 0,
          questionType: 'text',
          questionText: `What does this ${aiDeckId === 1 ? 'machine learning model architecture' : aiDeckId === 2 ? 'statistical analysis workflow' : 'algorithm implementation'} demonstrate?`,
          questionBlob: null,
          answerType: 'image',
          answerText: null,
          answerMCQ: null,
          answerBlob: dummyPhotoBlob,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(4);
            const quizDate = getAIFlashcardQuizDate(4);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 50) + 20; // 20-70 seconds
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getAIFlashcardStudyDate(4),
          lastQuizzedDate: getAIFlashcardQuizDate(4)
        },
        // 6. text qn to audio ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Evaluation',
          isFavorited: 1,
          questionType: 'text',
          questionText: `Explain the concept of ${aiDeckId === 1 ? 'overfitting in machine learning' : aiDeckId === 2 ? 'correlation vs causation' : 'time complexity analysis'} with examples.`,
          questionBlob: null,
          answerType: 'audio',
          answerText: null,
          answerMCQ: null,
          answerBlob: dummyAudioBlob,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(5);
            const quizDate = getAIFlashcardQuizDate(5);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 120) + 60; // 60-180 seconds
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getAIFlashcardStudyDate(5),
          lastQuizzedDate: getAIFlashcardQuizDate(5)
        },
        // 7. text qn to voice ans
        {
          deckID: aiDeckId,
          difficultyRating: (() => {
            const ratings = ['Easy', 'Good', 'Hard', 'Again'];
            return ratings[Math.floor(Math.random() * ratings.length)];
          })(),
          cognitiveQnType: 'Problem-Solving',
          isFavorited: 0,
          questionType: 'text',
          questionText: `How would you approach ${aiDeckId === 1 ? 'optimizing a neural network for better performance' : aiDeckId === 2 ? 'designing an A/B testing experiment' : 'solving a system design interview question'}?`,
          questionBlob: null,
          answerType: 'voice',
          answerText: null,
          answerMCQ: null,
          answerBlob: null,
          timeTaken: (() => {
            const studyDate = getAIFlashcardStudyDate(6);
            const quizDate = getAIFlashcardQuizDate(6);
            return (studyDate === null && quizDate === null) ? null : Math.floor(Math.random() * 150) + 90; // 90-240 seconds
          })(),
          isMcqAnswerRight: null,
          lastStudiedDate: getAIFlashcardStudyDate(6),
          lastQuizzedDate: getAIFlashcardQuizDate(6)
        }
      ];

      // Insert AI flashcards for this AI deck
      for (const aiFlashcard of aiFlashcardData) {
        const questionBlobHex = aiFlashcard.questionBlob ? `X'${Array.from(aiFlashcard.questionBlob).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        const answerBlobHex = aiFlashcard.answerBlob ? `X'${Array.from(aiFlashcard.answerBlob).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        
        await db.execAsync(`
          INSERT INTO AIFlashcards (
            userID, deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            'user_30PMYkuSIjxOb4NNiYju8mp3uuK', ${aiFlashcard.deckID}, ${escapeSqlString(aiFlashcard.difficultyRating)}, ${escapeSqlString(aiFlashcard.cognitiveQnType)}, ${aiFlashcard.isFavorited}, ${escapeSqlString(aiFlashcard.questionType)}, 
            ${escapeSqlString(aiFlashcard.questionText)}, ${questionBlobHex},
            ${escapeSqlString(aiFlashcard.answerType)}, ${escapeSqlString(aiFlashcard.answerText)}, 
            ${escapeSqlString(aiFlashcard.answerMCQ)}, ${answerBlobHex},
            ${aiFlashcard.timeTaken}, ${aiFlashcard.isMcqAnswerRight !== null ? aiFlashcard.isMcqAnswerRight : 'NULL'}, 
            ${escapeSqlString(aiFlashcard.lastStudiedDate)}, 
            ${escapeSqlString(aiFlashcard.lastQuizzedDate)}
          )
        `);
      }
    }

    console.log('✅ AIFlashcards table populated successfully');
    
    // TODO: Continue with other tables (userFormEntries, etc.)
    console.log('✅ Dummy data population completed for AIFlashcards table');
    
    // Verify that data was loaded correctly
    console.log('\n=== VERIFYING DATA LOAD ===');
    await verifyDataLoad();
    
    const endTime = Date.now();
    console.log(`📊 Dummy data population completed in ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error('❌ Error populating dummy data:', error);
    throw error;
  }
}

// Function to verify that data was loaded correctly
export async function verifyDataLoad() {
  try {
    const { db } = await import('./index');
    
    // Check folders
    const foldersResult = await db.getAllAsync('SELECT COUNT(*) as count FROM folders');
    console.log(`✅ Folders loaded: ${(foldersResult[0] as any).count} folders`);
    
    // Check decks
    const decksResult = await db.getAllAsync('SELECT COUNT(*) as count FROM decks');
    console.log(`✅ Decks loaded: ${(decksResult[0] as any).count} decks`);
    
    // Check flashcards
    const flashcardsResult = await db.getAllAsync('SELECT COUNT(*) as count FROM flashcards');
    console.log(`✅ Flashcards loaded: ${(flashcardsResult[0] as any).count} flashcards`);
    
    // Check AIDecks
    const aiDecksResult = await db.getAllAsync('SELECT COUNT(*) as count FROM AIDecks');
    console.log(`✅ AIDecks loaded: ${(aiDecksResult[0] as any).count} AI decks`);
    
    // Check AIFlashcards
    const aiFlashcardsResult = await db.getAllAsync('SELECT COUNT(*) as count FROM AIFlashcards');
    console.log(`✅ AIFlashcards loaded: ${(aiFlashcardsResult[0] as any).count} AI flashcards`);
    
    // Check interviewCompanyIcons
    const companyIconsResult = await db.getAllAsync('SELECT COUNT(*) as count FROM interviewCompanyIcons');
    console.log(`✅ InterviewCompanyIcons loaded: ${(companyIconsResult[0] as any).count} company icons`);
    
    // Show sample data
    console.log('\n=== SAMPLE DATA ===');
    
    // Sample folders
    const sampleFolders = await db.getAllAsync('SELECT folderName, isFavorited FROM folders LIMIT 3');
    console.log('📁 Sample folders:', sampleFolders);
    
    // Sample decks
    const sampleDecks = await db.getAllAsync('SELECT deckName, deckType, creationMethod FROM decks LIMIT 3');
    console.log('📚 Sample decks:', sampleDecks);
    
    // Sample flashcards
    const sampleFlashcards = await db.getAllAsync('SELECT questionType, answerType, difficultyRating FROM flashcards LIMIT 3');
    console.log('🗂️ Sample flashcards:', sampleFlashcards);
    
    // Sample AIDecks
    const sampleAIDecks = await db.getAllAsync('SELECT deckName, deckType, creationMethod FROM AIDecks LIMIT 3');
    console.log('🤖 Sample AI decks:', sampleAIDecks);
    
    // Sample AIFlashcards
    const sampleAIFlashcards = await db.getAllAsync('SELECT questionType, answerType, difficultyRating FROM AIFlashcards LIMIT 3');
    console.log('🤖 Sample AI flashcards:', sampleAIFlashcards);
    
    // Sample company icons
    const sampleCompanyIcons = await db.getAllAsync('SELECT name FROM interviewCompanyIcons');
    console.log('🏢 Sample company icons:', sampleCompanyIcons);
    
    // Check deck types distribution
    const deckTypes = await db.getAllAsync('SELECT deckType, COUNT(*) as count FROM decks GROUP BY deckType');
    console.log('📊 Deck types distribution:', deckTypes);
    
    // Check AI deck types distribution
    const aiDeckTypes = await db.getAllAsync('SELECT deckType, COUNT(*) as count FROM AIDecks GROUP BY deckType');
    console.log('📊 AI Deck types distribution:', aiDeckTypes);
    
    // Check flashcard types distribution
    const flashcardTypes = await db.getAllAsync('SELECT questionType, answerType, COUNT(*) as count FROM flashcards GROUP BY questionType, answerType');
    console.log('📊 Flashcard types distribution:', flashcardTypes);
    
    // Check AI flashcard types distribution
    const aiFlashcardTypes = await db.getAllAsync('SELECT questionType, answerType, COUNT(*) as count FROM AIFlashcards GROUP BY questionType, answerType');
    console.log('📊 AI Flashcard types distribution:', aiFlashcardTypes);
    
    console.log('\n✅ Data verification completed successfully!');
    
    return {
      folders: (foldersResult[0] as any).count,
      decks: (decksResult[0] as any).count,
      flashcards: (flashcardsResult[0] as any).count,
      aiDecks: (aiDecksResult[0] as any).count,
      aiFlashcards: (aiFlashcardsResult[0] as any).count,
      companyIcons: (companyIconsResult[0] as any).count,
      sampleFolders,
      sampleDecks,
      sampleFlashcards,
      sampleAIDecks,
      sampleAIFlashcards,
      sampleCompanyIcons,
      deckTypes,
      aiDeckTypes,
      flashcardTypes,
      aiFlashcardTypes
    };
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
} 