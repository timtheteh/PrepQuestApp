import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';

export type Language = 'English' | 'Chinese';

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
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        const result = await db.getFirstAsync(`SELECT language FROM users WHERE userID = ?`, [userID]);
        if (result && result.language) setLanguageState(result.language);
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
    setLanguageState(lang);
    try {
      const userID = await AsyncStorage.getItem('userID');
      if (userID) {
        await db.runAsync(`UPDATE users SET language = ? WHERE userID = ?`, [lang, userID]);
      }
    } catch (e) {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, reloadLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 