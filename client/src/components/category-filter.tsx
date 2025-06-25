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
  { id: 'stocksshorts-special', label: 'Special', icon: Award },
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
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
      <div className="grid grid-cols-6 gap-2 p-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={`
                flex flex-col items-center justify-center p-2 h-16 text-xs font-medium transition-all duration-300 relative overflow-hidden
                ${isSelected
                  ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white shadow-xl border-0 transform scale-105 ring-2 ring-blue-300 dark:ring-blue-700'
                  : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:from-blue-50 hover:via-purple-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:via-purple-900/30 dark:hover:to-indigo-900/30 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-lg hover:scale-102 hover:ring-1 hover:ring-blue-200 dark:hover:ring-blue-600'
                }
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
              `}
            >
              <Icon className={`h-4 w-4 mb-1 ${isSelected ? 'drop-shadow-sm' : ''}`} />
              <span className={`leading-tight text-center ${isSelected ? 'font-semibold drop-shadow-sm' : ''}`}>
                {category.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
