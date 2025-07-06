import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Send, Loader2, MessageSquare, X, AlertTriangle } from "lucide-react";
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
      // Show thinking notification immediately
      toast({
        title: "🧠 Thinking...",
        description: "Analyzing stock data",
        duration: 6000,
      });
      
      const response = await apiRequest("POST", "/api/stock-ai/query", { query: stockQuery });
      const data = await response.json();
      return data.analysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setShowDiscussion(true);
      toast({
        title: "Analysis Complete",
        description: "AI stock analysis finished successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze stock";
      toast({
        title: "Analysis Failed",
        description: errorMessage,
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
      {/* Thinking notification with moving dots - positioned above highlighted input */}
      {queryMutation.isPending && isHighlighted && (
        <div className="mb-1 flex justify-center">
          <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <span>Thinking</span>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
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
              
              {/* SEBI Compliance Warning */}
              <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 rounded-r-xl shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-800 dark:text-red-300 text-lg mb-3">
                      ⚠️ SEBI Regulatory Disclaimer
                    </h4>
                    <div className="text-red-700 dark:text-red-300 space-y-2 text-sm leading-relaxed">
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        This is educational content only, NOT investment advice
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Provider is not a SEBI-registered investment advisor
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Consult SEBI-registered advisor before making investment decisions
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Past performance does not guarantee future results
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Stock investments are subject to market risks
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Educational Stock Analysis
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Powered by Perplexity AI • Beta Testing
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
                      {analysis}
                    </div>
                  </div>
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