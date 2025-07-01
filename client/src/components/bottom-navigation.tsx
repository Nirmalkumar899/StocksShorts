import { Button } from "@/components/ui/button";
import { Home, ShieldCheck, MessageCircle, User, FileText } from "lucide-react";
import { useLocation } from "wouter";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home, url: '/' },
  { id: 'sebi-ria', label: 'Connect with SEBI RIA', icon: ShieldCheck, url: '/sebi-ria' },
  { id: 'profile', label: 'Profile', icon: User, url: '/profile' },
  { id: 'contact', label: 'Feed', icon: MessageCircle, url: '/contact' },
  { id: 'disclaimer', label: 'Disclaimer', icon: FileText, url: '/disclaimer' },
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
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleTabClick(item)}
              className={`flex flex-col items-center py-2 px-2 transition-colors min-w-0 flex-1 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
