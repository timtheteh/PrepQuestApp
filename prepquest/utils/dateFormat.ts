/**
 * Utility functions for formatting dates with internationalization support
 */

/**
 * Formats a date string based on the current language
 * @param dateString - The date string to format
 * @param language - The current language ('Chinese' or 'English')
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

