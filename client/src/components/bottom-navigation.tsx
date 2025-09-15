import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: null, url: '/' },
  { id: 'special', label: 'Special', icon: null, url: '/special' },
  { id: 'sebi-ria', label: 'Connect RIA', icon: null, url: '/sebi-ria' },
  { id: 'profile', label: 'Profile', icon: null, url: '/profile' },
];

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
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleTabClick(item)}
              className={`relative flex flex-col items-center py-2 px-2 transition-colors min-w-0 flex-1 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary'
              }`}
              data-testid={`nav-tab-${item.id}`}
            >
              <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
