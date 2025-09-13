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
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Featured Advisor Section */}
        {featuredAdvisor && !searchQuery && (
          <div className="mb-8">
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
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
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
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <Shield className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold">What is SEBI RIA?</h2>
              </div>
              <p className="text-blue-100 leading-relaxed text-sm">
                SEBI Registered Investment Advisors (RIA) are certified professionals regulated by Securities and Exchange Board of India. 
                They provide personalized investment advice based on your financial goals and risk profile.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg mr-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <h3 className="font-bold text-green-800 dark:text-green-200">Why Choose SEBI RIA?</h3>
                </div>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-2">
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>SEBI regulated and monitored</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Fiduciary duty to clients</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Transparent fee structure</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Professional qualifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-lg mr-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                  </div>
                  <h3 className="font-bold text-orange-800 dark:text-orange-200">Investor Rights</h3>
                </div>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Right to unbiased advice</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Clear fee disclosure</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Complaint redressal</li>
                  <li className="flex items-center"><span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>Investment suitability</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* SEBI RIA Directory Overview */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl mr-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">SEBI RIA Directory</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Find registered investment advisors</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-blue-600 dark:text-blue-400">{advisors.length}</div>
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">Registered Investment Advisors</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All advisors are SEBI verified and regulated • Use search above to find specific advisors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advisory Directory */}
        <div className="space-y-6">
          {searchQuery && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Found {filteredAdvisors.length} advisor(s) matching "{searchQuery}"
                  </p>
                </div>
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
                <Card key={advisor.id} className="hover:shadow-xl transition-all duration-300 border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                          {advisor.name}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                          {advisor.designation} at {advisor.company}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                        SEBI RIA
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">SPECIALIZATION</p>
                          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                            {advisor.specialization}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">LOCATION</p>
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 font-medium">
                            <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                            {advisor.location}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {advisor.phone && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CONTACT</p>
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <Phone className="h-4 w-4 mr-2 text-green-600" />
                              <a href={`tel:${advisor.phone}`} className="hover:text-blue-600 transition-colors font-medium">
                                {advisor.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {advisor.email && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">EMAIL</p>
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <Mail className="h-4 w-4 mr-2 text-blue-600" />
                              <a href={`mailto:${advisor.email}`} className="hover:text-blue-600 transition-colors font-medium break-all">
                                {advisor.email}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {filteredAdvisors.length > 10 && (
              <Card className="p-6 text-center bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Showing first 10 results
                  </p>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Refine your search for more specific results
                </p>
              </Card>
            )}
          </div>
        ) : (
          // Show guidance when no search
          <div className="space-y-8">
            <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Search className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Find Your Investment Advisor</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                    Search through <span className="font-bold text-blue-600">{advisors.length}</span> SEBI registered advisors to find the right match for your investment needs.
                  </p>
                </div>
                <Button 
                  onClick={() => setShowSearch(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Start Searching
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 p-3 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <ScrollText className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">How to Choose the Right Advisor</h3>
                  <p className="text-gray-600 dark:text-gray-400">Essential steps to find your perfect investment advisor</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">Check Credentials</h4>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>SEBI registration number</li>
                      <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Valid license status</li>
                      <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Professional qualifications</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center mb-4">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">Understand Fees</h4>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Fee structure transparency</li>
                      <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>No hidden charges</li>
                      <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Written fee agreement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

        {/* Footer Section */}
        <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl">SEBI Verified Network</span>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            All advisors are SEBI registered and verified professionals. Always verify credentials and fee structure before making investment decisions.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <CheckCircle className="h-5 w-5 text-green-300" />
            <span className="text-sm text-blue-100">Regulated • Verified • Trustworthy</span>
          </div>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="pb-20"></div>
      </div>
      </div>
    </div>
  );
}