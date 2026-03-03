import { Search, Home, User } from "@/lib/icons";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearchClick?: () => void;
}

export default function BottomNavigation({ activeTab, onTabChange, onSearchClick }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const handleHome = () => {
    onTabChange('home');
    setLocation('/');
  };

  const handleProfile = () => {
    onTabChange('profile');
    setLocation('/profile');
  };

  const handleSearch = () => {
    if (onSearchClick) onSearchClick();
    else onTabChange('search');
  };

  const isActive = (tab: string) => activeTab === tab;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-neutral-800 z-[9999]">
      <div className="flex items-center justify-around py-3 px-6">
        <button
          onClick={handleSearch}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('search') ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
          }`}
          data-testid="nav-search"
        >
          <Search className="h-6 w-6" />
        </button>

        <button
          onClick={handleHome}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('home') ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
          }`}
          data-testid="nav-home"
        >
          <Home className="h-6 w-6" />
        </button>

        <button
          onClick={handleProfile}
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive('profile') ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'
          }`}
          data-testid="nav-profile"
        >
          <User className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}
