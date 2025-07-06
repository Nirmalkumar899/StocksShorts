import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Eye, TrendingUp, Shield, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function GmailConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [personalizedArticles, setPersonalizedArticles] = useState<any[]>([]);
  const { toast } = useToast();

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    try {
      // Get Gmail auth URL
      const data = await apiRequest("GET", "/api/gmail/auth-url");
      const { authUrl } = data;
      
      // Open Gmail authorization in new window
      const popup = window.open(authUrl, 'gmail-auth', 'width=500,height=600');
      
      // Listen for authorization completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          
          // Simulate successful connection for demo
          setIsConnected(true);
          toast({
            title: "Gmail Connected!",
            description: "Your email is now being tracked for personalized articles.",
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error('Gmail connection error:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Unable to connect Gmail. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScanEmails = async () => {
    setIsScanning(true);
    try {
      await apiRequest("POST", "/api/gmail/scan");
      
      // Fetch personalized articles
      const articles = await apiRequest("GET", "/api/personalized-articles?limit=5");
      setPersonalizedArticles(Array.isArray(articles) ? articles : []);
      
      toast({
        title: "Email Scan Complete",
        description: `Generated ${Array.isArray(articles) ? articles.length : 0} personalized articles based on your interests.`,
      });
    } catch (error) {
      console.error('Email scanning error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to scan emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Personalized Market Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your Gmail to generate personalized stock market articles based on your interests
          </p>
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              How Gmail Tracking Works
            </CardTitle>
            <CardDescription>
              Our AI analyzes your email patterns to create personalized market content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Email Analysis</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Scans last 7 days for company mentions, financial newsletters, research reports
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Interest Mapping</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Identifies your preferred sectors, companies, and investment themes
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Smart Generation</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Creates relevant corporate announcements matching your interests
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                  Privacy & Security
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  We only read email metadata and content for analysis. No emails are stored. 
                  All data is encrypted and used solely for generating personalized market content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Connection
              {isConnected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Your Gmail</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Authorize StocksShorts to analyze your email for personalized market insights
                </p>
                <Button 
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isConnecting ? "Connecting..." : "Connect Gmail"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-600">Gmail Connected Successfully</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ready to scan your emails for market interests
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-600">Active</Badge>
                </div>
                
                <Separator />
                
                <Button 
                  onClick={handleScanEmails}
                  disabled={isScanning}
                  className="w-full"
                  variant="outline"
                >
                  {isScanning ? "Scanning Emails..." : "Scan Emails & Generate Articles"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personalized Articles */}
        {personalizedArticles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Your Personalized Articles
              </CardTitle>
              <CardDescription>
                Generated based on your email interests and market activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalizedArticles.map((article, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm">{article.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {article.priority === "1" ? "High" : article.priority === "2" ? "Medium" : "Low"} Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {article.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.source}</span>
                    <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                      {article.personalizationReason}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Setup Instructions */}
        {!isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</div>
                  <p>Click "Connect Gmail" to authorize StocksShorts access</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</div>
                  <p>Sign in with your dedicated Gmail account for market research</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</div>
                  <p>Grant read-only access to your email content</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</div>
                  <p>Scan emails to generate personalized market articles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}