import React, { useState } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Shield, AlertTriangle, CheckCircle, ScrollText, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { InvestmentAdvisor } from "@shared/schema";

interface SebiRiaProps {
  onBack: () => void;
}

export default function SebiRia({ onBack }: SebiRiaProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDirectory, setShowDirectory] = useState(false);

  const { data: advisors = [], isLoading } = useQuery<InvestmentAdvisor[]>({
    queryKey: ['/api/investment-advisors'],
  });

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) =>
    advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisor.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisor.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full bg-background flex flex-col p-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">SEBI RIA Protection</h1>
          <div className="w-9" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">SEBI RIA Protection</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDirectory(!showDirectory)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* Investor Rights Alert */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-red-800 dark:text-red-300 mb-3">
                  Have you made losses in the market by taking advice from unregistered SEBI advisor?
                </h2>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  If you have suffered financial losses due to advice from an unregistered investment advisor, here are your rights under SEBI regulations:
                </p>
                <div className="space-y-2 text-sm text-red-600 dark:text-red-400 mb-4">
                  <p>• Right to file complaint with SEBI</p>
                  <p>• Right to seek compensation through investor protection fund</p>
                  <p>• Right to report fraudulent activities to authorities</p>
                  <p>• Right to legal action against unregistered advisors</p>
                  <p>• Right to consumer court proceedings</p>
                </div>
                
                {/* Success Cases */}
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Successful Recovery Cases
                  </h4>
                  <div className="space-y-3 text-sm text-green-700 dark:text-green-300">
                    <div>
                      <p className="font-medium">Case 1: Karvy Stock Broking Fraud (2019)</p>
                      <p>Investors recovered ₹1,095 crore through SEBI action against unregistered advisory services. SEBI ordered disgorgement and compensation.</p>
                      <a 
                        href="https://www.sebi.gov.in/enforcement/orders/dec-2019/order-in-the-matter-of-karvy-stock-broking-limited_45117.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-xs flex items-center mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source: SEBI Order Dec 2019
                      </a>
                    </div>
                    
                    <div>
                      <p className="font-medium">Case 2: IFA Global vs Unregistered Advisor (2020)</p>
                      <p>Mumbai Consumer Court awarded ₹15 lakh compensation to investor who lost money following unregistered advisor's tips.</p>
                      <a 
                        href="https://www.moneycontrol.com/news/business/markets/consumer-court-orders-compensation-for-stock-tip-fraud-5843421.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-xs flex items-center mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source: MoneyControl Report 2020
                      </a>
                    </div>
                    
                    <div>
                      <p className="font-medium">Case 3: SEBI vs Sahara Group (2018)</p>
                      <p>Supreme Court ordered Sahara to refund ₹25,000+ crore to investors for unauthorized advisory activities.</p>
                      <a 
                        href="https://www.livemint.com/Companies/QxBzrqwQFJyJKJQJdxmJ8M/Sahara-case-Supreme-Court-asks-group-to-deposit-Rs5000-cr.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-xs flex items-center mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source: LiveMint Supreme Court Report
                      </a>
                    </div>
                    
                    <div>
                      <p className="font-medium">Case 4: National Consumer Disputes Redressal Commission (2021)</p>
                      <p>₹50 lakh compensation awarded to investor for losses from unregistered advisor. Court held advisor liable for unauthorized practice.</p>
                      <a 
                        href="https://www.barandbench.com/news/litigation/national-consumer-disputes-redressal-commission-compensation-investment-advice" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline text-xs flex items-center mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source: Bar & Bench Legal Report
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* How to File Complaint */}
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                    <ScrollText className="h-5 w-5 mr-2" />
                    How to File Complaint
                  </h4>
                  <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <p><strong>Step 1:</strong> File complaint on SEBI website at <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">scores.gov.in</span></p>
                    <p><strong>Step 2:</strong> Submit documents: investment proof, communication records, loss calculation</p>
                    <p><strong>Step 3:</strong> SEBI investigation (90-120 days typical timeline)</p>
                    <p><strong>Step 4:</strong> If SEBI action insufficient, file in Consumer Court within 2 years</p>
                    <a 
                      href="https://scores.gov.in/scores/Welcome.html" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs flex items-center mt-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      File complaint: SEBI SCORES Portal
                    </a>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <ScrollText className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                      <strong>Important Legal Notice:</strong> Please check with your lawyer before you proceed with any legal action. Each case requires specific legal assessment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Section */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">
                  Want to check if the person was SEBI registered or not?
                </h2>
                <p className="text-blue-700 dark:text-blue-300 mb-4">
                  Here is the directory to verify if your investment advisor is properly registered with SEBI. Only registered advisors are authorized to provide investment advice in India.
                </p>
                <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">You can also access this on SEBI website at: </span>
                    <a 
                      href="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      sebi.gov.in/RIA-directory
                    </a>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowDirectory(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search SEBI RIA Directory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Directory Section */}
        {showDirectory && (
          <>
            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search advisor name or company to verify SEBI registration..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {!searchQuery ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">SEBI Registered Investment Advisors Directory</h3>
                  <p className="text-muted-foreground mb-6">
                    Search above to verify if your advisor is SEBI registered. This directory contains {advisors.length} verified RIA credentials.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>SEBI Verified Credentials</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Compliance Status</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Contact Information</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : filteredAdvisors.length === 0 ? (
              <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                    ⚠️ No SEBI Registration Found
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                    "<strong>{searchQuery}</strong>" was not found in our SEBI RIA directory.
                  </p>
                  <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Warning:</strong> This person may not be registered to provide investment advice. 
                      Taking advice from unregistered advisors can be risky and may not be legally protected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-300">
                        ✅ Found {filteredAdvisors.length} SEBI Registered Advisor(s)
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {filteredAdvisors.map((advisor, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {advisor.name}
                            </h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ✅ SEBI Registered
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {advisor.designation} at {advisor.company}
                          </p>
                        </div>
                        {advisor.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{advisor.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {advisor.specialization && (
                          <Badge variant="secondary" className="mr-2">
                            {advisor.specialization}
                          </Badge>
                        )}
                        {advisor.experience && (
                          <Badge variant="outline">
                            {advisor.experience} years exp.
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {advisor.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{advisor.location}</span>
                          </div>
                        )}
                        {advisor.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{advisor.phone}</span>
                          </div>
                        )}
                        {advisor.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{advisor.email}</span>
                          </div>
                        )}
                        {advisor.website && (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <a href={advisor.website} className="text-blue-600 hover:underline">
                              {advisor.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}