import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Send, Loader2, MessageSquare, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AskAIProps {
  isHighlighted?: boolean;
}

export default function AskAI({ isHighlighted = false }: AskAIProps) {
  const [query, setQuery] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [showDiscussion, setShowDiscussion] = useState(false);
  const { toast } = useToast();

  const queryMutation = useMutation({
    mutationFn: async (stockQuery: string) => {
      const response = await apiRequest("POST", "/api/stock-ai/query", { query: stockQuery });
      const data = await response.json();
      return data.analysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setShowDiscussion(true);
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
    <>
      {/* Compact Ask AI Input */}
      <div className={`mb-3 ${isHighlighted ? 'ring-1 ring-blue-400 ring-opacity-30 rounded-lg' : ''}`}>
        <Card className={`${isHighlighted ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                Ask AI Stock Query
              </h3>
              {isHighlighted && (
                <span className="px-1 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
                  NEW
                </span>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about any stock (e.g., 'Analyze TCS' or 'Is Reliance good buy?')"
                  className="flex-1 h-8 text-sm"
                  disabled={queryMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={queryMutation.isPending || !query.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-8 px-3"
                >
                  {queryMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Focus:</span> Fundamentals first, then technical
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Separate Stock Discussion Section */}
      {showDiscussion && analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Stock Discussion
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiscussion(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Query: "{query}"
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI Stock Analysis
                  </span>
                </div>
                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis}
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border-l-4 border-yellow-500">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Stock-Specific Discussion
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This dedicated section focuses only on stock-specific queries and analysis. 
                  Ask follow-up questions about fundamentals, technicals, or investment strategy.
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowDiscussion(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Close Discussion
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}