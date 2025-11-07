import { db } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { getCurrentUserID, getDeckGrade, getDeckAverageTime, getAIDeckGrade, getAIDeckAverageTime } from './decks';

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
// For each day, gets all decks that were studied/quizzed that day and calculates the average of their deck grades
// Uses only the most recent attempt date per flashcard (study or quiz, whichever is more recent) to determine which decks were studied/quizzed on each day
export async function getDailyGrades(): Promise<DayGrade[]> {
  try {
    
    const userID = await getCurrentUserID();
    
    // Get all flashcards with study or quiz dates from both regular and AI flashcards tables
    // Include deckID to identify which decks were studied/quizzed
    const result = await db.getAllAsync(`
      SELECT 
        deckID,
        lastStudiedDate, 
        lastQuizzedDate
      FROM (
        SELECT deckID, lastStudiedDate, lastQuizzedDate
        FROM flashcards
        WHERE userID = ? 
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        UNION ALL
        SELECT deckID, lastStudiedDate, lastQuizzedDate
        FROM AIFlashcards
        WHERE userID = ? 
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
      )
    `, [userID, userID]);
    const flashcards = result as Array<{
      deckID: number;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>;

    if (!flashcards || flashcards.length === 0) {
      console.log('❌ No flashcard data found');
      return [];
    }

    // Group flashcards by date using only the most recent attempt date per flashcard
    // Each flashcard's most recent date determines which day its deck was studied/quizzed
    const dateDeckGroups = new Map<string, Set<number>>();

    flashcards.forEach((flashcard) => {
      // Determine the most recent attempt date
      let mostRecentDate: string | null = null;
      
      if (flashcard.lastStudiedDate && flashcard.lastQuizzedDate) {
        // Both dates exist, use the more recent one
        const studyDate = new Date(flashcard.lastStudiedDate);
        const quizDate = new Date(flashcard.lastQuizzedDate);
        mostRecentDate = studyDate > quizDate 
          ? flashcard.lastStudiedDate 
          : flashcard.lastQuizzedDate;
      } else if (flashcard.lastStudiedDate) {
        // Only study date exists
        mostRecentDate = flashcard.lastStudiedDate;
      } else if (flashcard.lastQuizzedDate) {
        // Only quiz date exists
        mostRecentDate = flashcard.lastQuizzedDate;
      }
      
      // Add the deck to the date group for the most recent attempt date
      if (mostRecentDate) {
        const dateString = new Date(mostRecentDate).toISOString().split('T')[0];
        if (!dateDeckGroups.has(dateString)) {
          dateDeckGroups.set(dateString, new Set<number>());
        }
        dateDeckGroups.get(dateString)!.add(flashcard.deckID);
      }
    });

    // For each date, get the deck grades and calculate the average
    const dailyGrades: DayGrade[] = [];
    
    // Determine which decks are AI decks by checking the AIDecks table
    const aiDeckIdsResult = await db.getAllAsync(`
      SELECT DISTINCT deckID
      FROM AIDecks
      WHERE userID = ?
    `, [userID]);
    const aiDeckIds = new Set((aiDeckIdsResult as Array<{ deckID: number }>).map(r => r.deckID));

    // Process each date
    for (const [dateString, deckIds] of dateDeckGroups.entries()) {
      const deckIdArray = Array.from(deckIds);
      const deckGradePromises = deckIdArray.map(async (deckId) => {
        // Determine if this is an AI deck
        if (aiDeckIds.has(deckId)) {
          return await getAIDeckGrade(deckId);
        } else {
          return await getDeckGrade(deckId);
        }
      });

      const deckGrades = await Promise.all(deckGradePromises);
      
      // Filter out null grades (decks with no attempted flashcards) and ensure type safety
      const validGrades = deckGrades.filter((grade): grade is NonNullable<typeof grade> => grade !== null);
      
      if (validGrades.length === 0) {
        // No valid deck grades for this date, skip it
        continue;
      }

      // Calculate average of deck grades
      const totalScore = validGrades.reduce((sum, grade) => sum + grade.score, 0);
      const averageScore = Math.round(totalScore / validGrades.length);

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
        score: averageScore
      });
    }

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
// Always shows data up to the current month (similar to ReviewLineGraph)
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
    const monthlyGradesMap = new Map<string, number>();
    
    monthGroups.forEach((scores, month) => {
      const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      monthlyGradesMap.set(month, averageScore);
    });

    // Find the date range - always extend to current month
    const monthKeys = Array.from(monthlyGradesMap.keys());
    if (monthKeys.length === 0) {
      return [];
    }

    // Parse dates to find start and end months
    const monthDates = monthKeys.map(monthKey => {
      const parts = monthKey.split(' ');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(parts[0]);
      return new Date(parseInt(parts[1]), monthIndex, 1);
    });

    const startMonth = new Date(Math.min(...monthDates.map(d => d.getTime())));
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Generate all months from start to current month
    const allMonthlyGrades: MonthGrade[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentDate = new Date(startMonth);
    while (currentDate <= currentMonth) {
      const monthKey = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      
      if (monthlyGradesMap.has(monthKey)) {
        allMonthlyGrades.push({
          month: monthKey,
          score: monthlyGradesMap.get(monthKey)!
        });
      } else {
        // Fill missing month with zero score
        allMonthlyGrades.push({
          month: monthKey,
          score: 0
        });
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return allMonthlyGrades;
  } catch (error) {
    console.error('Error getting monthly grades:', error);
    return [];
  }
}

// Get complete timeline with zero scores for missing dates
// Always shows data up to the current day (similar to ReviewLineGraph)
export async function getCompleteDailyGrades(): Promise<DayGrade[]> {
  try {
    const dailyGrades = await getDailyGrades();
    
    // Get today's date and set to start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dailyGrades.length === 0) {
      // If no data, return empty array (don't show 30 days of zeros)
      return [];
    }

    // Find the date range - always extend to today
    const dates = dailyGrades.map(grade => {
      const dateParts = grade.date.split(' ');
      return new Date(`${dateParts[2]}-${getMonthNumber(dateParts[1])}-${dateParts[0]}`);
    });
    
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    startDate.setHours(0, 0, 0, 0);
    
    // Always use today as the end date
    const endDate = new Date(today);
    
    // Create a map of existing grades
    const gradeMap = new Map<string, DayGrade>();
    dailyGrades.forEach(grade => {
      const dateParts = grade.date.split(' ');
      const day = dateParts[0].padStart(2, '0'); // Pad single-digit days with leading zero
      const dateKey = `${dateParts[2]}-${getMonthNumber(dateParts[1])}-${day}`;
      gradeMap.set(dateKey, grade);
    });

    // Fill in missing dates with zero scores, always up to today
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
// Gets all decks that have been attempted at least once, calculates the grade for each deck, and returns the average
export async function getAverageGradeAllTime(): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    
    // Get all deck IDs that have at least one attempted flashcard (from regular flashcards table)
    // These are regular decks (deckID references decks table)
    const regularDecksResult = await db.getAllAsync(`
      SELECT DISTINCT deckID
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [userID]);
    const regularDeckIds = (regularDecksResult as Array<{ deckID: number }>).map(d => d.deckID);
    
    // Get all AI deck IDs that have at least one attempted flashcard (from AIFlashcards table)
    // These are AI decks (deckID references AIDecks table)
    const aiDecksResult = await db.getAllAsync(`
      SELECT DISTINCT deckID
      FROM AIFlashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [userID]);
    const aiDeckIds = (aiDecksResult as Array<{ deckID: number }>).map(d => d.deckID);
    
    if (regularDeckIds.length === 0 && aiDeckIds.length === 0) {
      return 0;
    }
    
    // Calculate grade for each deck in parallel for better performance
    const regularDeckGradePromises = regularDeckIds.map(deckId => getDeckGrade(deckId));
    const aiDeckGradePromises = aiDeckIds.map(deckId => getAIDeckGrade(deckId));
    
    const [regularDeckGrades, aiDeckGrades] = await Promise.all([
      Promise.all(regularDeckGradePromises),
      Promise.all(aiDeckGradePromises)
    ]);
    
    // Collect all valid deck grades
    const deckGrades: number[] = [];
    
    // Process regular deck grades
    regularDeckGrades.forEach(deckGrade => {
      if (deckGrade && deckGrade.score !== null && deckGrade.score !== undefined) {
        deckGrades.push(deckGrade.score);
      }
    });
    
    // Process AI deck grades
    aiDeckGrades.forEach(deckGrade => {
      if (deckGrade && deckGrade.score !== null && deckGrade.score !== undefined) {
        deckGrades.push(deckGrade.score);
      }
    });
    
    if (deckGrades.length === 0) {
      return 0;
    }
    
    // Calculate average of all deck grades
    const sum = deckGrades.reduce((acc, score) => acc + score, 0);
    const averageScore = Math.round(sum / deckGrades.length);
    
    return averageScore;
  } catch (error) {
    console.error('❌ Error calculating average grade for all time:', error);
    return 0;
  }
}

// Calculate breakdown of flashcards by difficulty rating
// Always reflects the latest/current difficulty ratings regardless of lastStudiedDate or lastQuizzedDate
export async function getDifficultyBreakdown(): Promise<{
  Again: number;
  Hard: number;
  Good: number;
  Easy: number;
}> {
  try {
    const userID = await getCurrentUserID();
    // Get all flashcards with difficulty ratings from both tables (no date filtering - shows all current difficulties)
    // This always reflects the latest/current difficulty ratings regardless of when flashcards were studied/quizzed
    const result = await db.getAllAsync(`
      SELECT difficultyRating, COUNT(*) as count
      FROM (
        SELECT difficultyRating
        FROM flashcards
        WHERE userID = ? AND difficultyRating != 'None'
        UNION ALL
        SELECT difficultyRating
        FROM AIFlashcards
        WHERE userID = ? AND difficultyRating != 'None'
      )
      GROUP BY difficultyRating
    `, [userID, userID]);
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
// For each day, gets all decks that were studied/quizzed that day and calculates the average of their deck average times
// Uses only the most recent attempt date per flashcard (study or quiz, whichever is more recent) to determine which decks were studied/quizzed on each day
export async function getDailySpeeds(): Promise<DaySpeed[]> {
  try {
    const userID = await getCurrentUserID();
    
    // Get all flashcards with study or quiz dates from both regular and AI flashcards tables
    // Include deckID to identify which decks were studied/quizzed
    const result = await db.getAllAsync(`
      SELECT 
        deckID,
        lastStudiedDate, 
        lastQuizzedDate
      FROM (
        SELECT deckID, lastStudiedDate, lastQuizzedDate
        FROM flashcards
        WHERE userID = ? 
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        UNION ALL
        SELECT deckID, lastStudiedDate, lastQuizzedDate
        FROM AIFlashcards
        WHERE userID = ? 
          AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
      )
    `, [userID, userID]);
    const flashcards = result as Array<{
      deckID: number;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>;

    if (!flashcards || flashcards.length === 0) {
      return [];
    }

    // Group flashcards by date using only the most recent attempt date per flashcard
    // Each flashcard's most recent date determines which day its deck was studied/quizzed
    const dateDeckGroups = new Map<string, Set<number>>();

    flashcards.forEach((flashcard) => {
      // Determine the most recent attempt date
      let mostRecentDate: string | null = null;
      
      if (flashcard.lastStudiedDate && flashcard.lastQuizzedDate) {
        // Both dates exist, use the more recent one
        const studyDate = new Date(flashcard.lastStudiedDate);
        const quizDate = new Date(flashcard.lastQuizzedDate);
        mostRecentDate = studyDate > quizDate 
          ? flashcard.lastStudiedDate 
          : flashcard.lastQuizzedDate;
      } else if (flashcard.lastStudiedDate) {
        // Only study date exists
        mostRecentDate = flashcard.lastStudiedDate;
      } else if (flashcard.lastQuizzedDate) {
        // Only quiz date exists
        mostRecentDate = flashcard.lastQuizzedDate;
      }
      
      // Add the deck to the date group for the most recent attempt date
      if (mostRecentDate) {
        const dateString = new Date(mostRecentDate).toISOString().split('T')[0];
        if (!dateDeckGroups.has(dateString)) {
          dateDeckGroups.set(dateString, new Set<number>());
        }
        dateDeckGroups.get(dateString)!.add(flashcard.deckID);
      }
    });

    // For each date, get the deck average times and calculate the average
    const dailySpeeds: DaySpeed[] = [];
    
    // Determine which decks are AI decks by checking the AIDecks table
    const aiDeckIdsResult = await db.getAllAsync(`
      SELECT DISTINCT deckID
      FROM AIDecks
      WHERE userID = ?
    `, [userID]);
    const aiDeckIds = new Set((aiDeckIdsResult as Array<{ deckID: number }>).map(r => r.deckID));

    // Process each date
    for (const [dateString, deckIds] of dateDeckGroups.entries()) {
      const deckIdArray = Array.from(deckIds);
      const deckAverageTimePromises = deckIdArray.map(async (deckId) => {
        // Determine if this is an AI deck
        if (aiDeckIds.has(deckId)) {
          return await getAIDeckAverageTime(deckId);
        } else {
          return await getDeckAverageTime(deckId);
        }
      });

      const deckAverageTimes = await Promise.all(deckAverageTimePromises);
      
      // Filter out null times (decks with no attempted flashcards or no time data)
      const validTimes = deckAverageTimes.filter((time): time is NonNullable<typeof time> => time !== null);
      
      if (validTimes.length === 0) {
        // No valid deck average times for this date, skip it
        continue;
      }

      // Calculate average of deck average times
      const totalTime = validTimes.reduce((sum, time) => sum + time, 0);
      const averageTime = Math.round(totalTime / validTimes.length);

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
    }

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
// Always shows data up to the current month (similar to ReviewLineGraph)
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
    const monthlySpeedsMap = new Map<string, number>();
    
    monthGroups.forEach((times, month) => {
      const averageTime = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
      monthlySpeedsMap.set(month, averageTime);
    });

    // Find the date range - always extend to current month
    const monthKeys = Array.from(monthlySpeedsMap.keys());
    if (monthKeys.length === 0) {
      return [];
    }

    // Parse dates to find start and end months
    const monthDates = monthKeys.map(monthKey => {
      const parts = monthKey.split(' ');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(parts[0]);
      return new Date(parseInt(parts[1]), monthIndex, 1);
    });

    const startMonth = new Date(Math.min(...monthDates.map(d => d.getTime())));
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Generate all months from start to current month
    const allMonthlySpeeds: MonthSpeed[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentDate = new Date(startMonth);
    while (currentDate <= currentMonth) {
      const monthKey = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      
      if (monthlySpeedsMap.has(monthKey)) {
        allMonthlySpeeds.push({
          month: monthKey,
          time: monthlySpeedsMap.get(monthKey)!
        });
      } else {
        // Fill missing month with zero speed
        allMonthlySpeeds.push({
          month: monthKey,
          time: 0
        });
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return allMonthlySpeeds;
  } catch (error) {
    console.error('Error getting monthly speeds:', error);
    return [];
  }
}

// Get complete timeline with zero speeds for missing dates
// Always shows data up to the current day (similar to ReviewLineGraph)
export async function getCompleteDailySpeeds(): Promise<DaySpeed[]> {
  try {
    const dailySpeeds = await getDailySpeeds();
    
    // Get today's date and set to start of day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dailySpeeds.length === 0) {
      // If no data, return empty array (don't show 30 days of zeros)
      return [];
    }

    // Find the date range - always extend to today
    const dates = dailySpeeds.map(speed => {
      const dateParts = speed.date.split(' ');
      return new Date(`${dateParts[2]}-${getMonthNumber(dateParts[1])}-${dateParts[0]}`);
    });
    
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    startDate.setHours(0, 0, 0, 0);
    
    // Always use today as the end date
    const endDate = new Date(today);
    
    // Create a map of existing speeds
    const speedMap = new Map<string, DaySpeed>();
    dailySpeeds.forEach(speed => {
      const dateParts = speed.date.split(' ');
      const day = dateParts[0].padStart(2, '0'); // Pad single-digit days with leading zero
      const dateKey = `${dateParts[2]}-${getMonthNumber(dateParts[1])}-${day}`;
      speedMap.set(dateKey, speed);
    });

    // Fill in missing dates with zero speeds, always up to today
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
// Gets all decks that have been attempted at least once, calculates the average time per flashcard for each deck, and returns the average
export async function getAverageTimeAllTime(): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    
    // Get all deck IDs that have at least one attempted flashcard (from regular flashcards table)
    // These are regular decks (deckID references decks table)
    const regularDecksResult = await db.getAllAsync(`
      SELECT DISTINCT deckID
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [userID]);
    const regularDeckIds = (regularDecksResult as Array<{ deckID: number }>).map(d => d.deckID);
    
    // Get all AI deck IDs that have at least one attempted flashcard (from AIFlashcards table)
    // These are AI decks (deckID references AIDecks table)
    const aiDecksResult = await db.getAllAsync(`
      SELECT DISTINCT deckID
      FROM AIFlashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
        AND difficultyRating != 'None'
    `, [userID]);
    const aiDeckIds = (aiDecksResult as Array<{ deckID: number }>).map(d => d.deckID);
    
    if (regularDeckIds.length === 0 && aiDeckIds.length === 0) {
      return 0;
    }
    
    // Calculate average time per flashcard for each deck in parallel for better performance
    const regularDeckAverageTimePromises = regularDeckIds.map(deckId => getDeckAverageTime(deckId));
    const aiDeckAverageTimePromises = aiDeckIds.map(deckId => getAIDeckAverageTime(deckId));
    
    const [regularDeckAverageTimes, aiDeckAverageTimes] = await Promise.all([
      Promise.all(regularDeckAverageTimePromises),
      Promise.all(aiDeckAverageTimePromises)
    ]);
    
    // Collect all valid deck average times
    const deckAverageTimes: number[] = [];
    
    // Process regular deck average times
    regularDeckAverageTimes.forEach(deckAverageTime => {
      if (deckAverageTime !== null && deckAverageTime !== undefined) {
        deckAverageTimes.push(deckAverageTime);
      }
    });
    
    // Process AI deck average times
    aiDeckAverageTimes.forEach(deckAverageTime => {
      if (deckAverageTime !== null && deckAverageTime !== undefined) {
        deckAverageTimes.push(deckAverageTime);
      }
    });
    
    if (deckAverageTimes.length === 0) {
      return 0;
    }
    
    // Calculate average of all deck average times
    const sum = deckAverageTimes.reduce((acc, time) => acc + time, 0);
    const averageTime = Math.round(sum / deckAverageTimes.length);
    
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
    // Get all study and quiz dates from both flashcards and AIFlashcards tables
    const result = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
      UNION ALL
      SELECT lastStudiedDate, lastQuizzedDate
      FROM AIFlashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
    `, [userID, userID]);
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

// Calculate current streak (most recent consecutive days)
export async function getCurrentStreak(): Promise<number> {
  try {
    const userID = await getCurrentUserID();
    // Get all study and quiz dates from both flashcards and AIFlashcards tables
    const result = await db.getAllAsync(`
      SELECT lastStudiedDate, lastQuizzedDate
      FROM flashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
      UNION ALL
      SELECT lastStudiedDate, lastQuizzedDate
      FROM AIFlashcards
      WHERE userID = ? 
        AND (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
    `, [userID, userID]);
    const flashcards = result as Array<{
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
    }>;

    if (!flashcards || flashcards.length === 0) {
      return 0;
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

    const sortedDates = Array.from(allDates).sort().reverse(); // Most recent first

    if (sortedDates.length === 0) {
      console.log('🔥 No study dates found, streak = 0');
      return 0;
    }

    console.log(`🔥 Found ${sortedDates.length} unique study dates. Most recent: ${sortedDates[0]}`);

    // Calculate current streak starting from today or most recent date
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`🔥 Today: ${today}, Yesterday: ${yesterdayStr}`);
    
    let currentStreak = 0;
    let expectedDate = today;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      
      // Check if this date matches the expected date (allowing for today or yesterday)
      if (i === 0) {
        // First date - check if it's today or yesterday
        if (date === today || date === yesterdayStr) {
          currentStreak = 1;
          expectedDate = date;
          console.log(`🔥 First date ${date} matches today/yesterday, streak starts at 1`);
        } else {
          // Streak broken - no active streak
          console.log(`🔥 First date ${date} doesn't match today/yesterday, no active streak`);
          break;
        }
      } else {
        // Check if consecutive
        const expectedDateObj = new Date(expectedDate);
        const dayBeforeExpected = new Date(expectedDateObj);
        dayBeforeExpected.setDate(dayBeforeExpected.getDate() - 1);
        const dayBeforeStr = dayBeforeExpected.toISOString().split('T')[0];
        
        if (date === dayBeforeStr) {
          currentStreak++;
          expectedDate = date;
          console.log(`🔥 Date ${date} is consecutive, streak now = ${currentStreak}`);
        } else {
          // Streak broken
          console.log(`🔥 Date ${date} breaks streak (expected ${dayBeforeStr}), stopping at ${currentStreak}`);
          break;
        }
      }
    }

    console.log(`🔥 Final calculated streak: ${currentStreak}`);
    return currentStreak;
  } catch (error) {
    console.error('Error calculating current streak:', error);
    return 0;
  }
}

// Check and award streak badges based on current streak
export interface StreakBadgeAward {
  badgeName: string;
  badgeSubtext: string;
  dayStreakRequirement: number;
  badgeImageName: string;
  isNewAchievement: boolean;
}

// Check and award welcome badges based on first deck studied or quizzed
export interface WelcomeBadgeAward {
  badgeName: string;
  badgeSubtext: string;
  badgeImageName: string;
  isNewAchievement: boolean;
}

export interface LifetimeBadgeAward {
  badgeName: string;
  badgeSubtext: string;
  badgeImageName: string;
  isNewAchievement: boolean;
}

export async function checkAndAwardWelcomeBadges(badgeSubtext: '1st Deck Studied' | '1st Deck Quizzed' | '1st Feedback by AI' | '1st Gen-AI Deck' | '1st File-Upload Deck' | '1st Youtube Deck' | '1st Manual Deck' | '1st Study Deck' | '1st Interview Deck'): Promise<WelcomeBadgeAward | null> {
  try {
    const userID = await getCurrentUserID();
    
    // Add a small delay to ensure database writes are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`🎉 Welcome badge check: ${badgeSubtext}, UserID = ${userID}`);

    // Get welcome badge for this badgeSubtext
    const badges = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, badgeImageName, userIDs
      FROM welcomeBadgesTable
      WHERE badgeSubtext = ?
    `, [badgeSubtext]);

    if (!badges || badges.length === 0) {
      console.log(`🎉 No badge found for ${badgeSubtext}`);
      return null;
    }

    const badge = badges[0] as any;
    console.log(`🎉 Found badge: ${badge.badgeName} (${badge.badgeSubtext})`);
    console.log(`🎉 Current userIDs string: ${badge.userIDs}`);
    
    // Parse userIDs - handle both JSON array and comma-separated string formats
    let userIDs: string[] = [];
    try {
      if (badge.userIDs) {
        if (badge.userIDs.startsWith('[')) {
          // JSON array format
          userIDs = JSON.parse(badge.userIDs);
        } else {
          // Try parsing as JSON anyway
          userIDs = JSON.parse(badge.userIDs);
        }
      }
    } catch (parseError) {
      console.error('Error parsing userIDs:', parseError);
      // If parsing fails, treat as empty array
      userIDs = [];
    }
    
    console.log(`🎉 Parsed userIDs:`, userIDs);
    console.log(`🎉 User already has badge: ${userIDs.includes(userID)}`);
    
    // Check if user already has this badge
    const alreadyAchieved = userIDs.includes(userID);
    
    if (!alreadyAchieved) {
      console.log(`🎉 Awarding badge ${badge.badgeName} to user ${userID}`);
      
      // Award the badge - add userID to the userIDs array
      userIDs.push(userID);
      const updatedUserIDs = JSON.stringify(userIDs);
      
      await db.runAsync(`
        UPDATE welcomeBadgesTable
        SET userIDs = ?
        WHERE badgeSubtext = ?
      `, [updatedUserIDs, badgeSubtext]);
      
      console.log(`🎉 Badge awarded successfully!`);
      
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        badgeImageName: badge.badgeImageName,
        isNewAchievement: true
      };
    } else {
      console.log(`🎉 User already has this badge, skipping`);
    }

    return null;
  } catch (error) {
    console.error('Error checking and awarding welcome badges:', error);
    return null;
  }
}

export async function checkAndAwardStreakBadges(): Promise<StreakBadgeAward | null> {
  try {
    const userID = await getCurrentUserID();
    
    // Add a small delay to ensure database writes are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentStreak = await getCurrentStreak();
    console.log(`🔥 Streak badge check: Current streak = ${currentStreak}, UserID = ${userID}`);
    
    if (currentStreak === 0) {
      console.log('🔥 No active streak, skipping badge check');
      return null;
    }

    // Get streak badge for this streak length
    const badges = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, dayStreakRequirement, badgeImageName, userIDs
      FROM streakBadgesTable
      WHERE dayStreakRequirement = ?
    `, [currentStreak]);

    if (!badges || badges.length === 0) {
      console.log(`🔥 No badge found for ${currentStreak}-day streak`);
      return null;
    }

    const badge = badges[0] as any;
    console.log(`🔥 Found badge: ${badge.badgeName} (${badge.dayStreakRequirement} days)`);
    console.log(`🔥 Current userIDs string: ${badge.userIDs}`);
    
    // Parse userIDs - handle both JSON array and comma-separated string formats
    let userIDs: string[] = [];
    try {
      if (badge.userIDs) {
        if (badge.userIDs.startsWith('[')) {
          // JSON array format
          userIDs = JSON.parse(badge.userIDs);
        } else {
          // Try parsing as JSON anyway
          userIDs = JSON.parse(badge.userIDs);
        }
      }
    } catch (parseError) {
      console.error('Error parsing userIDs:', parseError);
      // If parsing fails, treat as empty array
      userIDs = [];
    }
    
    console.log(`🔥 Parsed userIDs:`, userIDs);
    console.log(`🔥 User already has badge: ${userIDs.includes(userID)}`);
    
    // Check if user already has this badge
    const alreadyAchieved = userIDs.includes(userID);
    
    if (!alreadyAchieved) {
      console.log(`🔥 Awarding badge ${badge.badgeName} to user ${userID}`);
      
      // Award the badge - add userID to the userIDs array
      userIDs.push(userID);
      const updatedUserIDs = JSON.stringify(userIDs);
      
      await db.runAsync(`
        UPDATE streakBadgesTable
        SET userIDs = ?
        WHERE dayStreakRequirement = ?
      `, [updatedUserIDs, currentStreak]);
      
      console.log(`🔥 Badge awarded successfully!`);
      
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        dayStreakRequirement: badge.dayStreakRequirement,
        badgeImageName: badge.badgeImageName,
        isNewAchievement: true
      };
    } else {
      console.log(`🔥 User already has this badge, skipping`);
    }

    return null;
  } catch (error) {
    console.error('Error checking and awarding streak badges:', error);
    return null;
  }
}

// Check and award lifetime badges based on number of decks created
export async function checkAndAwardNumDecksLifetimeBadges(): Promise<LifetimeBadgeAward | null> {
  try {
    const userID = await getCurrentUserID();
    
    // Add a small delay to ensure database writes are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the current number of decks created by the user
    const userResult = await db.getFirstAsync(`
      SELECT accumulatedDecksCreated
      FROM users
      WHERE userID = ?
    `, [userID]);

    if (!userResult) {
      console.log('📊 No user found for number of decks lifetime badge check');
      return null;
    }

    const numDecksCreated = (userResult as any).accumulatedDecksCreated || 0;
    console.log(`📊 Number of decks created lifetime badge check: ${numDecksCreated} decks, UserID = ${userID}`);
    
    // Badge thresholds: 3, 10, 20, 30, 40, 50
    const badgeThresholds = [3, 10, 20, 30, 40, 50];
    
    // Find all thresholds that have been reached but not yet awarded
    const qualifiedThresholds = badgeThresholds.filter(threshold => numDecksCreated >= threshold);
    
    if (qualifiedThresholds.length === 0) {
      console.log('📊 No badge threshold reached yet');
      return null;
    }
    
    // Get all badges that the user qualifies for
    const badgesResult = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, badgeImageName, userIDs
      FROM lifetimeBadgesTable
      WHERE badgeSubtext IN (${qualifiedThresholds.map(t => `'${t} Decks Created'`).join(',')})
    `);

    if (!badgesResult || badgesResult.length === 0) {
      console.log('📊 No badges found for any threshold');
      return null;
    }

    // Find the highest threshold badge that the user hasn't been awarded yet
    let badgeToAward = null;
    for (let i = badgesResult.length - 1; i >= 0; i--) {
      const badge = badgesResult[i] as any;
      console.log(`📊 Checking badge: ${badge.badgeName} (${badge.badgeSubtext})`);
      console.log(`📊 Current userIDs string: ${badge.userIDs}`);
      
      // Parse userIDs - handle both JSON array and comma-separated string formats
      let userIDs: string[] = [];
      try {
        if (badge.userIDs) {
          if (badge.userIDs.startsWith('[')) {
            // JSON array format
            userIDs = JSON.parse(badge.userIDs);
          } else {
            // Try parsing as JSON anyway
            userIDs = JSON.parse(badge.userIDs);
          }
        }
      } catch (parseError) {
        console.error('Error parsing userIDs:', parseError);
        // If parsing fails, treat as empty array
        userIDs = [];
      }
      
      console.log(`📊 Parsed userIDs:`, userIDs);
      console.log(`📊 User already has badge: ${userIDs.includes(userID)}`);
      
      // Check if user already has this badge
      const alreadyAchieved = userIDs.includes(userID);
      
      if (!alreadyAchieved) {
        console.log(`📊 Found badge to award: ${badge.badgeName}`);
        badgeToAward = badge;
        badgeToAward.userIDs = userIDs; // Store parsed userIDs
        break;
      }
    }
    
    if (badgeToAward) {
      console.log(`📊 Awarding badge ${badgeToAward.badgeName} to user ${userID}`);
      
      // Award the badge - add userID to the userIDs array
      const updatedUserIDs = JSON.stringify([...badgeToAward.userIDs, userID]);
      
      await db.runAsync(`
        UPDATE lifetimeBadgesTable
        SET userIDs = ?
        WHERE badgeSubtext = ?
      `, [updatedUserIDs, badgeToAward.badgeSubtext]);
      
      console.log(`📊 Badge awarded successfully!`);
      
      return {
        badgeName: badgeToAward.badgeName,
        badgeSubtext: badgeToAward.badgeSubtext,
        badgeImageName: badgeToAward.badgeImageName,
        isNewAchievement: true
      };
    } else {
      console.log(`📊 User already has all qualified badges, skipping`);
    }

    return null;
  } catch (error) {
    console.error('Error checking and awarding number of decks lifetime badges:', error);
    return null;
  }
}

// Check and award lifetime badges based on quiz score
export async function checkAndAwardQuizScoreLifetimeBadges(deckId: number): Promise<LifetimeBadgeAward | null> {
  try {
    const userID = await getCurrentUserID();
    
    // Add a small delay to ensure database writes are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the deck grade to calculate the quiz score
    const deckGrade = await getDeckGrade(deckId);
    
    if (!deckGrade) {
      console.log('🏆 No deck grade found for quiz score lifetime badge check');
      return null;
    }
    
    const quizScore = deckGrade.score;
    console.log(`🏆 Quiz score lifetime badge check: Score = ${quizScore}%, DeckID = ${deckId}, UserID = ${userID}`);
    
    // Determine which badge range the score falls into
    let badgeSubtext: string | null = null;
    if (quizScore === 100) {
      badgeSubtext = 'Scored 100%';
    } else if (quizScore >= 80 && quizScore <= 99) {
      badgeSubtext = 'Scored 80%-99%';
    } else if (quizScore >= 60 && quizScore <= 79) {
      badgeSubtext = 'Scored 60%-79%';
    } else if (quizScore >= 50 && quizScore <= 59) {
      badgeSubtext = 'Scored 50%-59%';
    }
    
    if (!badgeSubtext) {
      console.log(`🏆 Score ${quizScore}% does not qualify for any quiz score badge`);
      return null;
    }
    
    // Get the badge for this score range
    const badgesResult = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, badgeImageName, userIDs
      FROM lifetimeBadgesTable
      WHERE badgeSubtext = ?
    `, [badgeSubtext]);
    
    if (!badgesResult || badgesResult.length === 0) {
      console.log(`🏆 No badge found for ${badgeSubtext}`);
      return null;
    }
    
    const badge = badgesResult[0] as any;
    console.log(`🏆 Found badge: ${badge.badgeName} (${badge.badgeSubtext})`);
    console.log(`🏆 Current userIDs string: ${badge.userIDs}`);
    
    // Parse userIDs - handle both JSON array and comma-separated string formats
    let userIDs: string[] = [];
    try {
      if (badge.userIDs) {
        if (badge.userIDs.startsWith('[')) {
          // JSON array format
          userIDs = JSON.parse(badge.userIDs);
        } else {
          // Try parsing as JSON anyway
          userIDs = JSON.parse(badge.userIDs);
        }
      }
    } catch (parseError) {
      console.error('Error parsing userIDs:', parseError);
      // If parsing fails, treat as empty array
      userIDs = [];
    }
    
    console.log(`🏆 Parsed userIDs:`, userIDs);
    console.log(`🏆 User already has badge: ${userIDs.includes(userID)}`);
    
    // Check if user already has this badge
    const alreadyAchieved = userIDs.includes(userID);
    
    if (!alreadyAchieved) {
      console.log(`🏆 Awarding badge ${badge.badgeName} to user ${userID}`);
      
      // Award the badge - add userID to the userIDs array
      const updatedUserIDs = JSON.stringify([...userIDs, userID]);
      
      await db.runAsync(`
        UPDATE lifetimeBadgesTable
        SET userIDs = ?
        WHERE badgeSubtext = ?
      `, [updatedUserIDs, badgeSubtext]);
      
      console.log(`🏆 Badge awarded successfully!`);
      
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        badgeImageName: badge.badgeImageName,
        isNewAchievement: true
      };
    } else {
      console.log(`🏆 User already has this badge, skipping`);
    }
    
    return null;
  } catch (error) {
    console.error('Error checking and awarding quiz score lifetime badges:', error);
    return null;
  }
}

// Check and award lifetime badges based on average time per flashcard
export async function checkAndAwardAverageTimeLifetimeBadges(deckId: number): Promise<LifetimeBadgeAward | null> {
  try {
    const userID = await getCurrentUserID();
    
    // Add a small delay to ensure database writes are committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the average time for this deck
    const averageTime = await getDeckAverageTime(deckId);
    
    if (!averageTime) {
      console.log('🏃 No average time found for average time lifetime badge check');
      return null;
    }
    
    console.log(`🏃 Average time lifetime badge check: Average = ${averageTime}s, DeckID = ${deckId}, UserID = ${userID}`);
    
    // Determine which badge range the average time falls into
    let badgeSubtext: string | null = null;
    if (averageTime >= 0 && averageTime <= 15) {
      badgeSubtext = '0s-15s / flashcard';
    } else if (averageTime >= 16 && averageTime <= 30) {
      badgeSubtext = '16s-30s / flashcard';
    } else if (averageTime >= 31 && averageTime <= 45) {
      badgeSubtext = '31s-45s / flashcard';
    } else if (averageTime >= 46 && averageTime <= 60) {
      badgeSubtext = '46s-60s / flashcard';
    }
    
    if (!badgeSubtext) {
      console.log(`🏃 Average time ${averageTime}s does not qualify for any average time badge`);
      return null;
    }
    
    // Get the badge for this time range
    const badgesResult = await db.getAllAsync(`
      SELECT badgeName, badgeSubtext, badgeImageName, userIDs
      FROM lifetimeBadgesTable
      WHERE badgeSubtext = ?
    `, [badgeSubtext]);
    
    if (!badgesResult || badgesResult.length === 0) {
      console.log(`🏃 No badge found for ${badgeSubtext}`);
      return null;
    }
    
    const badge = badgesResult[0] as any;
    console.log(`🏃 Found badge: ${badge.badgeName} (${badge.badgeSubtext})`);
    console.log(`🏃 Current userIDs string: ${badge.userIDs}`);
    
    // Parse userIDs - handle both JSON array and comma-separated string formats
    let userIDs: string[] = [];
    try {
      if (badge.userIDs) {
        if (badge.userIDs.startsWith('[')) {
          // JSON array format
          userIDs = JSON.parse(badge.userIDs);
        } else {
          // Try parsing as JSON anyway
          userIDs = JSON.parse(badge.userIDs);
        }
      }
    } catch (parseError) {
      console.error('Error parsing userIDs:', parseError);
      // If parsing fails, treat as empty array
      userIDs = [];
    }
    
    console.log(`🏃 Parsed userIDs:`, userIDs);
    console.log(`🏃 User already has badge: ${userIDs.includes(userID)}`);
    
    // Check if user already has this badge
    const alreadyAchieved = userIDs.includes(userID);
    
    if (!alreadyAchieved) {
      console.log(`🏃 Awarding badge ${badge.badgeName} to user ${userID}`);
      
      // Award the badge - add userID to the userIDs array
      const updatedUserIDs = JSON.stringify([...userIDs, userID]);
      
      await db.runAsync(`
        UPDATE lifetimeBadgesTable
        SET userIDs = ?
        WHERE badgeSubtext = ?
      `, [updatedUserIDs, badgeSubtext]);
      
      console.log(`🏃 Badge awarded successfully!`);
      
      return {
        badgeName: badge.badgeName,
        badgeSubtext: badge.badgeSubtext,
        badgeImageName: badge.badgeImageName,
        isNewAchievement: true
      };
    } else {
      console.log(`🏃 User already has this badge, skipping`);
    }
    
    return null;
  } catch (error) {
    console.error('Error checking and awarding average time lifetime badges:', error);
    return null;
  }
}
