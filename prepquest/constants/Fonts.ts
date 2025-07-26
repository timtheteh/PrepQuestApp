export const Fonts = {
  // Semantic font names
  title: 'Neuton-Regular',
  body: 'Satoshi-Variable',
  bodyMedium: 'Satoshi-Medium',
  cursive: 'CedarvilleCursive-Regular',
} as const;

// Helper function to get font based on language (for future use)
export function getFontByLanguage(language: string, defaultFont: string, chineseFont?: string) {
  return language === 'Chinese' ? (chineseFont || defaultFont) : defaultFont;
} 