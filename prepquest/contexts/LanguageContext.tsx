import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/db/index';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  // Load language from DB on mount
  const reloadLanguage = async () => {
    try {
      if (user?.id) {
        const result = await db.getFirstAsync(`SELECT language FROM users WHERE userID = ?`, [user.id]) as any;
        if (result && result.language && typeof result.language === 'string') {
          setLanguageState(result.language as Language);
        }
      }
    } catch (e) {
      setLanguageState('English');
    }
  };

  useEffect(() => {
    reloadLanguage();
  }, [user?.id]);

  // When setLanguage is called, update both state and DB
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      if (user?.id) {
        await db.runAsync(`UPDATE users SET language = ? WHERE userID = ?`, [lang, user.id]);
      }
    } catch (e) {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, reloadLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 