import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";

interface SebiRiaProps {
  onBack: () => void;
}

export default function SebiRia({ onBack }: SebiRiaProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">SEBI RIA</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">SEBI Registered Investment Advisor</CardTitle>
            <CardDescription>
              Connect with certified investment advisors registered with SEBI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>• Get personalized investment advice</p>
              <p>• Portfolio review and recommendations</p>
              <p>• Compliance with SEBI regulations</p>
              <p>• Professional financial guidance</p>
            </div>
            <div className="pt-4">
              <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  🚧 Coming Soon
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  We're working on connecting you with certified SEBI RIAs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}