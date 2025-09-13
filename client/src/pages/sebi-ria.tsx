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

  const featuredAdvisor = advisors[featuredAdvisorIndex];

  return (
    <div className="h-full bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="p-2 text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">
                Connect with SEBI RIA
              </h1>
            </div>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Find & Connect with <span className="font-semibold text-white">SEBI Registered Investment Advisors</span> for personalized investment guidance
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="text-sm text-blue-100">Verified • Regulated • Trustworthy</span>
            </div>
          </div>

          {/* Enhanced Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <Search className="h-5 w-5 text-blue-200" />
                <span className="text-white font-medium">Find Your Perfect Investment Advisor</span>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by name, company, location, or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full bg-white/95 backdrop-blur-sm border-0 rounded-xl text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-white/30 shadow-lg"
                  data-testid="advisor-search-input"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Mutual Funds', 'Equity', 'Tax Planning', 'Portfolio Management'].map((tag) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery(tag.toLowerCase())}
                    className="bg-white/20 text-white hover:bg-white/30 rounded-full text-xs px-3 py-1"
                    data-testid={`search-tag-${tag.toLowerCase().replace(' ', '-')}`}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">


      {/* Featured Advisor Section */}
      {featuredAdvisor && !searchQuery && (
        <div className="mb-6">
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
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{featuredAdvisor.name}</h3>
                  <p className="text-blue-100 text-sm">{featuredAdvisor.company}</p>
                  <p className="text-blue-200 text-xs">{featuredAdvisor.designation}</p>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  SEBI RIA
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-blue-200 mb-1">Specialization</p>
                  <p className="text-sm font-medium">{featuredAdvisor.specialization || 'Investment Advisory'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200 mb-1">Experience</p>
                  <p className="text-sm font-medium">{featuredAdvisor.experience || 'Professional'}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {featuredAdvisor.location && (
                  <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <MapPin className="h-3 w-3" />
                    {featuredAdvisor.location}
                  </div>
                )}
                {featuredAdvisor.rating && (
                  <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 fill-current" />
                    {featuredAdvisor.rating}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {featuredAdvisor.phone && (
                  <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                )}
                {featuredAdvisor.email && (
                  <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                )}
                {featuredAdvisor.website && (
                  <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    Website
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

        <div className="text-center mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-blue-200 dark:border-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800 dark:text-blue-300">SEBI Verified Network</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All advisors are SEBI registered and verified. Always check credentials before investing.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}