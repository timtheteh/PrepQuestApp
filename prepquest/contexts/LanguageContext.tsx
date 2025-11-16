import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';

export type Language = 
  | 'English' 
  | 'Chinese' 
  | 'Spanish' 
  | 'French' 
  | 'German' 
  | 'Portuguese' 
  | 'Japanese' 
  | 'Korean' 
  | 'Italian' 
  | 'Russian' 
  | 'Arabic' 
  | 'Hindi' 
  | 'Indonesian' 
  | 'Malay' 
  | 'Thai' 
  | 'Vietnamese' 
  | 'Turkish' 
  | 'Dutch' 
  | 'Polish' 
  | 'Swedish' 
  | 'Tagalog' 
  | 'Bengali' 
  | 'Ukrainian' 
  | 'Hungarian' 
  | 'Farsi' 
  | 'Swahili' 
  | 'Greek' 
  | 'Hebrew' 
  | 'Czech' 
  | 'Finnish' 
  | 'Norwegian' 
  | 'Afrikaans' 
  | 'Romanian' 
  | 'Tamil';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  reloadLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  reloadLanguage: async () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('English');

  // Load language from DB on mount
  const reloadLanguage = async () => {
    try {
      // Try to get user ID from AsyncStorage as fallback
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        const result = await db.getFirstAsync(`SELECT language FROM users WHERE userID = ?`, [userID]) as any;
        if (result && result.language && typeof result.language === 'string') {
          // Only allow English or Chinese; default to English otherwise
          const loadedLanguage = result.language as Language;
          const supportedLanguage = (loadedLanguage === 'English' || loadedLanguage === 'Chinese') ? loadedLanguage : 'English';
          setLanguageState(supportedLanguage);
        }
      }
    } catch (e) {
      setLanguageState('English');
    }
  };

  useEffect(() => {
    reloadLanguage();
  }, []);

  // When setLanguage is called, update both state and DB
  const setLanguage = async (lang: Language) => {
    const finalLang: Language = (lang === 'English' || lang === 'Chinese') ? lang : 'English';
    setLanguageState(finalLang);
    try {
      // Try to get user ID from AsyncStorage as fallback
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        await db.runAsync(`UPDATE users SET language = ? WHERE userID = ?`, [finalLang, userID]);
      }
    } catch (e) {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, reloadLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 