import { useLanguage } from "@/hooks/useLanguage";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

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
