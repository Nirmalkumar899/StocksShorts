import { RefreshCw, Moon, Sun, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Show install button if app is not installed (not in standalone mode)
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleInstallClick = () => {
    // For iOS Safari or when PWA prompt is not available
    if (navigator.share) {
      navigator.share({
        title: 'StocksShorts',
        text: 'Install StocksShorts app for quick market updates',
        url: window.location.href,
      }).catch(() => {
        // User cancelled sharing
      });
    } else {
      // Show instructions or copy URL
      navigator.clipboard?.writeText(window.location.href);
    }
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
            {showInstallButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInstallClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Install StocksShorts app"
              >
                <Download className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
              </Button>
            )}
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
