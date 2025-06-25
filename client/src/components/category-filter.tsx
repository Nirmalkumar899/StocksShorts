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
    <div className="bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-1 py-2">
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-0.5">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "secondary"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center py-1 px-0.5 rounded text-xs font-medium transition-all h-10 ${
                isSelected
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Icon className="h-2.5 w-2.5 mb-0.5" />
              <span className="text-[8px] leading-tight text-center">{category.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
