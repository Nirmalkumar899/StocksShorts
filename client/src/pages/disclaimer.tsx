import { ArrowLeft, Shield, AlertTriangle, Info, FileText, Scale, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DisclaimerProps {
  onBack: () => void;
}

export default function Disclaimer({ onBack }: DisclaimerProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Main Disclaimer Card */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Important Notice
                  </h2>
                  <Badge variant="destructive" className="mb-4">
                    Not Investment Advice
                  </Badge>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    This content is for informational purposes only and is not investment advice. 
                    Please do your own research or consult a qualified financial advisor before making any investment decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Investment Risk Factors
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    All investments carry risk of loss
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Past performance doesn't predict future results
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Market volatility can affect investments
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Individual situations vary significantly
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Professional advice recommended
                  </span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Market conditions change rapidly
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Data Sources & Accuracy
                </h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Our content is aggregated from publicly available sources including financial news outlets, 
                  company announcements, and market data providers. While we strive for accuracy, we cannot 
                  guarantee the completeness, timeliness, or accuracy of all information provided.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Economic Times</Badge>
                <Badge variant="outline" className="text-xs">NSE</Badge>
                <Badge variant="outline" className="text-xs">LiveMint</Badge>
                <Badge variant="outline" className="text-xs">Company Filings</Badge>
                <Badge variant="outline" className="text-xs">Market Data Providers</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Legal Disclaimer */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Scale className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Legal Disclaimer
                </h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">No Liability</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    StocksShorts and its operators shall not be liable for any investment decisions 
                    made based on the information provided on this platform. Users are solely 
                    responsible for their investment choices and outcomes.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Responsibility</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    By using StocksShorts, you acknowledge that you understand the risks involved 
                    in financial markets and that you are responsible for conducting your own due 
                    diligence before making any financial decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-6">
            <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
              <FileText className="h-4 w-4" />
              <span className="text-sm">
                Last updated: June 27, 2025 • StocksShorts Platform
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}