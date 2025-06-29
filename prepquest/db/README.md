# SQLite Database Setup for PrepQuest

This directory contains all the SQLite database operations for the PrepQuest app.

## Database Structure

The database includes the following tables:

### 1. `users`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT NOT NULL)
- `email` (TEXT UNIQUE)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 2. `questions`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `question` (TEXT NOT NULL)
- `answer` (TEXT)
- `category` (TEXT)
- `difficulty` (INTEGER DEFAULT 1)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 3. `study_sessions`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER, FOREIGN KEY)
- `start_time` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `end_time` (DATETIME)
- `questions_answered` (INTEGER DEFAULT 0)
- `correct_answers` (INTEGER DEFAULT 0)

### 4. `user_progress`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER, FOREIGN KEY)
- `question_id` (INTEGER, FOREIGN KEY)
- `is_correct` (BOOLEAN)
- `answered_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 5. `categories`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `name` (TEXT UNIQUE NOT NULL)
- `description` (TEXT)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## File Structure

```
db/
├── index.ts              # Main database entry point
├── schema.ts             # Table creation and initialization
├── users.ts              # User CRUD operations
├── questions.ts          # Question CRUD operations
├── study-sessions.ts     # Study session operations
├── user-progress.ts      # User progress tracking
├── categories.ts         # Category management
├── example-usage.ts      # Usage examples
└── README.md            # This file
```

## Setup Instructions

### 1. Initialize Database in Your App

In your main App component or entry point:

```typescript
import { useEffect } from 'react';
import { setupDatabase } from './db';

export default function App() {
  useEffect(() => {
    setupDatabase();
  }, []);

  // ... rest of your app
}
```

### 2. Using Database Functions

Import the functions you need:

```typescript
import { createUser, getUserById } from './db/users';
import { createQuestion, getRandomQuestions } from './db/questions';
import { createStudySession, getUserStats } from './db/study-sessions';
```

### 3. Example Usage

```typescript
// Create a user
const userId = await createUser({
  name: 'John Doe',
  email: 'john@example.com'
});

// Create a question
const questionId = await createQuestion({
  question: 'What is the capital of France?',
  answer: 'Paris',
  category: 'Geography',
  difficulty: 1
});

// Start a study session
const sessionId = await createStudySession({ user_id: userId });

// Record user progress
await createUserProgress({
  user_id: userId,
  question_id: questionId,
  is_correct: true
});

// Get user statistics
const stats = await getUserStats(userId);
```

## Key Features

### Promise-based API
All database operations return Promises for easy async/await usage.

### TypeScript Support
Full TypeScript interfaces for all data structures.

### Error Handling
Comprehensive error handling with try/catch blocks.

### Foreign Key Relationships
Proper relationships between tables for data integrity.

### Statistics and Analytics
Built-in functions for calculating user progress and statistics.

## Default Categories

The database automatically creates these default categories:
- General Knowledge
- Mathematics
- Science
- History
- Geography
- Literature
- Sports
- Entertainment

## Best Practices

1. **Always use try/catch** when calling database functions
2. **Initialize the database** once when the app starts
3. **Use the provided interfaces** for type safety
4. **Handle errors gracefully** in your UI
5. **Use transactions** for complex operations (already handled in the functions)

## Testing

You can test the database setup by running the example functions in `example-usage.ts`:

```typescript
import { completeAppFlow } from './db/example-usage';

// Run the complete example
completeAppFlow();
```

## Troubleshooting

### Common Issues

1. **Database not initialized**: Make sure to call `setupDatabase()` in your app
2. **Foreign key errors**: Ensure referenced records exist before creating relationships
3. **Unique constraint violations**: Check for duplicate emails or category names

### Debugging

Enable console logging to see database operations:

```typescript
// The schema.ts file includes console.log statements for debugging
setupDatabase(); // Check console for initialization messages
```

## Migration

If you need to add new tables or modify existing ones:

1. Update the `initializeDatabase` function in `schema.ts`
2. Add new CRUD functions in the appropriate file
3. Update TypeScript interfaces as needed
4. Test thoroughly before deploying

## Performance Tips

1. **Use indexes** for frequently queried columns (already included in primary keys)
2. **Limit result sets** when querying large datasets
3. **Use transactions** for multiple related operations
4. **Close database connections** when the app is terminated (handled automatically by expo-sqlite) 