import React, { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Shield, AlertTriangle, CheckCircle, ScrollText, Shuffle } from "@/lib/icons";
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
      <div className="h-full bg-gray-50 dark:bg-neutral-950 flex flex-col">
        <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SEBI RIA Directory</h1>
            <div className="w-9" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const featuredAdvisor = advisors[featuredAdvisorIndex];

  return (
    <div className="h-full bg-gray-50 dark:bg-neutral-950 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            SEBI RIA Directory
          </h1>
          <Button 
            variant="ghost" 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search advisors by name, company, specialization, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-neutral-800 border-gray-300 dark:border-neutral-700"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Featured Advisor Section */}
        {featuredAdvisor && !searchQuery && (
          <div className="px-4 py-4 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shuffle className="h-5 w-5 text-blue-600" />
                Featured SEBI RIA
              </h2>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                Auto-rotating
              </div>
            </div>
            <Card className="bg-blue-600 dark:bg-blue-700 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold mb-1 break-words leading-tight">{featuredAdvisor.name}</h3>
                    <p className="text-blue-100 text-sm break-words mb-1">{featuredAdvisor.company}</p>
                    <p className="text-blue-200 text-xs break-words">{featuredAdvisor.designation}</p>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-2 flex-shrink-0 text-xs">
                    SEBI RIA
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-blue-200 mb-1">Specialization</p>
                    <p className="text-sm font-medium break-words leading-tight">{featuredAdvisor.specialization || 'Investment Advisory'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 mb-1">Location</p>
                    <p className="text-sm font-medium break-words leading-tight flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      {featuredAdvisor.location || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {featuredAdvisor.phone && (
                    <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-3 py-1">
                      <Phone className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                  )}
                  {featuredAdvisor.email && (
                    <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs px-3 py-1">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SEBI RIA Education Section */}
        <div className="px-4 py-4 space-y-4">
          <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start mb-3">
                <Shield className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">What is SEBI RIA?</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed break-words text-sm">
                    SEBI Registered Investment Advisors (RIA) are certified professionals regulated by Securities and Exchange Board of India. 
                    They provide personalized investment advice based on your financial goals and risk profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-neutral-900 border border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-start mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <h3 className="font-semibold text-gray-900 dark:text-white break-words">Why Choose SEBI RIA?</h3>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    SEBI regulated and monitored
                  </li>
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Fiduciary duty to clients
                  </li>
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Transparent fee structure
                  </li>
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Professional qualifications
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-neutral-900 border border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-start mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                  <h3 className="font-semibold text-gray-900 dark:text-white break-words">Investor Rights</h3>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Right to unbiased advice
                  </li>
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Clear fee disclosure
                  </li>
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Complaint redressal
                  </li>
                  <li className="break-words flex items-start">
                    <span className="w-1 h-1 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Investment suitability
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SEBI RIA Directory Overview */}
        <div className="px-4 pb-4">
          <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3 flex-shrink-0">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white break-words mb-1">Directory Overview</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Find verified SEBI registered investment advisors</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{advisors.length}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">Registered Advisors</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">✓ SEBI Verified</div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">All listings verified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advisory Directory */}
        <div className="px-4 space-y-4">
          {searchQuery && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 break-words">
                  Found {filteredAdvisors.length} advisor(s) matching "{searchQuery}"
                </p>
              </CardContent>
            </Card>
          )}

          {searchQuery ? (
            // Show search results
            <div className="space-y-4">
              {filteredAdvisors.length === 0 ? (
                <Card className="p-6 text-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No advisors found</h3>
                  <p className="text-gray-600 dark:text-gray-400 break-words">
                    Try searching by name, company, location, or specialization
                  </p>
                </Card>
              ) : (
                filteredAdvisors.slice(0, 10).map((advisor: InvestmentAdvisor) => (
                  <Card key={advisor.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                    <CardContent className="p-4">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 break-words">
                          {advisor.name}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium break-words">
                          {advisor.designation} at {advisor.company}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 break-words">
                            {advisor.specialization}
                          </Badge>
                          <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{advisor.location}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {advisor.phone && (
                            <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                              <a href={`tel:${advisor.phone}`} className="hover:text-blue-600 transition-colors break-words">
                                {advisor.phone}
                              </a>
                            </div>
                          )}
                          {advisor.email && (
                            <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                              <a href={`mailto:${advisor.email}`} className="hover:text-blue-600 transition-colors break-words">
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
                <Card className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 break-words">
                    Showing first 10 results. Refine your search for more specific results.
                  </p>
                </Card>
              )}
            </div>
          ) : (
            // Show guidance when no search
            <div className="space-y-4">
              <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                <CardContent className="p-5 text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Find Your Investment Advisor</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 break-words text-sm">
                    Search through {advisors.length} SEBI registered advisors to find the right match for your investment needs.
                  </p>
                  <Button 
                    onClick={() => setShowSearch(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2"
                  >
                    Start Searching
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white break-words">Choosing the Right Advisor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 break-words">✓ Check Credentials</h4>
                      <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                        <li className="break-words flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          SEBI registration number
                        </li>
                        <li className="break-words flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          Valid license status
                        </li>
                        <li className="break-words flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          Professional qualifications
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 break-words">₹ Understand Fees</h4>
                      <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                        <li className="break-words flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          Fee structure transparency
                        </li>
                        <li className="break-words flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          No hidden charges
                        </li>
                        <li className="break-words flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          Written fee agreement
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="px-4 py-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-4 w-4 text-blue-600 mr-2" />
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">SEBI Verified Directory</p>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 break-words">
              All advisors are SEBI registered. Always verify credentials before investing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}