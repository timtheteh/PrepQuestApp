import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { getCurrentUserID } from './decks';

export interface DayGrade {
  day: string;
  date: string;
  score: number;
}

export interface MonthGrade {
  month: string;
  score: number;
}

// Calculate weighted score using the same formula as in decks.ts
const calculateWeightedScoreWithMCQ = (flashcards: Array<{
  difficultyRating: string;
  answerType: string;
  isMcqAnswerRight: number | null;
}>): number => {
  const weights = {
    'Again': 0,     // 0% - needs to learn
    'Hard': 0.4,    // 40% - partially learned
    'Good': 0.8,    // 80% - well learned
    'Easy': 1.0     // 100% - mastered
  };

  let totalWeight = 0;

  flashcards.forEach((flashcard) => {
    const difficulty = flashcard.difficultyRating;
    const answerType = flashcard.answerType;
    const isMcqAnswerRight = flashcard.isMcqAnswerRight;

    let weight = 0;

    if (answerType === 'mcq') {
      // For MCQ flashcards, use isMcqAnswerRight: 0 if wrong, 1 if correct
      weight = isMcqAnswerRight === 1 ? 1.0 : 0.0;
    } else {
      // For non-MCQ flashcards, use difficulty-based weights
      weight = weights[difficulty as keyof typeof weights] || 0;
    }

    totalWeight += weight;
  });

  return Math.round((totalWeight / flashcards.length) * 100);
};

