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
    if (!searchQuery) return true;
    
    const matchesSearch = 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
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
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search advisors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Compact Disclaimer */}
      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <p className="text-amber-800 dark:text-amber-200 text-xs flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Contact details not verified - verify SEBI registration independently
        </p>
      </div>

      {/* Results Count & Random Indicator */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchQuery 
              ? `${sortedAdvisors.length} advisor(s) found`
              : `${advisors.length} registered advisors`
            }
          </p>
          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
            <div className="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Auto-shuffle
          </div>
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
          <div className="p-3 space-y-3">
            {sortedAdvisors.map((advisor: InvestmentAdvisor, index: number) => (
              <Card key={advisor.id} className="hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                          {advisor.name}
                        </h3>
                        {index < 3 && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs">
                            Top
                          </Badge>
                        )}
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 text-sm mb-1">
                        {advisor.designation}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {advisor.company}
                      </p>
                    </div>
                    {advisor.rating && (
                      <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                        <Star className="h-3 w-3 text-green-600 dark:text-green-400 fill-current" />
                        <span className="text-xs text-green-700 dark:text-green-400">{advisor.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {advisor.specialization && (
                      <Badge variant="secondary" className="text-xs">
                        {advisor.specialization}
                      </Badge>
                    )}
                    {advisor.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {advisor.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <Button 
                      size="sm" 
                      className={`text-xs ${advisor.phone ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={() => advisor.phone && window.open(`tel:${advisor.phone}`, '_self')}
                      disabled={!advisor.phone}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className={`text-xs ${advisor.phone ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      onClick={() => advisor.phone && window.open(`https://wa.me/91${advisor.phone?.replace(/\D/g, '')}`, '_blank')}
                      disabled={!advisor.phone}
                    >
                      <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={`text-xs ${advisor.email ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                      onClick={() => advisor.email && window.open(`mailto:${advisor.email}`, '_self')}
                      disabled={!advisor.email}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Not verified by StocksShorts
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}