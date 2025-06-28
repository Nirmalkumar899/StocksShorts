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

  const getDeviceInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);

    if (isIOS && isSafari) {
      return {
        title: "Add to iPhone Home Screen",
        steps: [
          "1. Tap the Share button (square with arrow) at the bottom",
          "2. Scroll down and tap 'Add to Home Screen'",
          "3. Tap 'Add' to confirm",
          "4. The StocksShorts app will appear on your home screen"
        ]
      };
    } else if (isAndroid && isChrome) {
      return {
        title: "Add to Android Home Screen",
        steps: [
          "1. Tap the menu (3 dots) in the top right corner",
          "2. Tap 'Add to Home screen' or 'Install app'",
          "3. Tap 'Add' to confirm",
          "4. The StocksShorts app will appear on your home screen"
        ]
      };
    } else {
      return {
        title: "Add to Home Screen",
        steps: [
          "1. Look for 'Add to Home Screen' in your browser menu",
          "2. Or bookmark this page for quick access",
          "3. Visit this page directly for the best experience",
          "4. For mobile browsers, check the share or menu options"
        ]
      };
    }
  };

  const handleInstallClick = () => {
    const instructions = getDeviceInstructions();
    
    const instructionText = `${instructions.title}\n\n${instructions.steps.join('\n')}\n\nThis will create a native app experience with faster loading and offline access.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'StocksShorts - Add to Home Screen',
        text: instructionText,
        url: window.location.href,
      }).catch(() => {
        // If sharing fails, show alert with instructions
        alert(instructionText);
      });
    } else {
      // Show instructions in alert
      alert(instructionText);
      // Also copy URL to clipboard for convenience
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
