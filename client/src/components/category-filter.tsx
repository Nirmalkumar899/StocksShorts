import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Globe, 
  BarChart3, 
  TrendingUp, 
  Rocket, 
  PiggyBank, 
  Bitcoin,
  FileText,
  Zap,
  Award,
  BookOpen,
  Target,
  Crown,
  Activity,
  Building2,
  ScrollText,
  Briefcase,
  Users,
  DollarSign,
  Star
} from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'Trending', icon: TrendingUp, gradient: 'from-pink-500 to-rose-500', url: '/' },
  { id: 'stocksshorts-special', label: 'Special', icon: Crown, special: true, gradient: 'from-amber-500 to-orange-500', url: '/special' },
  { id: 'ipo', label: 'IPO', icon: Rocket, gradient: 'from-red-500 to-pink-500', url: '/ipo' },
  { id: 'breakout-stocks', label: 'Breakout', icon: Activity, gradient: 'from-green-500 to-emerald-500', url: '/breakout' },
  { id: 'kalkabazaar', label: 'Kalkabazaar', icon: BarChart3, gradient: 'from-blue-500 to-cyan-500', url: '/kalkabazaar' },
  { id: 'warrants', label: 'Warrants', icon: ScrollText, gradient: 'from-purple-500 to-violet-500', url: '/warrants' },

  { id: 'order-win', label: 'Orders', icon: Target, gradient: 'from-orange-500 to-red-500', url: '/orders' },
  { id: 'research-report', label: 'Research', icon: Briefcase, gradient: 'from-slate-500 to-gray-500', url: '/research' },
  { id: 'educational', label: 'Educational', icon: BookOpen, gradient: 'from-indigo-500 to-blue-500', url: '/educational' },
  { id: 'us-market', label: 'US Market', icon: DollarSign, gradient: 'from-green-500 to-emerald-500', url: '/us-market' },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin, gradient: 'from-yellow-500 to-amber-500', url: '/crypto' },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [, setLocation] = useLocation();

  const handleCategoryClick = (category: any) => {
    onCategoryChange(category.id);
    setLocation(category.url);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-6 gap-1.5 px-2 py-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          const isSpecial = category.special;
          
          return (
            <Button
              key={category.id}
              variant="ghost"
              size="sm"
              onClick={() => handleCategoryClick(category)}
              className={`
                group relative flex flex-col items-center justify-start p-1 h-14 text-xs font-semibold transition-all duration-300 overflow-hidden rounded-xl border-0
                ${isSelected
                  ? isSpecial
                    ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-2xl transform scale-110 ring-4 ring-amber-200 dark:ring-amber-800'
                    : `bg-gradient-to-br ${category.gradient} text-white shadow-xl transform scale-105 ring-2 ring-white/30`
                  : isSpecial
                  ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/50 dark:via-orange-950/50 dark:to-red-950/50 text-amber-600 dark:text-amber-300 border-2 border-amber-200 dark:border-amber-700 hover:shadow-lg hover:scale-105 hover:border-amber-300 dark:hover:border-amber-600'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg hover:scale-105 hover:border-gray-300 dark:hover:border-gray-600 backdrop-blur-sm'
                }
              `}
            >
              {/* Icon with enhanced styling */}
              <div className={`
                relative flex items-center justify-center w-5 h-5 mb-0.5 rounded-lg transition-all duration-300
                ${isSelected
                  ? 'bg-white/20 backdrop-blur-sm'
                  : isSpecial
                  ? 'bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40'
                  : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                }
              `}>
                <Icon className={`h-3 w-3 transition-all duration-300 ${
                  isSelected 
                    ? 'text-white drop-shadow-sm' 
                    : isSpecial 
                    ? 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300' 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`} />
              </div>
              
              {/* Label with word wrapping for full visibility */}
              <div className={`text-[7px] leading-tight text-center font-medium tracking-tight w-full px-0.5 ${
                isSelected 
                  ? 'text-white drop-shadow-sm' 
                  : isSpecial 
                  ? 'text-amber-700 dark:text-amber-300' 
                  : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
              }`}>
                <span className="break-words hyphens-auto">
                  {category.label}
                </span>
              </div>
              
              {/* Special indicator dot */}
              {isSpecial && !isSelected && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-ping opacity-75"></div>
                </div>
              )}
              
              {/* Hover gradient overlay */}
              {!isSelected && !isSpecial && (
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
