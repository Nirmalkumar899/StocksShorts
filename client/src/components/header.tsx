import { RefreshCw, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 shadow-sm border-b border-gray-100 dark:border-neutral-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-neutral-800 dark:text-white">StocksShorts</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-neutral-600 dark:text-neutral-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <Moon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
