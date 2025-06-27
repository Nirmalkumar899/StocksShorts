import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DisclaimerProps {
  onBack: () => void;
}

export default function Disclaimer({ onBack }: DisclaimerProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Disclaimer
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Investment Disclaimer
            </h2>
            <div className="prose dark:prose-invert text-gray-700 dark:text-gray-300 space-y-4">
              <p>
                <strong>This content is for informational purposes only and is not investment advice. 
                Please do your own research or consult a financial advisor.</strong>
              </p>
              
              <p>
                The information provided on StocksShorts is compiled from various public sources 
                and is intended for general informational purposes only. We do not provide 
                personalized investment advice or recommendations.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                Important Considerations:
              </h3>
              
              <ul className="space-y-2 text-sm">
                <li>• All investments carry risk, including potential loss of principal</li>
                <li>• Past performance does not guarantee future results</li>
                <li>• Market conditions can change rapidly and unpredictably</li>
                <li>• Individual financial situations vary significantly</li>
                <li>• Professional advice should be sought for significant investment decisions</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                Data Sources:
              </h3>
              
              <p className="text-sm">
                Our content is aggregated from publicly available sources including financial 
                news outlets, company announcements, and market data providers. While we strive 
                for accuracy, we cannot guarantee the completeness or timeliness of all information.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                No Liability:
              </h3>
              
              <p className="text-sm">
                StocksShorts and its operators shall not be liable for any investment decisions 
                made based on the information provided on this platform. Users are solely 
                responsible for their investment choices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}