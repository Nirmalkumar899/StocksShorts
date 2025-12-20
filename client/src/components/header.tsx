import { Download, Languages, Loader2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onTranslate?: () => void;
  isTranslated?: boolean;
  isTranslating?: boolean;
}

export default function Header({ onRefresh, isRefreshing, onTranslate, isTranslated, isTranslating }: HeaderProps) {
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
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <div className="flex flex-col">
              <span className="text-xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent tracking-tight">
                StocksShorts
              </span>
              <span className="text-[10px] text-purple-300/80 font-medium -mt-1">
                📈 Live Market News
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Language Toggle - English/Hindi */}
            {onTranslate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTranslate}
                disabled={isTranslating}
                className={`rounded-full px-3 py-2 text-sm font-bold shadow-lg transition-all ${
                  isTranslated 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-500/30' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/30'
                }`}
                data-testid="button-language-toggle"
              >
                {isTranslating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Languages className="h-4 w-4 mr-1" />
                    {isTranslated ? 'हिंदी' : 'EN'}
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInstallClick}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg shadow-green-500/30"
              data-testid="button-install-app"
            >
              <Download className="h-5 w-5 mr-2" />
              Save App
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
