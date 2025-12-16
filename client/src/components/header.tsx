import { Moon, Sun, Download } from "@/lib/icons";
import logoImage from "@assets/stocksshorts-logo-new.jpeg";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Link } from "wouter";

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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img 
                src={logoImage} 
                alt="StocksShorts" 
                className="h-10 w-10 object-contain rounded-lg shadow-lg ring-2 ring-yellow-400/50 group-hover:ring-yellow-400 transition-all duration-300"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent tracking-tight animate-pulse">
                StocksShorts
              </span>
              <span className="text-[10px] text-purple-300/80 font-medium -mt-1">
                📈 Live Market News
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
