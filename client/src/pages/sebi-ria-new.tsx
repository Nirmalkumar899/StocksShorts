import React, { useState } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Filter, SortAsc } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { InvestmentAdvisor } from "@shared/schema";

interface SebiRiaProps {
  onBack: () => void;
}

export default function SebiRiaNew({ onBack }: SebiRiaProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  const { data: advisors = [], isLoading } = useQuery<InvestmentAdvisor[]>({
    queryKey: ['/api/investment-advisors'],
  });

  const specializations = ["All", ...Array.from(new Set(advisors.map(advisor => advisor.specialization).filter((spec): spec is string => Boolean(spec))))];

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) => {
    const matchesSearch = 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = selectedSpecialization === "All" || advisor.specialization === selectedSpecialization;
    
    return matchesSearch && matchesSpecialization;
  });

  const sortedAdvisors = [...filteredAdvisors].sort((a, b) => {
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
              <option value="name">Name</option>
              <option value="location">Location</option>
              <option value="experience">Experience</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {searchQuery || selectedSpecialization !== "All" 
            ? `${sortedAdvisors.length} advisor(s) found`
            : `${advisors.length} registered advisors available`
          }
        </p>
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
          <div className="p-4 space-y-3">
            {sortedAdvisors.map((advisor: InvestmentAdvisor) => (
              <Card key={advisor.id} className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {advisor.name}
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {advisor.designation}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {advisor.company}
                      </p>
                    </div>
                    {advisor.rating && (
                      <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-green-600 fill-current" />
                        <span className="text-xs text-green-700 dark:text-green-400">{advisor.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {advisor.specialization && (
                      <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs">
                        {advisor.specialization}
                      </Badge>
                    )}
                    {advisor.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {advisor.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {advisor.phone && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex-1"
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
                        className="text-xs flex-1"
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
                        className="text-xs"
                        onClick={() => window.open(advisor.website || '', '_blank')}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
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