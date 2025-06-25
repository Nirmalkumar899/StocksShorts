import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Star, 
  ArrowUpRight, 
  BarChart3, 
  Shield, 
  GraduationCap,
  Building2, 
  Globe, 
  Activity, 
  Target, 
  FileText,
  Flame,
  Sparkles,
  Zap
} from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  // Row 1 (6 columns)
  { name: 'Trending', type: 'trending', icon: Flame, gradient: 'from-red-500 via-orange-500 to-red-600', shadow: 'shadow-red-500/30' },
  { name: 'StocksShorts Special', type: 'special', icon: Sparkles, gradient: 'from-purple-500 via-pink-500 to-purple-600', shadow: 'shadow-purple-500/30' },
  { name: 'Breakout Stocks', type: 'breakout', icon: ArrowUpRight, gradient: 'from-green-400 via-emerald-500 to-green-600', shadow: 'shadow-green-500/30' },
  { name: 'Index', type: 'index', icon: BarChart3, gradient: 'from-blue-500 via-sky-500 to-blue-600', shadow: 'shadow-blue-500/30' },
  { name: 'Warrants', type: 'warrants', icon: Shield, gradient: 'from-amber-500 via-orange-500 to-amber-600', shadow: 'shadow-amber-500/30' },
  { name: 'Educational', type: 'educational', icon: GraduationCap, gradient: 'from-indigo-500 via-blue-500 to-indigo-600', shadow: 'shadow-indigo-500/30' },
  
  // Row 2 (5 columns)
  { name: 'IPO', type: 'ipo', icon: Building2, gradient: 'from-rose-500 via-pink-500 to-rose-600', shadow: 'shadow-rose-500/30' },
  { name: 'Global', type: 'global', icon: Globe, gradient: 'from-teal-500 via-cyan-500 to-teal-600', shadow: 'shadow-teal-500/30' },
  { name: 'Most Active', type: 'active', icon: Zap, gradient: 'from-yellow-400 via-yellow-500 to-orange-500', shadow: 'shadow-yellow-500/30' },
  { name: 'Order Win', type: 'orders', icon: Target, gradient: 'from-cyan-500 via-blue-500 to-cyan-600', shadow: 'shadow-cyan-500/30' },
  { name: 'Research Report', type: 'research', icon: FileText, gradient: 'from-slate-500 via-gray-500 to-slate-600', shadow: 'shadow-slate-500/30' },
];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
      <div className="grid grid-cols-6 gap-1 min-w-max">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className={`flex flex-col items-center space-y-1 h-12 w-16 p-1 ${
                isSelected 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="text-[10px] font-medium text-center leading-tight">{category.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
