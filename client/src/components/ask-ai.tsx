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
      
      if (response.status === 401) {
        throw new Error("LOGIN_REQUIRED");
      }
      
      if (response.status === 429) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Daily limit exceeded");
      }
      
      const data = await response.json();
      return data.analysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setShowDiscussion(true);
      toast({
        title: "Beta Analysis Complete",
        description: "AI stock analysis completed",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze stock";
      
      if (errorMessage === "LOGIN_REQUIRED") {
        toast({
          title: "Login Required",
          description: "Go to Profile section to login and access AI stock analysis (Beta Testing)",
          variant: "destructive",
        });
      } else if (errorMessage.includes("limit")) {
        toast({
          title: "Daily Limit Reached",
          description: "You've used all 5 daily AI analysis queries. Try again tomorrow.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
      {/* Ultra Compact Ask AI Input */}
      <div className={`mb-2 ${isHighlighted ? 'ring-1 ring-blue-400 ring-opacity-20 rounded' : ''}`}>
        <div className={`p-2 rounded ${isHighlighted ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <Brain className="h-3 w-3 text-blue-500 flex-shrink-0" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI about any stock..."
                className="flex-1 h-7 text-xs border-0 bg-white dark:bg-gray-700 px-2"
                disabled={queryMutation.isPending}
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={queryMutation.isPending || !query.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white h-7 px-2"
              >
                {queryMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
              {isHighlighted && (
                <span className="px-1 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  NEW
                </span>
              )}
            </div>
          </form>
        </div>
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
                    AI Stock Analysis (Beta Testing)
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