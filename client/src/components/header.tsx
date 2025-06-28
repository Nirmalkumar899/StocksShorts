import { RefreshCw, Moon, Sun, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    // Always show install button unless already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check iOS standalone mode safely
    let isPWAInstalled = false;
    try {
      isPWAInstalled = 'standalone' in window.navigator && (window.navigator as any).standalone === true;
    } catch (e) {
      // Fallback for browsers that don't support this property
    }
    
    if (!isStandalone && !isPWAInstalled) {
      setShowInstallButton(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const getMobileInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      return {
        title: "Add to iPhone Home Screen",
        steps: [
          "📱 Tap the Share button (square with arrow) at the bottom of Safari",
          "📲 Scroll down and tap 'Add to Home Screen'",
          "✅ Tap 'Add' to confirm",
          "🚀 StocksShorts app will appear on your home screen!"
        ]
      };
    } else if (isAndroid) {
      return {
        title: "Add to Android Home Screen", 
        steps: [
          "📲 Look for 'Add to Home screen' or 'Install app' option",
          "✅ Tap 'Add' to confirm",
          "🚀 StocksShorts app will appear on your home screen!"
        ]
      };
    } else {
      return {
        title: "Add to Home Screen",
        steps: [
          "📲 Look for 'Add to Home Screen' option in your browser",
          "✅ Follow the prompts to install",
          "🚀 Enjoy the native app experience!"
        ]
      };
    }
  };

  const handleInstallClick = () => {
    const instructions = getMobileInstructions();
    const instructionText = `${instructions.title}\n\n${instructions.steps.join('\n')}\n\nGet instant access to stock market news with faster loading and offline reading!`;
    
    // Always show the notification immediately
    alert(instructionText);
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleInstallClick}
                      className="relative p-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl animate-pulse hover:scale-105"
                    >
                      <Download className="h-4 w-4 text-white" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Add to Home Screen</p>
                    <p className="text-xs opacity-80">Install StocksShorts app for quick access</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
