import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AskAI from '@/components/ask-ai';

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              AI Stock Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
              Get detailed analysis of Indian stocks with authentic financial data, 
              quarterly performance insights, and investment recommendations.
            </p>
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
    </div>
  );
}