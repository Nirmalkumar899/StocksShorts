import { useState } from "react";
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
    advisor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    advisor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    advisor.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
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

      {/* Continuous Train-Style News Ticker */}
      <Card className="mb-6 bg-gradient-to-r from-red-800 to-red-900 text-white border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-red-600 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <ScrollText className="h-4 w-4 mr-2" />
              <span className="font-bold text-sm">SEBI RIA DIRECTORY</span>
            </div>
            <Badge className="bg-white text-red-600 text-xs font-bold px-2 py-1 animate-pulse">
              LIVE
            </Badge>
          </div>
          <div className="bg-black text-yellow-400 py-3 overflow-hidden relative">
            <div className="ticker-wrapper">
              <div className="ticker-content">
                {/* First set - alphabetically sorted */}
                {[...advisors]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((advisor, index) => (
                    <span key={`first-${advisor.id}`} className="inline-block mr-16 text-sm">
                      <span className="text-white font-bold">{advisor.name}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-yellow-400">{advisor.company}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-blue-300">{advisor.specialization}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-green-300">{advisor.location}</span>
                    </span>
                  ))}
                
                {/* Second set for seamless loop */}
                {[...advisors]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((advisor, index) => (
                    <span key={`second-${advisor.id}`} className="inline-block mr-16 text-sm">
                      <span className="text-white font-bold">{advisor.name}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-yellow-400">{advisor.company}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-blue-300">{advisor.specialization}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-green-300">{advisor.location}</span>
                    </span>
                  ))}

                {/* Third set for continuous flow */}
                {[...advisors]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((advisor, index) => (
                    <span key={`third-${advisor.id}`} className="inline-block mr-16 text-sm">
                      <span className="text-white font-bold">{advisor.name}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-yellow-400">{advisor.company}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-blue-300">{advisor.specialization}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-green-300">{advisor.location}</span>
                    </span>
                  ))}
              </div>
            </div>
          </div>
          <div className="bg-red-700 px-4 py-1 text-xs text-center">
            {advisors.length} SEBI Registered Advisors • Continuous Train Display • No Preference Order
          </div>
        </CardContent>
      </Card>

      {/* Advisor Cards */}
      <div className="space-y-4">
        {(showSearch ? filteredAdvisors : advisors.slice(0, 5)).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No advisors found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          (showSearch ? filteredAdvisors : advisors.slice(0, 5)).map((advisor: InvestmentAdvisor) => (
            <Card key={advisor.id} className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-blue-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700">
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
                  {advisor.rating && (
                    <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                      <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        {advisor.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {advisor.specialization}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {advisor.location}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Experience:</strong> {advisor.experience}
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
                    {advisor.website && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Globe className="h-4 w-4 mr-2" />
                        <a 
                          href={advisor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!showSearch && advisors.length > 5 && (
        <div className="text-center mt-6">
          <Button 
            onClick={() => setShowSearch(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            View All {advisors.length} Advisors
          </Button>
        </div>
      )}

      <div className="text-center mt-8 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All advisors are SEBI registered. Always verify credentials before investing.
        </p>
      </div>
    </div>
  );
}