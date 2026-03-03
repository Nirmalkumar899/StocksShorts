import { Loader2 } from "@/lib/icons";

interface HeaderProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onTranslate?: () => void;
  isTranslated?: boolean;
  isTranslating?: boolean;
}

export default function Header({ activeSection, onSectionChange, onTranslate, isTranslated, isTranslating }: HeaderProps) {
  const tabs = [
    { id: 'home', label: 'My Feed' },
    { id: 'special', label: '⭐ Specials' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-100 dark:border-neutral-900">
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          {/* Tab Row */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onSectionChange(tab.id)}
                className={`whitespace-nowrap pb-2 text-sm font-semibold border-b-2 transition-all ${
                  activeSection === tab.id
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-gray-400 dark:text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* EN / हिं toggle — only when translate is available */}
          {onTranslate && (
            <div className="flex items-center gap-2 flex-shrink-0 pb-2">
              <button
                onClick={() => isTranslated && onTranslate()}
                disabled={isTranslating || !isTranslated}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                  !isTranslated
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-600'
                }`}
                data-testid="button-language-english"
              >
                EN
              </button>
              <button
                onClick={() => !isTranslated && onTranslate()}
                disabled={isTranslating || isTranslated}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                  isTranslated
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                    : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-600'
                }`}
                data-testid="button-language-hindi"
              >
                हिं
              </button>
            </div>
          )}
        </div>

        {isTranslating && (
          <div className="bg-yellow-400 text-black text-center py-1.5 text-xs font-medium flex items-center justify-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Translating articles...
          </div>
        )}
      </header>

      {/* Disclaimer strip */}
      <div className="bg-gray-50 dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-900 px-3 py-1">
        <p className="text-[9px] text-gray-400 dark:text-neutral-600 text-center leading-tight">
          Not investment advice. Consult your financial advisor before investing.
        </p>
      </div>
    </>
  );
}
