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
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-6 gap-2 p-3">
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
                flex flex-col items-center justify-center p-2 h-14 text-xs font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg border-0 transform scale-105'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:border-blue-200 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-md hover:scale-102'
                }
              `}
            >
              <Icon className="h-3.5 w-3.5 mb-1" />
              <span className="text-[10px] leading-tight text-center break-words">
                {category.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
