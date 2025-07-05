import { RefreshCw, Moon, Sun, Download, Languages } from "lucide-react";
import logoImage from "@assets/stocksshorts-logo.jpeg";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onTranslate?: () => void;
  isTranslated?: boolean;
  isTranslating?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Header({ onRefresh, isRefreshing, onTranslate, isTranslated, isTranslating }: HeaderProps) {
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
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isSamsung = /samsungbrowser/.test(userAgent);

    if (isIOS) {
      return {
        title: "📱 Add to iPhone Home Screen",
        steps: [
          "1. Tap the Share button (⬆️) at the bottom of Safari",
          "2. Scroll down in the share menu", 
          "3. Tap 'Add to Home Screen' 📲",
          "4. Tap 'Add' to confirm ✅",
          "5. Find StocksShorts app on your home screen! 🚀"
        ]
      };
    } else if (isAndroid) {
      if (isChrome) {
        return {
          title: "📱 Add to Android Home Screen (Chrome)",
          steps: [
            "1. Tap the menu (⋮) at the top right",
            "2. Tap 'Add to Home screen' 📲", 
            "3. Tap 'Add' to confirm ✅",
            "4. Find StocksShorts app on your home screen! 🚀"
          ]
        };
      } else if (isFirefox) {
        return {
          title: "📱 Add to Android Home Screen (Firefox)",
          steps: [
            "1. Tap the menu (⋮) at the top right",
            "2. Tap 'Install' or 'Add to Home screen' 📲",
            "3. Tap 'Add' to confirm ✅", 
            "4. Find StocksShorts app on your home screen! 🚀"
          ]
        };
      } else if (isSamsung) {
        return {
          title: "📱 Add to Android Home Screen (Samsung Browser)",
          steps: [
            "1. Tap the menu (☰) at the bottom",
            "2. Tap 'Add page to' → 'Home screen' 📲",
            "3. Tap 'Add' to confirm ✅",
            "4. Find StocksShorts app on your home screen! 🚀"
          ]
        };
      } else {
        return {
          title: "📱 Add to Android Home Screen",
          steps: [
            "1. Look for menu (⋮) in your browser",
            "2. Find 'Add to Home screen' or 'Install' option 📲",
            "3. Tap 'Add' to confirm ✅",
            "4. Find StocksShorts app on your home screen! 🚀"
          ]
        };
      }
    } else {
      return {
        title: "💻 Add to Home Screen",
        steps: [
          "1. Open this page on your mobile device 📱",
          "2. Follow the mobile browser instructions",
          "3. Install for the best app experience! 🚀"
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
            <img 
              src={logoImage} 
              alt="StocksShorts" 
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              StocksShorts
            </span>
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
            {onTranslate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTranslate}
                disabled={isTranslating}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors ${isTranslated ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              >
                <Languages className={`h-4 w-4 ${isTranslated ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-600 dark:text-neutral-400'} ${isTranslating ? 'animate-pulse' : ''}`} />
              </Button>
            )}
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
