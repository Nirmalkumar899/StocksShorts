import { Button } from "@/components/ui/button";
import { Home, ShieldCheck, MessageCircle, User, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { id: '/', label: 'Home', icon: Home },
  { id: '/sebi-ria', label: 'Connect', icon: ShieldCheck },
  { id: '/contact', label: 'Feed', icon: MessageCircle },
  { id: '/profile', label: 'Profile', icon: User },
  { id: '/disclaimer', label: 'Disclaimer', icon: FileText },
];

export default function BottomNavigation() {
  const [location] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 z-30">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.id;
          
          return (
            <Link key={item.id} href={item.id}>
              <Button
                variant="ghost"
                className={`flex flex-col items-center py-2 px-2 transition-colors min-w-0 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
