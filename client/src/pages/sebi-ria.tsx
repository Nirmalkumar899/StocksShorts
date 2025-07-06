import React, { useState } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Shield, AlertTriangle, CheckCircle, ScrollText } from "lucide-react";
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
  const [showSearch, setShowSearch] = useState(false);

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
      <div className="h-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col p-4">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">SEBI RIA Directory</h1>
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
    <div className="h-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          SEBI RIA Directory
        </h1>
        <Button 
          variant="ghost" 
          onClick={() => setShowSearch(!showSearch)}
          className="p-2"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* SEBI RIA Education Section */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="mb-6 space-y-4">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center mb-3">
              <Shield className="h-6 w-6 mr-3" />
              <h2 className="text-lg font-bold">What is SEBI RIA?</h2>
            </div>
            <p className="text-blue-100 leading-relaxed">
              SEBI Registered Investment Advisors (RIA) are certified professionals regulated by Securities and Exchange Board of India. 
              They provide personalized investment advice based on your financial goals and risk profile.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-200">Why Choose SEBI RIA?</h3>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• SEBI regulated and monitored</li>
                <li>• Fiduciary duty to clients</li>
                <li>• Transparent fee structure</li>
                <li>• Professional qualifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Investor Rights</h3>
              </div>
              <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                <li>• Right to unbiased advice</li>
                <li>• Clear fee disclosure</li>
                <li>• Complaint redressal</li>
                <li>• Investment suitability</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search Section */}
      {showSearch && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search advisors, companies, specializations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-200 dark:border-gray-600"
          />
        </div>
      )}

      {/* SEBI RIA Directory Overview */}
      <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            <h2 className="text-lg font-semibold">SEBI RIA Directory</h2>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">{advisors.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Registered Investment Advisors</p>
            <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
              All advisors are SEBI verified. Use search to find specific advisors.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advisory Directory */}
      <div className="space-y-6">
        {searchQuery && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Found {filteredAdvisors.length} advisor(s) matching "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        )}

        {searchQuery ? (
          // Show search results
          <div className="space-y-4">
            {filteredAdvisors.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold mb-2">No advisors found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try searching by name, company, location, or specialization
                </p>
              </Card>
            ) : (
              filteredAdvisors.slice(0, 10).map((advisor: InvestmentAdvisor) => (
                <Card key={advisor.id} className="hover:shadow-lg transition-shadow border-blue-100 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">
                          {advisor.name}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                          {advisor.designation} at {advisor.company}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {advisor.specialization}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {advisor.location}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {advisor.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-2" />
                            <a href={`tel:${advisor.phone}`} className="hover:text-blue-600 transition-colors">
                              {advisor.phone}
                            </a>
                          </div>
                        )}
                        {advisor.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4 mr-2" />
                            <a href={`mailto:${advisor.email}`} className="hover:text-blue-600 transition-colors">
                              {advisor.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {filteredAdvisors.length > 10 && (
              <Card className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Showing first 10 results. Refine your search for more specific results.
                </p>
              </Card>
            )}
          </div>
        ) : (
          // Show guidance when no search
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <h2 className="text-lg font-semibold mb-3">Find Your Investment Advisor</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Search through {advisors.length} SEBI registered advisors to find the right match for your investment needs.
                </p>
                <Button 
                  onClick={() => setShowSearch(true)}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Start Searching
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">How to Choose the Right Advisor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Check Credentials</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• SEBI registration number</li>
                      <li>• Valid license status</li>
                      <li>• Professional qualifications</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Understand Fees</h4>
                    <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Fee structure transparency</li>
                      <li>• No hidden charges</li>
                      <li>• Written fee agreement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="text-center mt-8 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All advisors are SEBI registered. Always verify credentials before investing.
        </p>
      </div>
      </div>
    </div>
  );
}