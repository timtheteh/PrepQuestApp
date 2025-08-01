export const Fonts = {
  // Semantic font names
  title: 'Neuton-Regular',
  bodyMedium: 'Satoshi-Medium',
  bodyItalic: 'Satoshi-MediumItalic',
  bodyItalicLight: 'Satoshi-Italic',
  bodyBold: 'Satoshi-Variable',
  cursive: 'CedarvilleCursive-Regular',
} as const;

// Helper function to get font based on language (for future use)
export function getFontByLanguage(language: string, defaultFont: string, chineseFont?: string) {
  return language === 'Chinese' ? (chineseFont || defaultFont) : defaultFont;
} 