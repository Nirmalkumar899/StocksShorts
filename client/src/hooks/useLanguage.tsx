import { useState, useEffect, createContext, useContext } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isFirstVisit: boolean;
  setFirstVisitComplete: () => void;
  translationCache: Map<number, { title: string; content: string }>;
  addToCache: (id: number, translation: { title: string; content: string }) => void;
  getFromCache: (id: number) => { title: string; content: string } | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'stocksshorts_language';
const FIRST_VISIT_KEY = 'stocksshorts_first_visit';
const TRANSLATION_CACHE_KEY = 'stocksshorts_translations';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [translationCache, setTranslationCache] = useState<Map<number, { title: string; content: string }>>(new Map());

  useEffect(() => {
    const savedLang = localStorage.getItem(LANGUAGE_KEY) as Language;
    const visited = localStorage.getItem(FIRST_VISIT_KEY);
    
    if (savedLang) {
      setLanguageState(savedLang);
    }
    
    if (visited === 'true') {
      setIsFirstVisit(false);
    }

    const savedCache = localStorage.getItem(TRANSLATION_CACHE_KEY);
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        setTranslationCache(new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v as { title: string; content: string }])));
      } catch (e) {
        console.error('Failed to parse translation cache');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  };

  const setFirstVisitComplete = () => {
    setIsFirstVisit(false);
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
  };

  const addToCache = (id: number, translation: { title: string; content: string }) => {
    setTranslationCache(prev => {
      const newCache = new Map(prev);
      newCache.set(id, translation);
      const cacheObj = Object.fromEntries(newCache);
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cacheObj));
      return newCache;
    });
  };

  const getFromCache = (id: number) => {
    return translationCache.get(id);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      isFirstVisit,
      setFirstVisitComplete,
      translationCache,
      addToCache,
      getFromCache
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