// Get all study/quiz dates and calculate grades for each day
export async function getDailyGrades(): Promise<DayGrade[]> {
  try {
    
    const userID = await getCurrentUserID();
    
    // Get all flashcards with study or quiz dates from both tables
    const result = await db.getAllAsync(`
      SELECT difficultyRating, lastStudiedDate, lastQuizzedDate, answerType, isMcqAnswerRight
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [userID]);
    const flashcards = result as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      answerType: string;
      isMcqAnswerRight: number | null;
    }>;


    if (!flashcards || flashcards.length === 0) {
      console.log('❌ No flashcard data found');
      return [];
    }

    // Group flashcards by date (both study and quiz dates)
    const dateGroups = new Map<string, Array<{
      difficultyRating: string;
      answerType: string;
      isMcqAnswerRight: number | null;
    }>>();

    flashcards.forEach((flashcard) => {
      // Add to study date group
      if (flashcard.lastStudiedDate) {
        const studyDate = new Date(flashcard.lastStudiedDate).toISOString().split('T')[0];
        if (!dateGroups.has(studyDate)) {
          dateGroups.set(studyDate, []);
        }
        dateGroups.get(studyDate)!.push({
          difficultyRating: flashcard.difficultyRating,
          answerType: flashcard.answerType,
          isMcqAnswerRight: flashcard.isMcqAnswerRight
        });
      }

      // Add to quiz date group
      if (flashcard.lastQuizzedDate) {
        const quizDate = new Date(flashcard.lastQuizzedDate).toISOString().split('T')[0];

        if (!dateGroups.has(quizDate)) {
          dateGroups.set(quizDate, []);
        }
        dateGroups.get(quizDate)!.push({
          difficultyRating: flashcard.difficultyRating,
          answerType: flashcard.answerType,
          isMcqAnswerRight: flashcard.isMcqAnswerRight
        });
      }
    });

    // Calculate grade for each date
    const dailyGrades: DayGrade[] = [];
    
    dateGroups.forEach((flashcardsForDate, dateString) => {
      const score = calculateWeightedScoreWithMCQ(flashcardsForDate);
      const date = new Date(dateString);
      
      // Format day (Mon, Tue, etc.)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = dayNames[date.getDay()];
      
      // Format date (MM DD, YYYY)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const dayOfMonth = date.getDate();
      const year = date.getFullYear();
      const dateFormatted = `${dayOfMonth} ${month} ${year}`;
      
      
      dailyGrades.push({
        day,
        date: dateFormatted,
        score
      });
    });

    // Sort by date (oldest first)
    dailyGrades.sort((a, b) => {
      const dateA = new Date(a.date.split(' ').reverse().join('-'));
      const dateB = new Date(b.date.split(' ').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    return dailyGrades;
  } catch (error) {
    console.error('❌ Error getting daily grades:', error);
    return [];
  }
}

// Get monthly grades by consolidating daily grades
export async function getMonthlyGrades(): Promise<MonthGrade[]> {
  try {
    const dailyGrades = await getDailyGrades();
    
    if (dailyGrades.length === 0) {
      return [];
    }

    // Group daily grades by month
    const monthGroups = new Map<string, number[]>();
    
    dailyGrades.forEach((dayGrade) => {
      // Extract month and year from date string (e.g., "15 Mar 2024" -> "Mar 2024")
      const dateParts = dayGrade.date.split(' ');
      const month = dateParts[1];
      const year = dateParts[2];
      const monthKey = `${month} ${year}`;
      
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      monthGroups.get(monthKey)!.push(dayGrade.score);
    });

    // Calculate average score for each month
    const monthlyGrades: MonthGrade[] = [];
    
    monthGroups.forEach((scores, month) => {
      const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      monthlyGrades.push({
        month,
        score: averageScore
      });
    });

    // Sort by date (oldest first)
    monthlyGrades.sort((a, b) => {
      const dateA = new Date(a.month.split(' ').reverse().join('-'));
      const dateB = new Date(b.month.split(' ').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    return monthlyGrades;
  } catch (error) {
    console.error('Error getting monthly grades:', error);
    return [];
  }
}

// Get complete timeline with zero scores for missing dates
export async function getCompleteDailyGrades(): Promise<DayGrade[]> {
  try {
    
    // Log current date for debugging
    const now = new Date();
    
    const dailyGrades = await getDailyGrades();
    
    dailyGrades.forEach(grade => {
      console.log(`  - ${grade.date} (${grade.day}): ${grade.score}%`);
    });
    
    if (dailyGrades.length === 0) {
      return [];
    }

    // Find the date range
    const dates = dailyGrades.map(grade => {
      const dateParts = grade.date.split(' ');
      return new Date(`${dateParts[2]}-${getMonthNumber(dateParts[1])}-${dateParts[0]}`);
    });
    
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    
    // Create a map of existing grades
    const gradeMap = new Map<string, DayGrade>();
    dailyGrades.forEach(grade => {
      const dateParts = grade.date.split(' ');
      const day = dateParts[0].padStart(2, '0'); // Pad single-digit days with leading zero
      const dateKey = `${dateParts[2]}-${getMonthNumber(dateParts[1])}-${day}`;
      gradeMap.set(dateKey, grade);
    });


    // Fill in missing dates with zero scores
    const completeGrades: DayGrade[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      
      if (gradeMap.has(dateKey)) {
        const grade = gradeMap.get(dateKey)!;
        completeGrades.push(grade);
      } else {
        // Create zero score entry for missing date
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = dayNames[currentDate.getDay()];
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[currentDate.getMonth()];
        const dayOfMonth = currentDate.getDate();
        const year = currentDate.getFullYear();
        const dateFormatted = `${dayOfMonth} ${month} ${year}`;
        
        const zeroGrade = {
          day,
          date: dateFormatted,
          score: 0
        };
        completeGrades.push(zeroGrade);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return completeGrades;
  } catch (error) {
    console.error('❌ Error getting complete daily grades:', error);
    return [];
  }
}

// Helper function to convert month name to number
function getMonthNumber(monthName: string): string {
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  return monthMap[monthName] || '01';
}

// Calculate average grade for all time
export async function getAverageGradeAllTime(): Promise<number> {
  try {
    
    const userID = await getCurrentUserID();
    
    // Get all flashcards with study or quiz dates from both tables
    const result = await db.getAllAsync(`
      SELECT difficultyRating, lastStudiedDate, lastQuizzedDate, answerType, isMcqAnswerRight
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [userID]);
    const flashcards = result as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      answerType: string;
      isMcqAnswerRight: number | null;
    }>;


    if (!flashcards || flashcards.length === 0) {
      return 0;
    }

    // Calculate weighted score using the same formula as daily grades
    const weights = {
      'Again': 0,     // 0% - needs to learn
      'Hard': 0.4,    // 40% - partially learned
      'Good': 0.8,    // 80% - well learned
      'Easy': 1.0     // 100% - mastered
    };

    let totalWeight = 0;

    flashcards.forEach((flashcard) => {
      const difficulty = flashcard.difficultyRating;
      const answerType = flashcard.answerType;
      const isMcqAnswerRight = flashcard.isMcqAnswerRight;

      let weight = 0;

      if (answerType === 'mcq') {
        // For MCQ flashcards, use isMcqAnswerRight: 0 if wrong, 1 if correct
        weight = isMcqAnswerRight === 1 ? 1.0 : 0.0;
      } else {
        // For non-MCQ flashcards, use difficulty-based weights
        weight = weights[difficulty as keyof typeof weights] || 0;
      }

      totalWeight += weight;
    });

    const averageScore = Math.round((totalWeight / flashcards.length) * 100);
    
    
    return averageScore;
  } catch (error) {
    console.error('❌ Error calculating average grade for all time:', error);
    return 0;
  }
}

