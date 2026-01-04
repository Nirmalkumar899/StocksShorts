import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'All News', icon: null, url: '/all-news', highlight: false },
  { id: 'special', label: 'Special', icon: null, url: '/', highlight: true },
  { id: 'profile', label: 'Profile', icon: null, url: '/profile', highlight: false },
  { id: 'disclaimer', label: 'Disclaimer', icon: null, url: '/disclaimer', highlight: false },
];
// v7.3 - 4 tabs with highlighted Special section

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const handleTabClick = (item: any) => {
    onTabChange(item.id);
    setLocation(item.url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-[9999]">
      <div className="flex items-center py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          const isSpecial = item.highlight;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleTabClick(item)}
              data-testid={`nav-${item.id}`}
              className={`flex flex-col items-center py-2 px-2 transition-colors min-w-0 flex-1 ${
                isSpecial && !isActive
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg mx-1 animate-pulse shadow-lg'
                  : isActive 
                    ? 'text-primary' 
                    : 'text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary'
              } ${isSpecial && isActive ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg mx-1 shadow-lg' : ''}`}
            >
              <span className={`text-[10px] font-medium text-center leading-tight ${isSpecial ? 'font-bold' : ''}`}>
                {isSpecial ? '⭐ ' + item.label : item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
