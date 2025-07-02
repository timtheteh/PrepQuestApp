import { db } from './index';

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
    console.log('🔍 Fetching daily grades from database...');
    
    // Get all flashcards with study or quiz dates from both tables
    const result = await db.getAllAsync(`
      SELECT 
        difficultyRating,
        lastStudiedDate,
        lastQuizzedDate,
        answerType,
        isMcqAnswerRight
      FROM (
        SELECT difficultyRating, lastStudiedDate, lastQuizzedDate, answerType, isMcqAnswerRight
        FROM flashcards
        WHERE (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND difficultyRating != 'None'
        UNION ALL
        SELECT difficultyRating, lastStudiedDate, lastQuizzedDate, answerType, isMcqAnswerRight
        FROM AIFlashcards
        WHERE (lastStudiedDate IS NOT NULL OR lastQuizzedDate IS NOT NULL)
          AND difficultyRating != 'None'
      )
    `);

    console.log('📊 Raw flashcard data:', result?.length || 0, 'flashcards found');

    if (!result || result.length === 0) {
      console.log('❌ No flashcard data found');
      return [];
    }

    const flashcards = result as Array<{
      difficultyRating: string;
      lastStudiedDate: string | null;
      lastQuizzedDate: string | null;
      answerType: string;
      isMcqAnswerRight: number | null;
    }>;

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
        console.log(`📅 Study date: ${flashcard.lastStudiedDate} -> ${studyDate}`);
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
        console.log(`📅 Quiz date: ${flashcard.lastQuizzedDate} -> ${quizDate}`);
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

    console.log('📅 Date groups:', dateGroups.size, 'unique dates');
    dateGroups.forEach((flashcards, dateKey) => {
      console.log(`  - ${dateKey}: ${flashcards.length} flashcards`);
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
      
      console.log(`📊 ${dateFormatted} (${day}): ${score}% (${flashcardsForDate.length} flashcards) - from dateString: ${dateString}`);
      
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

    console.log('✅ Daily grades calculated:', dailyGrades.length, 'days');
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
    console.log('🔍 Getting complete daily grades...');
    
    // Log current date for debugging
    const now = new Date();
    console.log('🕐 Current date/time:', now.toISOString());
    console.log('🕐 Current date (local):', now.toLocaleDateString());
    
    const dailyGrades = await getDailyGrades();
    
    console.log('📊 Daily grades from getDailyGrades():', dailyGrades.length, 'entries');
    dailyGrades.forEach(grade => {
      console.log(`  - ${grade.date} (${grade.day}): ${grade.score}%`);
    });
    
    if (dailyGrades.length === 0) {
      console.log('❌ No daily grades found, returning empty array');
      return [];
    }

    // Find the date range
    const dates = dailyGrades.map(grade => {
      const dateParts = grade.date.split(' ');
      return new Date(`${dateParts[2]}-${getMonthNumber(dateParts[1])}-${dateParts[0]}`);
    });
    
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    console.log('📅 Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    
    // Create a map of existing grades
    const gradeMap = new Map<string, DayGrade>();
    dailyGrades.forEach(grade => {
      const dateParts = grade.date.split(' ');
      const day = dateParts[0].padStart(2, '0'); // Pad single-digit days with leading zero
      const dateKey = `${dateParts[2]}-${getMonthNumber(dateParts[1])}-${day}`;
      gradeMap.set(dateKey, grade);
      console.log(`🗺️ Mapping ${grade.date} to key: ${dateKey}`);
    });

    console.log('🗺️ All keys in gradeMap:', Array.from(gradeMap.keys()));

    // Fill in missing dates with zero scores
    const completeGrades: DayGrade[] = [];
    const currentDate = new Date(startDate);
    
    console.log('🔄 Filling in complete timeline...');
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      console.log(`🔍 Looking for dateKey: ${dateKey} in gradeMap...`);
      console.log(`🔍 gradeMap has keys:`, Array.from(gradeMap.keys()));
      
      if (gradeMap.has(dateKey)) {
        const grade = gradeMap.get(dateKey)!;
        completeGrades.push(grade);
        console.log(`✅ ${dateKey}: Found grade ${grade.score}%`);
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
        console.log(`❌ ${dateKey}: Added zero grade for ${dateFormatted}`);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('✅ Complete daily grades:', completeGrades.length, 'entries');
    completeGrades.forEach(grade => {
      console.log(`  - ${grade.date} (${grade.day}): ${grade.score}%`);
    });

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