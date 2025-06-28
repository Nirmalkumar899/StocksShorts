import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DisclaimerProps {
  onBack: () => void;
}

export default function Disclaimer({ onBack }: DisclaimerProps) {
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Disclaimer
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto pb-20">
        <div className="space-y-6">
          {/* Main Disclaimer */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Important Notice
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                This content is for <strong>informational purposes only</strong> and is not investment advice. 
                Please do your own research or consult a qualified financial advisor before making any investment decisions.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Not Investment Advice: All information provided is for educational purposes only.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Investment Risks
              </h3>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p>• All investments carry risk of loss</p>
                <p>• Past performance doesn't predict future results</p>
                <p>• Market volatility can affect investments</p>
                <p>• Individual situations vary significantly</p>
                <p>• Professional advice recommended</p>
                <p>• Market conditions change rapidly</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Data Sources
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Content is aggregated from publicly available sources including financial news outlets, 
                company announcements, and market data providers. We cannot guarantee completeness, 
                timeliness, or accuracy of all information.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sources: Economic Times, NSE, LiveMint, Company Filings, Market Data Providers
              </div>
            </CardContent>
          </Card>

          {/* Legal */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Legal Disclaimer
              </h3>
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">No Liability</h4>
                  <p>StocksShorts and its operators are not liable for investment decisions made based on information provided. Users are solely responsible for their investment choices.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Responsibility</h4>
                  <p>By using StocksShorts, you acknowledge understanding of financial market risks and responsibility for conducting due diligence before financial decisions.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: June 27, 2025 • StocksShorts Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}