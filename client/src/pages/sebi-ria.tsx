import { useState } from "react";
import { ArrowLeft, Search, Phone, Mail, MapPin, Star, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { InvestmentAdvisor } from "@shared/schema";

interface SebiRiaProps {
  onBack: () => void;
}

export default function SebiRia({ onBack }: SebiRiaProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: advisors = [], isLoading, error } = useQuery<InvestmentAdvisor[]>({
    queryKey: ["/api/investment-advisors"],
    retry: false,
  });

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) =>
    advisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (advisor.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (advisor.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (advisor.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const handleWebsite = (website: string | null) => {
    if (website) {
      const url = website.startsWith('http') ? website : `https://${website}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-4 hover:bg-white/50 dark:hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SEBI Registered Investment Advisors
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search by name, company, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-lg"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center p-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
            <p className="text-lg text-red-600 dark:text-red-400">
              Unable to load investment advisors. Please try again later.
            </p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? 's' : ''} found
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>

            {filteredAdvisors.length === 0 ? (
              <div className="text-center p-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No advisors found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAdvisors.map((advisor: InvestmentAdvisor) => (
                  <Card key={advisor.id} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {advisor.name}
                          </h3>
                          {advisor.company && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {advisor.company}
                            </p>
                          )}
                          {advisor.designation && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {advisor.designation}
                            </p>
                          )}
                        </div>
                        {advisor.rating && (
                          <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">
                              {advisor.rating}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Specialization */}
                      {advisor.specialization && (
                        <div className="mb-4">
                          <Badge variant="secondary" className="text-xs">
                            {advisor.specialization}
                          </Badge>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        {advisor.experience && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <span>{advisor.experience}</span>
                          </div>
                        )}
                        {advisor.location && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{advisor.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {advisor.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(advisor.phone)}
                            className="flex-1 min-w-0"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        )}
                        {advisor.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmail(advisor.email)}
                            className="flex-1 min-w-0"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        )}
                        {advisor.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWebsite(advisor.website)}
                            className="w-full"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Website
                          </Button>
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