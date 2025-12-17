import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";

export function LanguageSelector() {
  const { language, setLanguage, isFirstVisit, setFirstVisitComplete } = useLanguage();
  const [showPopup, setShowPopup] = useState(false);

  const handleLanguageSelect = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    setFirstVisitComplete();
    setShowPopup(false);
  };

  if (isFirstVisit) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Select Language / भाषा चुनें
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            Choose your preferred language for reading news
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => handleLanguageSelect('en')}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
              data-testid="btn-select-english"
            >
              English
            </button>
            <button
              onClick={() => handleLanguageSelect('hi')}
              className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-lg transition-colors"
              data-testid="btn-select-hindi"
            >
              हिंदी (Hindi)
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
            You can change this later from the top of the app
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center gap-2 py-1.5 px-4">
        <span className="text-xs text-gray-600 dark:text-gray-400">Language:</span>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            language === 'en' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          data-testid="btn-lang-english"
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            language === 'hi' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          data-testid="btn-lang-hindi"
        >
          हिंदी
        </button>
      </div>
    </div>
  );
}
