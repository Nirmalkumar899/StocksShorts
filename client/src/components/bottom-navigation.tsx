import { Button } from "@/components/ui/button";
import { Home, Bookmark, Search, User } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-30">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
