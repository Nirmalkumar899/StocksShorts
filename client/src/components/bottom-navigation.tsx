import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: null, url: '/' },
  { id: 'special', label: 'Special', icon: null, url: '/special' },
  { id: 'messages', label: 'Messages', icon: null, url: '/conversations' },
  { id: 'sebi-ria', label: 'Connect RIA', icon: null, url: '/sebi-ria' },
  { id: 'profile', label: 'Profile', icon: null, url: '/profile' },
];

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Get unread message count for authenticated users
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/conversations/unread-count'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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
              {/* Show unread count badge for messages tab */}
              {item.id === 'messages' && unreadData && unreadData.unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] p-0 min-w-[20px] rounded-full"
                  data-testid="unread-messages-badge"
                >
                  {unreadData.unreadCount > 99 ? '99+' : unreadData.unreadCount}
                </Badge>
              )}
              <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
