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
  { id: 'Nifty', label: 'Nifty', icon: BarChart3 },
  { id: 'Sensex', label: 'Sensex', icon: TrendingUp },
  { id: 'IPO', label: 'IPOs', icon: Rocket },
  { id: 'Research Report', label: 'Research', icon: FileText },
  { id: 'Mutual Funds', label: 'MF', icon: PiggyBank },
  { id: 'Crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'Global', label: 'Global', icon: Globe },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
      <div className="grid grid-cols-4 gap-2 min-w-max">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center space-y-1 h-16 w-20 p-2 ${
                isSelected 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium text-center leading-tight">{category.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