// Calculate breakdown of flashcards by difficulty rating
export async function getDifficultyBreakdown(): Promise<{
  Again: number;
  Hard: number;
  Good: number;
  Easy: number;
}> {
  try {
    const userID = await getCurrentUserID();
    // Get all flashcards with difficulty ratings from both tables
    const result = await db.getAllAsync(`
      SELECT difficultyRating, COUNT(*) as count
      FROM flashcards
      WHERE userID = ? AND difficultyRating != 'None'
      GROUP BY difficultyRating
    `, [userID]);
    const breakdown = result as Array<{ difficultyRating: string; count: number }>;


    // Initialize breakdown with zeros
    const finalBreakdown = {
      Again: 0,
      Hard: 0,
      Good: 0,
      Easy: 0
    };

    // Fill in the counts from the database
    breakdown.forEach((row: any) => {
      const difficulty = row.difficultyRating;
      const count = row.count;
      
      if (difficulty in finalBreakdown) {
        finalBreakdown[difficulty as keyof typeof finalBreakdown] = count;
      }
    });

    const total = finalBreakdown.Again + finalBreakdown.Hard + finalBreakdown.Good + finalBreakdown.Easy;
    
    
    return finalBreakdown;
  } catch (error) {
    console.error('❌ Error calculating difficulty breakdown:', error);
    return {
      Again: 0,
      Hard: 0,
      Good: 0,
      Easy: 0
    };
  }
}

// Speed-related interfaces
export interface DaySpeed {
  day: string;
  date: string;
  time: number;
}

export interface MonthSpeed {
  month: string;
  time: number;
}

