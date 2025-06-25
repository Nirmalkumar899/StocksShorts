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
  { id: 'all', label: 'All', icon: Globe },
  { id: 'index', label: 'Index', icon: BarChart3 },
  { id: 'warrants', label: 'Warrants', icon: FileText },
  { id: 'stocksshorts-special', label: 'StocksShorts Special', icon: Award },
  { id: 'breakout-stocks', label: 'Breakout Stocks', icon: TrendingUp },
  { id: 'educational', label: 'Educational', icon: BookOpen },
  { id: 'ipo', label: 'IPO', icon: Rocket },
  { id: 'global', label: 'Global', icon: Globe },
  { id: 'most-active', label: 'Most Active', icon: Zap },
  { id: 'order-win', label: 'Order Win', icon: Target },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-4 py-3">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "secondary"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
