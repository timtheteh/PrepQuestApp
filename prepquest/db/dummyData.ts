import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function populateDummyData() {
  try {
    console.log('Starting to populate dummy data...');
    
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
    console.log('Loading actual asset files...');
    const googleIconAsset = Asset.fromModule(require('../assets/companyIcons/GoogleIcon.png'));
    const jpmIconAsset = Asset.fromModule(require('../assets/companyIcons/JPMIcon.png'));
    const metaIconAsset = Asset.fromModule(require('../assets/companyIcons/MetaIcon.png'));
    const dummyPhotoAsset = Asset.fromModule(require('../assets/dummyPhotos/dummy_JPEG_photo.jpg'));
    const dummyAudioAsset = Asset.fromModule(require('../assets/dummyAudio/dummy_m4a_audio.m4a'));

    const googleIconBlob = await readAssetAsBlob(googleIconAsset);
    const jpmIconBlob = await readAssetAsBlob(jpmIconAsset);
    const metaIconBlob = await readAssetAsBlob(metaIconAsset);
    const dummyPhotoBlob = await readAssetAsBlob(dummyPhotoAsset);
    const dummyAudioBlob = await readAssetAsBlob(dummyAudioAsset);

    console.log('Assets loaded as blobs!');

    // Get database instance
    const { db } = await import('./index');

    // Populate folders table first
    console.log('Populating folders table...');
    
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
        INSERT INTO folders (folderName, dateAdded, lastModifiedDate, isFavorited)
        VALUES ('${folder.folderName}', '${folder.dateAdded}', '${folder.lastModifiedDate}', ${folder.isFavorited})
      `);
    }

    console.log('Folders table populated successfully');

    // Populate decks table
    console.log('Populating decks table...');

    const deckData = [
      // 9 study decks for the 3 study folders (3 each)
      // Computer Science Fundamentals folder (folderID: 1)
      {
        deckName: 'Data Structures & Algorithms',
        dateAdded: '2025-05-16T09:00:00.000Z',
        lastModifiedDate: '2025-06-11T15:30:00.000Z',
        isFavorited: 1,
        deckType: 'study',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-10T10:00:00.000Z',
        lastQuizzedDate: '2025-06-09T14:00:00.000Z',
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
        creationMethod: 'genAIForm',
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
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-12T13:45:00.000Z',
        lastQuizzedDate: '2025-06-11T16:30:00.000Z',
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
        creationMethod: 'manual',
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
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-14T15:45:00.000Z',
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
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-15T12:30:00.000Z',
        lastQuizzedDate: '2025-06-14T18:15:00.000Z',
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
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-16T16:00:00.000Z',
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
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-17T13:15:00.000Z',
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
        creationMethod: 'youtubeLink',
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
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-08T11:00:00.000Z',
        lastQuizzedDate: '2025-06-07T15:45:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[4]',
        interviewJobRole: 'Software Engineer',
        interviewType: 'Technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Algorithms", "System Design", "Behavioral"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta Frontend Interview',
        dateAdded: '2025-05-12T11:30:00.000Z',
        lastModifiedDate: '2025-06-10T16:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-09T13:30:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[4]',
        interviewJobRole: 'Frontend Engineer',
        interviewType: 'Technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["React", "JavaScript", "CSS"]',
        interviewCompanyIcon: metaIconBlob
      },
      {
        deckName: 'JPMorgan Backend Interview',
        dateAdded: '2025-05-13T14:45:00.000Z',
        lastModifiedDate: '2025-06-11T12:00:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-10T10:15:00.000Z',
        lastQuizzedDate: '2025-06-09T18:30:00.000Z',
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[4]',
        interviewJobRole: 'Backend Engineer',
        interviewType: 'Technical',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Java", "Spring", "Databases"]',
        interviewCompanyIcon: jpmIconBlob
      },

      // Data Science Interviews folder (folderID: 5)
      {
        deckName: 'Google Data Scientist Interview',
        dateAdded: '2025-05-13T16:20:00.000Z',
        lastModifiedDate: '2025-06-12T15:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-11T14:00:00.000Z',
        lastQuizzedDate: '2025-06-10T16:30:00.000Z',
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[5]',
        interviewJobRole: 'Data Scientist',
        interviewType: 'Technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Machine Learning", "Statistics", "Python"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta ML Engineer Interview',
        dateAdded: '2025-05-14T10:30:00.000Z',
        lastModifiedDate: '2025-06-13T17:20:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-12T12:45:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[5]',
        interviewJobRole: 'ML Engineer',
        interviewType: 'Technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Deep Learning", "PyTorch", "System Design"]',
        interviewCompanyIcon: metaIconBlob
      },
      {
        deckName: 'JPMorgan Quant Interview',
        dateAdded: '2025-05-15T13:15:00.000Z',
        lastModifiedDate: '2025-06-14T11:30:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-13T09:20:00.000Z',
        lastQuizzedDate: '2025-06-12T19:15:00.000Z',
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[5]',
        interviewJobRole: 'Quantitative Analyst',
        interviewType: 'Technical',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Financial Modeling", "Statistics", "Programming"]',
        interviewCompanyIcon: jpmIconBlob
      },

      // Product Management Interviews folder (folderID: 6)
      {
        deckName: 'Google PM Interview',
        dateAdded: '2025-05-21T09:45:00.000Z',
        lastModifiedDate: '2025-06-15T14:20:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-14T16:30:00.000Z',
        lastQuizzedDate: '2025-06-13T12:45:00.000Z',
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[6]',
        interviewJobRole: 'Product Manager',
        interviewType: 'Behavioral',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Product Strategy", "User Research", "Metrics"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta Product Strategy Interview',
        dateAdded: '2025-05-22T12:00:00.000Z',
        lastModifiedDate: '2025-06-16T18:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-15T11:15:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[6]',
        interviewJobRole: 'Senior Product Manager',
        interviewType: 'Case Study',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Product Vision", "Go-to-Market", "Competitive Analysis"]',
        interviewCompanyIcon: metaIconBlob
      },
      {
        deckName: 'JPMorgan Product Owner Interview',
        dateAdded: '2025-05-23T15:30:00.000Z',
        lastModifiedDate: '2025-06-17T10:15:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-16T13:45:00.000Z',
        lastQuizzedDate: '2025-06-15T17:30:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[6]',
        interviewJobRole: 'Product Owner',
        interviewType: 'Behavioral',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Agile", "Stakeholder Management", "Requirements"]',
        interviewCompanyIcon: jpmIconBlob
      },

      // UX/UI Design Interviews folder (folderID: 7)
      {
        deckName: 'Google UX Designer Interview',
        dateAdded: '2025-05-26T10:15:00.000Z',
        lastModifiedDate: '2025-06-18T15:30:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-17T14:20:00.000Z',
        lastQuizzedDate: '2025-06-16T11:00:00.000Z',
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[7]',
        interviewJobRole: 'UX Designer',
        interviewType: 'Portfolio Review',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["User Research", "Wireframing", "Prototyping"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta UI Designer Interview',
        dateAdded: '2025-05-27T13:45:00.000Z',
        lastModifiedDate: '2025-06-19T12:45:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-18T16:15:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[7]',
        interviewJobRole: 'UI Designer',
        interviewType: 'Design Challenge',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Visual Design", "Design Systems", "Accessibility"]',
        interviewCompanyIcon: metaIconBlob
      },
      {
        deckName: 'JPMorgan Design Systems Interview',
        dateAdded: '2025-05-28T16:20:00.000Z',
        lastModifiedDate: '2025-06-20T09:30:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-19T10:45:00.000Z',
        lastQuizzedDate: '2025-06-18T18:20:00.000Z',
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: '[7]',
        interviewJobRole: 'Design Systems Lead',
        interviewType: 'Technical',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Design Tokens", "Component Libraries", "Documentation"]',
        interviewCompanyIcon: jpmIconBlob
      },

      // Business Analyst Interviews folder (folderID: 8)
      {
        deckName: 'Google Business Analyst Interview',
        dateAdded: '2025-05-29T11:30:00.000Z',
        lastModifiedDate: '2025-06-21T14:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-20T13:30:00.000Z',
        lastQuizzedDate: '2025-06-19T15:45:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: '[8]',
        interviewJobRole: 'Business Analyst',
        interviewType: 'Case Study',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Data Analysis", "SQL", "Business Intelligence"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta Analytics Interview',
        dateAdded: '2025-05-30T14:45:00.000Z',
        lastModifiedDate: '2025-06-22T17:20:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-21T12:00:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[8]',
        interviewJobRole: 'Analytics Manager',
        interviewType: 'Technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["A/B Testing", "Data Visualization", "Metrics"]',
        interviewCompanyIcon: metaIconBlob
      },
      {
        deckName: 'JPMorgan Risk Analyst Interview',
        dateAdded: '2025-05-31T17:15:00.000Z',
        lastModifiedDate: '2025-06-23T10:45:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-22T15:30:00.000Z',
        lastQuizzedDate: '2025-06-21T19:15:00.000Z',
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[8]',
        interviewJobRole: 'Risk Analyst',
        interviewType: 'Behavioral',
        interviewCompany: 'JPMorgan Chase',
        interviewExperienceLevel: 'Entry-level',
        interviewTopics: '["Risk Modeling", "Regulatory Compliance", "Financial Analysis"]',
        interviewCompanyIcon: jpmIconBlob
      },

      // Mixed folders - Machine Learning & AI (folderID: 9) - 2 study + 2 interview
      {
        deckName: 'Deep Learning Fundamentals',
        dateAdded: '2025-05-06T08:30:00.000Z',
        lastModifiedDate: '2025-06-10T16:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-09T14:20:00.000Z',
        lastQuizzedDate: '2025-06-08T11:30:00.000Z',
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
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-10T10:45:00.000Z',
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
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-11T16:15:00.000Z',
        lastQuizzedDate: '2025-06-10T12:45:00.000Z',
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[9]',
        interviewJobRole: 'ML Engineer',
        interviewType: 'Technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["Machine Learning", "System Design", "Python"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta AI Research Interview',
        dateAdded: '2025-05-09T10:20:00.000Z',
        lastModifiedDate: '2025-06-13T11:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-12T13:30:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[9]',
        interviewJobRole: 'AI Research Scientist',
        interviewType: 'Research Discussion',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'PhD',
        interviewTopics: '["Research Papers", "Algorithm Design", "Publications"]',
        interviewCompanyIcon: metaIconBlob
      },

      // Mixed folders - Web Development (folderID: 10) - 2 study + 2 interview
      {
        deckName: 'React & Modern JavaScript',
        dateAdded: '2025-05-09T13:30:00.000Z',
        lastModifiedDate: '2025-06-14T15:45:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-13T17:20:00.000Z',
        lastQuizzedDate: '2025-06-12T14:10:00.000Z',
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
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-14T11:45:00.000Z',
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
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-15T15:30:00.000Z',
        lastQuizzedDate: '2025-06-14T13:15:00.000Z',
        cardDesignIndex: 1,
        isAIDeck: 0,
        folderIDs: '[10]',
        interviewJobRole: 'Frontend Engineer',
        interviewType: 'Technical',
        interviewCompany: 'Google',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["JavaScript", "React", "CSS", "Performance"]',
        interviewCompanyIcon: googleIconBlob
      },
      {
        deckName: 'Meta Full Stack Interview',
        dateAdded: '2025-05-12T12:30:00.000Z',
        lastModifiedDate: '2025-06-17T14:15:00.000Z',
        isFavorited: 0,
        deckType: 'interview',
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-16T10:20:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: '[10]',
        interviewJobRole: 'Full Stack Engineer',
        interviewType: 'Technical',
        interviewCompany: 'Meta',
        interviewExperienceLevel: 'Senior',
        interviewTopics: '["System Design", "Database Design", "API Design"]',
        interviewCompanyIcon: metaIconBlob
      },

      // 3 additional study decks not in any folder
      {
        deckName: 'Advanced Algorithms',
        dateAdded: '2025-05-26T14:20:00.000Z',
        lastModifiedDate: '2025-06-20T16:30:00.000Z',
        isFavorited: 0,
        deckType: 'study',
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-19T12:45:00.000Z',
        lastQuizzedDate: '2025-06-18T18:20:00.000Z',
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
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-20T14:30:00.000Z',
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
        creationMethod: 'genAIForm',
        lastStudiedDate: '2025-06-21T16:15:00.000Z',
        lastQuizzedDate: '2025-06-20T19:30:00.000Z',
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
        creationMethod: 'manual',
        lastStudiedDate: '2025-06-22T11:45:00.000Z',
        lastQuizzedDate: '2025-06-21T15:20:00.000Z',
        cardDesignIndex: 2,
        isAIDeck: 0,
        folderIDs: null,
        interviewJobRole: 'iOS Developer',
        interviewType: 'Technical',
        interviewCompany: 'Apple',
        interviewExperienceLevel: 'Mid-level',
        interviewTopics: '["Swift", "iOS Development", "App Store Guidelines"]',
        interviewCompanyIcon: null
      },
      {
        deckName: 'Netflix Backend Interview',
        dateAdded: '2025-05-30T16:45:00.000Z',
        lastModifiedDate: '2025-06-24T12:20:00.000Z',
        isFavorited: 1,
        deckType: 'interview',
        creationMethod: 'fileUpload',
        lastStudiedDate: '2025-06-23T14:10:00.000Z',
        lastQuizzedDate: null,
        cardDesignIndex: 3,
        isAIDeck: 0,
        folderIDs: null,
        interviewJobRole: 'Backend Engineer',
        interviewType: 'System Design',
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
        creationMethod: 'youtubeLink',
        lastStudiedDate: '2025-06-24T13:25:00.000Z',
        lastQuizzedDate: '2025-06-23T18:40:00.000Z',
        cardDesignIndex: 0,
        isAIDeck: 0,
        folderIDs: null,
        interviewJobRole: 'Cloud Engineer',
        interviewType: 'Technical',
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
      const companyIconBlob = deck.interviewCompanyIcon ? `X'${Array.from(deck.interviewCompanyIcon).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
      
      await db.execAsync(`
        INSERT INTO decks (
          deckName, dateAdded, lastModifiedDate, isFavorited, deckType, creationMethod,
          lastStudiedDate, lastQuizzedDate, cardDesignIndex, isAIDeck, folderIDs,
          studyEducationLevel, studySubjects, studyTopicsSubtopics, studyExamQuiz,
          interviewJobRole, interviewType, interviewCompany, interviewExperienceLevel, interviewTopics, interviewCompanyIcon
        ) VALUES (
          ${escapeSqlString(deck.deckName)}, ${escapeSqlString(deck.dateAdded)}, ${escapeSqlString(deck.lastModifiedDate)}, ${deck.isFavorited}, ${escapeSqlString(deck.deckType)}, ${escapeSqlString(deck.creationMethod)},
          ${escapeSqlString(deck.lastStudiedDate)}, ${escapeSqlString(deck.lastQuizzedDate)}, ${deck.cardDesignIndex}, ${deck.isAIDeck}, ${escapeSqlString(deck.folderIDs)},
          ${escapeSqlString(deck.studyEducationLevel)}, ${escapeSqlString(deck.studySubjects)}, ${escapeSqlString(deck.studyTopicsSubtopics)}, ${escapeSqlString(deck.studyExamQuiz)},
          ${escapeSqlString(deck.interviewJobRole)}, ${escapeSqlString(deck.interviewType)}, ${escapeSqlString(deck.interviewCompany)}, ${escapeSqlString(deck.interviewExperienceLevel)}, ${escapeSqlString(deck.interviewTopics)}, ${companyIconBlob}
        )
      `);
    }

    console.log('Decks table populated successfully');
    
    // Populate flashcards table
    console.log('Populating flashcards table...');

    // Get deck IDs from the deckData array (assuming they are inserted in order)
    const deckIds = Array.from({ length: deckData.length }, (_, i) => i + 1);

    // Create flashcards for each deck
    for (const deckId of deckIds) {
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
          timeTaken: 45,
          isMcqAnswerRight: null,
          lastStudiedDate: '2025-06-15T10:30:00.000Z',
          lastQuizzedDate: '2025-06-14T14:20:00.000Z'
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
          timeTaken: 30,
          isMcqAnswerRight: null,
          lastStudiedDate: '2025-06-16T11:15:00.000Z',
          lastQuizzedDate: '2025-06-15T16:45:00.000Z'
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
          timeTaken: 60,
          isMcqAnswerRight: null,
          lastStudiedDate: '2025-06-17T09:45:00.000Z',
          lastQuizzedDate: '2025-06-16T13:30:00.000Z'
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
          timeTaken: 25,
          isMcqAnswerRight: 1,
          lastStudiedDate: '2025-06-18T14:20:00.000Z',
          lastQuizzedDate: '2025-06-17T17:10:00.000Z'
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
          timeTaken: 35,
          isMcqAnswerRight: null,
          lastStudiedDate: '2025-06-19T12:30:00.000Z',
          lastQuizzedDate: '2025-06-18T15:45:00.000Z'
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
          timeTaken: 90,
          isMcqAnswerRight: null,
          lastStudiedDate: '2025-06-20T16:15:00.000Z',
          lastQuizzedDate: '2025-06-19T11:20:00.000Z'
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
          timeTaken: 120,
          isMcqAnswerRight: null,
          lastStudiedDate: '2025-06-21T13:40:00.000Z',
          lastQuizzedDate: '2025-06-20T18:55:00.000Z'
        }
      ];

      // Insert flashcards for this deck
      for (const flashcard of flashcardData) {
        const questionBlobHex = flashcard.questionBlob ? `X'${Array.from(flashcard.questionBlob).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        const answerBlobHex = flashcard.answerBlob ? `X'${Array.from(flashcard.answerBlob).map(b => b.toString(16).padStart(2, '0')).join('')}'` : 'NULL';
        
        await db.execAsync(`
          INSERT INTO flashcards (
            deckID, difficultyRating, cognitiveQnType, isFavorited, questionType, questionText, questionBlob,
            answerType, answerText, answerMCQ, answerBlob, timeTaken, isMcqAnswerRight, lastStudiedDate, lastQuizzedDate
          ) VALUES (
            ${flashcard.deckID}, ${escapeSqlString(flashcard.difficultyRating)}, ${escapeSqlString(flashcard.cognitiveQnType)}, ${flashcard.isFavorited}, ${escapeSqlString(flashcard.questionType)}, 
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

    console.log('Flashcards table populated successfully');
    
    // TODO: Continue with other tables (userFormEntries, AIDecks, AIFlashcards, etc.)
    console.log('Dummy data population completed for flashcards table');
    
    // Verify that data was loaded correctly
    console.log('\n=== VERIFYING DATA LOAD ===');
    await verifyDataLoad();
    
  } catch (error) {
    console.error('Error populating dummy data:', error);
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
    
    // Check deck types distribution
    const deckTypes = await db.getAllAsync('SELECT deckType, COUNT(*) as count FROM decks GROUP BY deckType');
    console.log('📊 Deck types distribution:', deckTypes);
    
    // Check flashcard types distribution
    const flashcardTypes = await db.getAllAsync('SELECT questionType, answerType, COUNT(*) as count FROM flashcards GROUP BY questionType, answerType');
    console.log('📊 Flashcard types distribution:', flashcardTypes);
    
    console.log('\n✅ Data verification completed successfully!');
    
    return {
      folders: (foldersResult[0] as any).count,
      decks: (decksResult[0] as any).count,
      flashcards: (flashcardsResult[0] as any).count,
      sampleFolders,
      sampleDecks,
      sampleFlashcards,
      deckTypes,
      flashcardTypes
    };
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
} 