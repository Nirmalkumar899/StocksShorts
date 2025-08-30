import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { 
  Globe, 
  TrendingUp, 
  PiggyBank, 
  Bitcoin,
  BookOpen,
  Users,
  DollarSign,
  Star
} from "@/lib/icons";

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

// Remove all category filters for clean Inshorts-style interface
const categories: any[] = [];

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [, setLocation] = useLocation();

  const handleCategoryClick = (category: any) => {
    // Track category selection
    trackEvent('category_select', 'navigation', category.label, category.id);
    onCategoryChange(category.id);
    setLocation(category.url);
  };

  // Hide category filter completely for clean Inshorts-style interface
  return null;
}
