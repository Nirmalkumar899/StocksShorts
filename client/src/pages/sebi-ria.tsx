import React, { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Shield, AlertTriangle, CheckCircle } from "@/lib/icons";
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
  const [featuredAdvisorIndex, setFeaturedAdvisorIndex] = useState(0);

  const { data: advisors = [], isLoading } = useQuery<InvestmentAdvisor[]>({
    queryKey: ['/api/investment-advisors'],
  });

  // Rotate featured advisor every 5 seconds
  useEffect(() => {
    if (advisors.length > 0) {
      const interval = setInterval(() => {
        setFeaturedAdvisorIndex(prev => (prev + 1) % Math.min(advisors.length, 10));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [advisors.length]);

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) =>
    advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisor.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (advisor.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">SEBI RIA Directory</h1>
          <div className="w-9" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const featuredAdvisor = advisors[featuredAdvisorIndex];

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Clean Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            SEBI Investment Advisors
          </h1>
          <div className="w-9" />
        </div>
        
        {/* Simple Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search advisors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              data-testid="advisor-search-input"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        
        {/* Stats Card */}
        <div className="p-4">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{advisors.length}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">SEBI Registered Advisors</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Advisor */}
        {featuredAdvisor && !searchQuery && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Advisor</h2>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{featuredAdvisor.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{featuredAdvisor.designation}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{featuredAdvisor.company}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">SEBI RIA</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {featuredAdvisor.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {featuredAdvisor.location}
                    </div>
                  )}
                  {featuredAdvisor.specialization && (
                    <Badge variant="secondary" className="text-xs">
                      {featuredAdvisor.specialization}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div className="px-4 pb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAdvisors.length} advisor(s) found
            </p>
          </div>
        )}

        {/* Advisors List */}
        <div className="px-4 space-y-3">
          {searchQuery ? (
            filteredAdvisors.length === 0 ? (
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">No advisors found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Try searching with different keywords
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAdvisors.slice(0, 20).map((advisor: InvestmentAdvisor) => (
                <Card key={advisor.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{advisor.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{advisor.designation}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">{advisor.company}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">SEBI RIA</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {advisor.specialization && (
                          <Badge variant="secondary" className="text-xs">
                            {advisor.specialization}
                          </Badge>
                        )}
                      </div>
                      
                      {advisor.location && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mr-1" />
                          {advisor.location}
                        </div>
                      )}
                      
                      <div className="flex gap-4 pt-2">
                        {advisor.phone && (
                          <a href={`tel:${advisor.phone}`} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </a>
                        )}
                        {advisor.email && (
                          <a href={`mailto:${advisor.email}`} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            <div className="space-y-4">
              {/* About SEBI RIA */}
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">About SEBI RIA</h2>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    SEBI Registered Investment Advisors are certified professionals who provide personalized investment advice based on your financial goals.
                  </p>
                </CardContent>
              </Card>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h3 className="font-medium text-gray-900 dark:text-white">Why Choose RIA?</h3>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• SEBI regulated</li>
                      <li>• Transparent fees</li>
                      <li>• Professional advice</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <h3 className="font-medium text-gray-900 dark:text-white">Your Rights</h3>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Unbiased advice</li>
                      <li>• Clear fee disclosure</li>
                      <li>• Complaint redressal</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Search Prompt */}
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <Search className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Find Your Advisor</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Search through {advisors.length} SEBI registered advisors
                  </p>
                  <Button 
                    onClick={() => document.querySelector<HTMLInputElement>('[data-testid="advisor-search-input"]')?.focus()}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Start Searching
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Simple Footer */}
        <div className="p-4 mt-6">
          <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900 dark:text-white text-sm">SEBI Verified</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All advisors are registered and regulated by SEBI
            </p>
          </div>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="pb-20"></div>
      </div>
    </div>
  );
}