/**
 * Utility functions for formatting dates with internationalization support
 */

/**
 * Formats a date string based on the current language
 * @param dateString - The date string to format
 * @param language - The current language ('Chinese', 'English', 'Afrikaans', 'Indonesian', 'Malay', 'Czech', 'Dutch', 'German', 'Spanish', 'French', 'Italian', 'Swahili', or 'Hungarian')
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, language: string): string => {
  try {
    const date = new Date(dateString);
    if (language === 'Chinese') {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    } else if (language === 'Afrikaans') {
      const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Indonesian') {
      const months = ['Jan', 'Peb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Malay') {
      const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogs', 'Sep', 'Okt', 'Nov', 'Dis'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Czech') {
      const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Dutch') {
      const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'German') {
      const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Spanish') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'French') {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Italian') {
      const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Swahili') {
      const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else if (language === 'Hungarian') {
      const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sze', 'Okt', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
};

/**
 * Formats a date string without including the year component.
 * @param dateString - The date string to format
 * @param language - The current language ('Chinese', 'English', 'Afrikaans', 'Indonesian', 'Malay', 'Czech', 'Dutch', 'German', 'Spanish', 'French', 'Italian', 'Swahili', or 'Hungarian')
 * @returns Formatted date string without year
 */
export const formatDateWithoutYear = (dateString: string, language: string): string => {
  try {
    const date = new Date(dateString);
    if (language === 'Chinese') {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}月${day}日`;
    } else if (language === 'Afrikaans') {
      const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Indonesian') {
      const months = ['Jan', 'Peb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Malay') {
      const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogs', 'Sep', 'Okt', 'Nov', 'Dis'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Czech') {
      const months = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Dutch') {
      const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'German') {
      const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Spanish') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'French') {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Italian') {
      const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Swahili') {
      const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else if (language === 'Hungarian') {
      const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sze', 'Okt', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${day} ${month}`;
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day}`;
    }
  } catch (error) {
    console.error('Error formatting date without year:', error);
    return dateString;
  }
};

export type CalendarFilter =
  | 'all'
  | 'today'
  | 'week'
  | 'month'
  | 'custom'
  | null
  | undefined;

const isSameCalendarDay = (date: Date, year: number, month: number, day: number) =>
  date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

/**
 * Checks whether a UTC ISO timestamp belongs to the selected calendar filter
 * when interpreted in the user's current timezone.
 */
export const matchesCalendarFilter = (
  isoString: string,
  filter: CalendarFilter,
  customDate?: string | null
): boolean => {
  if (!filter || filter === 'all') {
    return true;
  }

  const targetDate = new Date(isoString);
  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  const now = new Date();

  switch (filter) {
    case 'today': {
      return (
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getDate() === now.getDate()
      );
    }
    case 'week': {
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return targetDate >= startOfWeek && targetDate <= endOfWeek;
    }
    case 'month': {
      return (
        targetDate.getFullYear() === now.getFullYear() &&
        targetDate.getMonth() === now.getMonth()
      );
    }
    case 'custom': {
      if (!customDate) {
        return true;
      }
      const [yearStr, monthStr, dayStr] = customDate.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      if (!year || !month || !day) {
        return false;
      }
      return isSameCalendarDay(targetDate, year, month, day);
    }
    default:
      return true;
  }
};

/**
 * Returns the YYYY-MM-DD key for a given ISO timestamp or Date object in the user's local timezone.
 */
export const getLocalDateKey = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : new Date(value.getTime());
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

