import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Send, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AskAIProps {
  isHighlighted?: boolean;
}

export default function AskAI({ isHighlighted = false }: AskAIProps) {
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState("");
  const { toast } = useToast();

  const queryMutation = useMutation({
    mutationFn: async (stockQuery: string) => {
      const response = await apiRequest("POST", "/api/stock-ai/query", { query: stockQuery });
      const data = await response.json();
      return data.analysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your stock query",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze stock",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    queryMutation.mutate(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`mb-4 ${isHighlighted ? 'ring-2 ring-blue-500 ring-opacity-50 rounded-lg' : ''}`}>
      <Card className={`${isHighlighted ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ask AI about any Stock
            </h3>
            {isHighlighted && (
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                NEW
              </span>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about any stock (e.g., 'Analyze TCS fundamentals' or 'Is Reliance a good buy?')"
                className="flex-1"
                disabled={queryMutation.isPending}
              />
              <Button 
                type="submit" 
                disabled={queryMutation.isPending || !query.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {queryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {analysis && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI Analysis
                </span>
              </div>
              <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                {analysis}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Focus:</span> Fundamentals first, then technical analysis
          </div>
        </CardContent>
      </Card>
    </div>
  );
}