// Get all study/quiz dates and calculate average speed for each day
export async function getDailySpeeds(): Promise<DaySpeed[]> {
  try {
    const userID = await getCurrentUserID();
    // Get all flashcards with study or quiz dates and timeTaken from both tables
    const result = await db.getAllAsync(`
      SELECT timeTaken, lastStudiedDate, lastQuizzedDate
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND timeTaken IS NOT NULL
    `, [userID]);
    const flashcards = result as Array<{
      timeTaken: number;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>;


    if (!flashcards || flashcards.length === 0) {
      return [];
    }

    // Group flashcards by date (both study and quiz dates)
    const dateGroups = new Map<string, number[]>();

    flashcards.forEach((flashcard) => {
      // Add to study date group
      if (flashcard.lastStudiedDate) {
        const studyDate = new Date(flashcard.lastStudiedDate).toISOString().split('T')[0];
        if (!dateGroups.has(studyDate)) {
          dateGroups.set(studyDate, []);
        }
        dateGroups.get(studyDate)!.push(flashcard.timeTaken);
      }

      // Add to quiz date group
      if (flashcard.lastQuizzedDate) {
        const quizDate = new Date(flashcard.lastQuizzedDate).toISOString().split('T')[0];
        if (!dateGroups.has(quizDate)) {
          dateGroups.set(quizDate, []);
        }
        dateGroups.get(quizDate)!.push(flashcard.timeTaken);
      }
    });

    // Calculate average speed for each date
    const dailySpeeds: DaySpeed[] = [];
    
    dateGroups.forEach((timesForDate, dateString) => {
      const averageTime = Math.round(timesForDate.reduce((sum, time) => sum + time, 0) / timesForDate.length);
      const date = new Date(dateString);
      
      // Format day (Mon, Tue, etc.)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = dayNames[date.getDay()];
      
      // Format date (DD MMM YYYY)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const dayOfMonth = date.getDate();
      const year = date.getFullYear();
      const dateFormatted = `${dayOfMonth} ${month} ${year}`;
      
      
      dailySpeeds.push({
        day,
        date: dateFormatted,
        time: averageTime
      });
    });

    // Sort by date (oldest first)
    dailySpeeds.sort((a, b) => {
      const dateA = new Date(a.date.split(' ').reverse().join('-'));
      const dateB = new Date(b.date.split(' ').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    return dailySpeeds;
  } catch (error) {
    console.error('❌ Error getting daily speeds:', error);
    return [];
  }
}

// Get monthly speeds by consolidating daily speeds
export async function getMonthlySpeeds(): Promise<MonthSpeed[]> {
  try {
    const dailySpeeds = await getDailySpeeds();
    
    if (dailySpeeds.length === 0) {
      return [];
    }

    // Group daily speeds by month
    const monthGroups = new Map<string, number[]>();
    
    dailySpeeds.forEach((daySpeed) => {
      // Extract month and year from date string (e.g., "15 Mar 2024" -> "Mar 2024")
      const dateParts = daySpeed.date.split(' ');
      const month = dateParts[1];
      const year = dateParts[2];
      const monthKey = `${month} ${year}`;
      
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      monthGroups.get(monthKey)!.push(daySpeed.time);
    });

    // Calculate average speed for each month
    const monthlySpeeds: MonthSpeed[] = [];
    
    monthGroups.forEach((times, month) => {
      const averageTime = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
      monthlySpeeds.push({
        month,
        time: averageTime
      });
    });

    // Sort by date (oldest first)
    monthlySpeeds.sort((a, b) => {
      const dateA = new Date(a.month.split(' ').reverse().join('-'));
      const dateB = new Date(b.month.split(' ').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

    return monthlySpeeds;
  } catch (error) {
    console.error('Error getting monthly speeds:', error);
    return [];
  }
}

// Get complete timeline with zero speeds for missing dates
export async function getCompleteDailySpeeds(): Promise<DaySpeed[]> {
  try {
    const dailySpeeds = await getDailySpeeds();
    
    if (dailySpeeds.length === 0) {
      return [];
    }

    // Find the date range
    const dates = dailySpeeds.map(speed => {
      const dateParts = speed.date.split(' ');
      return new Date(`${dateParts[2]}-${getMonthNumber(dateParts[1])}-${dateParts[0]}`);
    });
    
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    
    // Create a map of existing speeds
    const speedMap = new Map<string, DaySpeed>();
    dailySpeeds.forEach(speed => {
      const dateParts = speed.date.split(' ');
      const day = dateParts[0].padStart(2, '0'); // Pad single-digit days with leading zero
      const dateKey = `${dateParts[2]}-${getMonthNumber(dateParts[1])}-${day}`;
      speedMap.set(dateKey, speed);
    });


    // Fill in missing dates with zero speeds
    const completeSpeeds: DaySpeed[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      
      if (speedMap.has(dateKey)) {
        const speed = speedMap.get(dateKey)!;
        completeSpeeds.push(speed);
      } else {
        // Create zero speed entry for missing date
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = dayNames[currentDate.getDay()];
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[currentDate.getMonth()];
        const dayOfMonth = currentDate.getDate();
        const year = currentDate.getFullYear();
        const dateFormatted = `${dayOfMonth} ${month} ${year}`;
        
        const zeroSpeed = {
          day,
          date: dateFormatted,
          time: 0
        };
        completeSpeeds.push(zeroSpeed);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return completeSpeeds;
  } catch (error) {
    console.error('❌ Error getting complete daily speeds:', error);
    return [];
  }
}

// Calculate average time taken for all time
export async function getAverageTimeAllTime(): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    // Get all flashcards with study or quiz dates and timeTaken from both tables
    const result = await db.getFirstAsync(`
      SELECT AVG(timeTaken) as averageTime, COUNT(*) as attemptedCount
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND timeTaken IS NOT NULL
    `, [userID]);
    const data = result as { averageTime: number | null; attemptedCount: number };
    

    if (!data || data.attemptedCount === 0 || data.averageTime === null) {
      return 0;
    }

    const averageTime = Math.round(data.averageTime);
    
    
    return averageTime;
  } catch (error) {
    console.error('❌ Error calculating average time for all time:', error);
    return 0;
  }
}

// Streak-related interfaces
export interface LongestStreakData {
  streakLength: number;
  uniqueFlashcards: number;
  uniqueDecks: number;
  streakStartDate: string | null;
  streakEndDate: string | null;
}

// Calculate longest streak and related data
export async function getLongestStreakData(): Promise<LongestStreakData> {
  try {
    const userID = await getCurrentUserID();
    // Get all study and quiz dates from both tables
    const result = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate, flashcardID, deckID
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
    `, [userID]);
    const flashcards = result as Array<{
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      flashcardID: number;
      deckID: number;
    }>;


    if (!flashcards || flashcards.length === 0) {
      return {
        streakLength: 0,
        uniqueFlashcards: 0,
        uniqueDecks: 0,
        streakStartDate: null,
        streakEndDate: null
      };
    }

    // Collect all unique dates
    const allDates = new Set<string>();
    flashcards.forEach((flashcard) => {
      if (flashcard.lastStudiedDate) {
        const studyDate = new Date(flashcard.lastStudiedDate).toISOString().split('T')[0];
        allDates.add(studyDate);
      }
      if (flashcard.lastQuizzedDate) {
        const quizDate = new Date(flashcard.lastQuizzedDate).toISOString().split('T')[0];
        allDates.add(quizDate);
      }
    });

    const sortedDates = Array.from(allDates).sort();

    // Find the longest consecutive streak
    let longestStreak = 0;
    let currentStreak = 0;
    let streakStartDate: string | null = null;
    let streakEndDate: string | null = null;
    let tempStreakStart: string | null = null;

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      
      if (i === 0) {
        // First date starts a streak
        currentStreak = 1;
        tempStreakStart = sortedDates[i];
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          // Consecutive day
          currentStreak++;
        } else {
          // Streak broken
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            streakStartDate = tempStreakStart;
            streakEndDate = sortedDates[i - 1];
          }
          currentStreak = 1;
          tempStreakStart = sortedDates[i];
        }
      }
    }

    // Check if the last streak is the longest
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
      streakStartDate = tempStreakStart;
      streakEndDate = sortedDates[sortedDates.length - 1];
    }


    // Calculate unique flashcards and decks during the longest streak
    let uniqueFlashcards = 0;
    let uniqueDecks = 0;
    
    if (longestStreak > 0 && streakStartDate && streakEndDate) {
      const streakStart = new Date(streakStartDate);
      const streakEnd = new Date(streakEndDate);
      
      // Get all flashcards studied/quizzed during the streak period
      const streakFlashcards = flashcards.filter((flashcard) => {
        const studyDate = flashcard.lastStudiedDate ? new Date(flashcard.lastStudiedDate).toISOString().split('T')[0] : null;
        const quizDate = flashcard.lastQuizzedDate ? new Date(flashcard.lastQuizzedDate).toISOString().split('T')[0] : null;
        
        if (studyDate) {
          const studyDateObj = new Date(studyDate);
          if (studyDateObj >= streakStart && studyDateObj <= streakEnd) return true;
        }
        
        if (quizDate) {
          const quizDateObj = new Date(quizDate);
          if (quizDateObj >= streakStart && quizDateObj <= streakEnd) return true;
        }
        
        return false;
      });

      // Count unique flashcards and decks
      const uniqueFlashcardIds = new Set(streakFlashcards.map(f => f.flashcardID));
      const uniqueDeckIds = new Set(streakFlashcards.map(f => f.deckID));
      
      uniqueFlashcards = uniqueFlashcardIds.size;
      uniqueDecks = uniqueDeckIds.size;
      
    }

    const streakData = {
      streakLength: longestStreak,
      uniqueFlashcards,
      uniqueDecks,
      streakStartDate,
      streakEndDate
    };

    
    return streakData;
  } catch (error) {
    console.error('❌ Error calculating longest streak data:', error);
    return {
      streakLength: 0,
      uniqueFlashcards: 0,
      uniqueDecks: 0,
      streakStartDate: null,
      streakEndDate: null
    };
  }
}

// Get all studied dates for calendar visualization
export async function getAllStudiedDates(): Promise<string[]> {
  try {
    const userID = await getCurrentUserID();
    // Get all study and quiz dates from both tables
    const result = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
    `, [userID]);
    const flashcards = result as Array<{
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>;

    if (!flashcards || flashcards.length === 0) {
      return [];
    }

    // Collect all unique dates
    const allDates = new Set<string>();
    flashcards.forEach((flashcard) => {
      if (flashcard.lastStudiedDate) {
        const studyDate = new Date(flashcard.lastStudiedDate).toISOString().split('T')[0];
        allDates.add(studyDate);
      }
      if (flashcard.lastQuizzedDate) {
        const quizDate = new Date(flashcard.lastQuizzedDate).toISOString().split('T')[0];
        allDates.add(quizDate);
      }
    });

    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates;
  } catch (error) {
    return [];
  }
} 
