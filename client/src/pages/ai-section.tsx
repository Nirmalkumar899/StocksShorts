import { ArrowLeft, Database, FolderOpen, Brain } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import AskAI from '@/components/ask-ai';
import BottomNavigation from '@/components/bottom-navigation';

interface AISectionProps {
  onBack: () => void;
}

export default function AISection({ onBack }: AISectionProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Analysis
          </h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Stock Analysis
              </h2>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium">
                Beta Testing
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xl mx-auto mb-3">
              Get intelligent stock analysis based on company research documents and financial data.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-md mx-auto mb-4">
              <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
                📊 Currently we cover Nifty 50 stocks only. More to come soon!
              </p>
            </div>
          </div>

          {/* AI Component */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <AskAI isHighlighted={true} />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Fundamentals
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                PE ratios, ROE, debt analysis from verified sources
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Performance
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Revenue growth, margins, quarterly comparisons
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Insights
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Management guidance and strategic highlights
              </p>
            </div>
          </div>


        </div>
      </div>
      
      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0">
        <BottomNavigation activeTab="ai-section" onTabChange={() => {}} />
      </div>
    </div>
  );
}