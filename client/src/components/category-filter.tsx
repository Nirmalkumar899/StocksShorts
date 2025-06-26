import { Button } from "@/components/ui/button";
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
  Target
} from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', label: 'Trending', icon: TrendingUp },
  { id: 'stocksshorts-special', label: 'Special', icon: Award, special: true },
  { id: 'breakout-stocks', label: 'Breakout', icon: TrendingUp },
  { id: 'index', label: 'Index', icon: BarChart3 },
  { id: 'warrants', label: 'Warrants', icon: FileText },
  { id: 'educational', label: 'Educational', icon: BookOpen },
  { id: 'ipo', label: 'IPO', icon: Rocket },
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'most-active', label: 'Active', icon: Zap },
  { id: 'order-win', label: 'Orders', icon: Target },
  { id: 'research-report', label: 'Research', icon: FileText },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
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
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={`
                relative flex flex-col items-center justify-center p-1.5 h-12 text-xs font-medium transition-all duration-200 overflow-hidden
                ${isSelected
                  ? isSpecial
                    ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white shadow-xl border-0 transform scale-105 ring-2 ring-amber-300 animate-pulse'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-0 transform scale-105'
                  : isSpecial
                  ? 'bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-red-900/30 text-amber-700 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-600 hover:shadow-lg hover:scale-105 special-shimmer'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-200 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-md hover:scale-102'
                }
              `}
            >
              <Icon className={`h-3 w-3 mb-0.5 ${isSpecial && !isSelected ? 'text-amber-600 dark:text-amber-300' : ''}`} />
              <span className="text-[9px] leading-tight text-center break-words">
                {category.label}
              </span>
              {isSpecial && !isSelected && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
