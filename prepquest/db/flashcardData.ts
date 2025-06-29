// Helper functions for flashcard generation
export function getAnswerTypeForIndex(index: number): string {
  const types = ['text', 'mcq', 'voice', 'audio', 'image'];
  return types[(index - 1) % 5];
}

export function getRandomDifficulty(): string {
  const difficulties = ['Easy', 'Good', 'Hard', 'Again', 'None'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

export function getRandomCognitiveType(): string {
  const types = ['Recall', 'Comprehension', 'Application', 'Analysis', 'Synthesis', 'Evaluation', 'Problem-Solving'];
  return types[Math.floor(Math.random() * types.length)];
}

export function generateQuestionText(deckName: string, index: number): string {
  const questions: { [key: string]: string[] } = {
    'AP Biology Exam Prep': [
      'What is the function of mitochondria in a cell?',
      'Explain the process of photosynthesis.',
      'What are the four nitrogenous bases in DNA?',
      'Describe the structure of a cell membrane.',
      'What is the difference between mitosis and meiosis?'
    ],
    'SAT Math Practice': [
      'Solve for x: 2x + 5 = 13',
      'What is the area of a circle with radius 7?',
      'Simplify: (x² + 3x + 2) / (x + 1)',
      'Find the slope of the line passing through (2,3) and (4,7)',
      'What is the probability of rolling a 6 on a fair die?'
    ],
    'JavaScript ES6+ Mastery': [
      'What is the difference between let, const, and var?',
      'Explain how async/await works in JavaScript.',
      'What is a Promise and how do you handle it?',
      'Describe the spread operator and its uses.',
      'What is destructuring assignment?'
    ],
    'Software Engineer - Google': [
      'Explain the time complexity of binary search.',
      'How would you design a URL shortening service?',
      'What is the difference between a stack and a queue?',
      'Explain how hash tables work.',
      'How would you optimize a slow database query?'
    ],
    'Product Manager - Meta': [
      'How would you measure the success of a new feature?',
      'Describe a time you had to make a difficult product decision.',
      'How do you prioritize features in a product roadmap?',
      'What metrics would you track for a social media app?',
      'How would you handle negative user feedback?'
    ]
  };

  const deckQuestions = questions[deckName] || [
    'What is the main concept being tested here?',
    'Explain the key principles involved.',
    'How would you approach this problem?',
    'What are the important factors to consider?',
    'Describe the process step by step.'
  ];

  return deckQuestions[(index - 1) % deckQuestions.length];
}

export function generateAnswerText(answerType: string, deckName: string, index: number): string | null {
  if (answerType === 'voice') {
    return null; // Voice answers are null
  }
  
  if (answerType === 'mcq') {
    const mcqOptions = [
      JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
      JSON.stringify(['Yes', 'No', 'Maybe', 'Not sure']),
      JSON.stringify(['First choice', 'Second choice', 'Third choice', 'Fourth choice']),
      JSON.stringify(['Red', 'Blue', 'Green', 'Yellow']),
      JSON.stringify(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    ];
    return mcqOptions[(index - 1) % mcqOptions.length];
  }

  // Text answers
  const answers: { [key: string]: string[] } = {
    'AP Biology Exam Prep': [
      'Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration.',
      'Photosynthesis converts light energy into chemical energy stored in glucose.',
      'Adenine, Thymine, Guanine, and Cytosine are the four nitrogenous bases.',
      'The cell membrane is a phospholipid bilayer with embedded proteins.',
      'Mitosis produces two identical daughter cells, while meiosis produces four genetically different cells.'
    ],
    'SAT Math Practice': [
      'x = 4',
      'Area = πr² = π(7)² = 49π square units',
      'x + 2',
      'Slope = (7-3)/(4-2) = 4/2 = 2',
      '1/6 or approximately 0.167'
    ],
    'JavaScript ES6+ Mastery': [
      'let and const are block-scoped, var is function-scoped. const cannot be reassigned.',
      'async/await is syntactic sugar for Promises, making asynchronous code look synchronous.',
      'A Promise represents a value that may not be available immediately, handled with .then() and .catch().',
      'The spread operator (...) expands arrays/objects into individual elements.',
      'Destructuring extracts values from arrays/objects into separate variables.'
    ],
    'Software Engineer - Google': [
      'O(log n) - each step reduces the search space by half.',
      'Use a hash function to generate short codes, store mappings in a database.',
      'Stack is LIFO (Last In, First Out), queue is FIFO (First In, First Out).',
      'Hash tables use a hash function to map keys to array indices for O(1) average lookup.',
      'Add indexes, optimize queries, use caching, or restructure the database schema.'
    ],
    'Product Manager - Meta': [
      'Track user engagement, retention, conversion rates, and business metrics like revenue.',
      'I gathered data, consulted stakeholders, and made a decision based on user impact.',
      'Use frameworks like RICE (Reach, Impact, Confidence, Effort) or MoSCoW prioritization.',
      'Daily active users, time spent, engagement rate, and viral coefficient.',
      'Listen to feedback, investigate root causes, and iterate on the solution.'
    ]
  };

  const deckAnswers = answers[deckName] || [
    'This is the correct answer to the question.',
    'The solution involves understanding the key concepts.',
    'Apply the relevant principles and methodologies.',
    'Consider all factors and make an informed decision.',
    'Follow the established process and best practices.'
  ];

  return deckAnswers[(index - 1) % deckAnswers.length];
}

export function generateRandomDate(): string {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const timeDiff = now.getTime() - lastMonth.getTime();
  const randomTime = lastMonth.getTime() + Math.random() * timeDiff;
  return new Date(randomTime).toISOString();
} 