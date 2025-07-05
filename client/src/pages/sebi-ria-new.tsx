import React, { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Filter, SortAsc, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import type { InvestmentAdvisor } from "@shared/schema";

interface SebiRiaProps {
  onBack: () => void;
}

export default function SebiRiaNew({ onBack }: SebiRiaProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");
  const [sortBy, setSortBy] = useState("random");
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const { data: advisors = [], isLoading } = useQuery<InvestmentAdvisor[]>({
    queryKey: ['/api/investment-advisors'],
  });

  // Shuffle advisors every 30 seconds for equal opportunity
  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleSeed(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Shuffle function using seed for consistent randomization
  const shuffleArray = (array: InvestmentAdvisor[], seed: number) => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;
    let randomIndex;
    
    // Simple seeded random function
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    while (currentIndex !== 0) {
      randomIndex = Math.floor(seededRandom(seed + currentIndex) * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
  };

  const specializations = ["All", ...Array.from(new Set(advisors.map(advisor => advisor.specialization).filter((spec): spec is string => Boolean(spec))))];

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) => {
    const matchesSearch = 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = selectedSpecialization === "All" || advisor.specialization === selectedSpecialization;
    
    return matchesSearch && matchesSpecialization;
  });

  const sortedAdvisors = (() => {
    let sorted = [...filteredAdvisors];
    
    if (sortBy === "random") {
      return shuffleArray(sorted, shuffleSeed);
    }
    
    return sorted.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "location":
          return (a.location || '').localeCompare(b.location || '');
        case "experience":
          return (b.experience || '').localeCompare(a.experience || '');
        default:
          return 0;
      }
    });
  })();

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Connect with SEBI RIA</h1>
          <div className="w-10" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Connect with SEBI RIA</h1>
        <div className="w-10" />
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search advisors by name, company, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-fit">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 min-w-fit">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
            >
              <option value="random">Random (Fair)</option>
              <option value="name">Name</option>
              <option value="location">Location</option>
              <option value="experience">Experience</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verification Disclaimer */}
      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <Alert className="border-amber-300 dark:border-amber-700 bg-transparent">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            <strong>Important:</strong> Contact details are not verified by StocksShorts. Please verify SEBI registration independently before engaging services.
          </AlertDescription>
        </Alert>
      </div>

      {/* Results Count & Random Indicator */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery || selectedSpecialization !== "All" 
              ? `${sortedAdvisors.length} advisor(s) found`
              : `${advisors.length} registered advisors available`
            }
          </p>
          {sortBy === "random" && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <div className="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Shuffles every 30s
            </div>
          )}
        </div>
      </div>

      {/* Advisors List */}
      <div className="flex-1 overflow-y-auto">
        {sortedAdvisors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-4xl mb-4">👨‍💼</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">No advisors found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedSpecialization("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {sortedAdvisors.map((advisor: InvestmentAdvisor, index: number) => (
              <Card key={advisor.id} className="hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {advisor.name}
                        </h3>
                        {sortBy === "random" && index < 3 && (
                          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold mb-1">
                        {advisor.designation}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {advisor.company}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {advisor.rating && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-700">
                          <Star className="h-3 w-3 text-green-600 dark:text-green-400 fill-current" />
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400">{advisor.rating}</span>
                        </div>
                      )}
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                        SEBI RIA
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {advisor.specialization && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 text-xs font-medium">
                        {advisor.specialization}
                      </Badge>
                    )}
                    {advisor.location && (
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {advisor.location}
                      </div>
                    )}
                    {advisor.experience && (
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md text-xs text-amber-700 dark:text-amber-400">
                        <Star className="h-3 w-3" />
                        {advisor.experience}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {advisor.phone && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-medium shadow-sm"
                        onClick={() => window.open(`tel:${advisor.phone}`, '_self')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call Now
                      </Button>
                    )}
                    {advisor.email && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => window.open(`mailto:${advisor.email}`, '_self')}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    )}
                    {advisor.website && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => window.open(advisor.website || '', '_blank')}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
                  </div>
                  
                  {/* Verification Notice */}
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Contact details not verified - please verify SEBI registration independently
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}