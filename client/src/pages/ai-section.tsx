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
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Stock Analysis
              </h2>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium">
                Beta Testing
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
              Advanced AI that analyzes company research documents 
              to provide personalized stock analysis based on comprehensive data.
            </p>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
              💡 Ask specific questions about companies for detailed financial insights
            </div>
            
            {/* Enhanced Features */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">Document Analysis</span>
                </div>
                <p className="text-blue-700 dark:text-blue-400">Reads research documents and reports</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-300">Company Data</span>
                </div>
                <p className="text-green-700 dark:text-green-400">Analyzes company-specific information</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800 dark:text-purple-300">Smart Insights</span>
                </div>
                <p className="text-purple-700 dark:text-purple-400">Provides data-driven analysis</p>
              </div>
            </div>
          </div>

          {/* AI Component */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <AskAI isHighlighted={true} />
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Fundamental Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PE ratios, ROE, debt analysis, and financial metrics from authentic sources
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Quarterly Performance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revenue growth, profit margins, and year-over-year comparisons
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Management Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conference call highlights and management guidance numbers
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <p className="text-xs text-amber-800 dark:text-amber-300 text-center">
              <strong>Disclaimer:</strong> This is not investment advice. Please cross-check all numbers and do your own analysis before making investment decisions.
            </p>
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