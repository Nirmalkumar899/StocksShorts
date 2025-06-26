import { useState } from "react";
import { ArrowLeft, Search, Phone, Mail, MapPin, Star, Briefcase, Globe, StarIcon } from "lucide-react";
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
  const [userRatings, setUserRatings] = useState<{[key: number]: number}>({});

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

  const handleRating = (advisorId: number, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [advisorId]: rating
    }));
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAdvisors.map((advisor: InvestmentAdvisor) => (
                  <Card key={advisor.id} className="group bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-2xl overflow-hidden relative">
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-2xl"></div>
                    <CardContent className="p-8 relative z-10">
                      {/* Header */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {advisor.name}
                        </h3>
                        {advisor.company && (
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                            {advisor.company}
                          </p>
                        )}
                        {advisor.designation && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {advisor.designation}
                          </p>
                        )}
                      </div>

                      {/* User Rating Section */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rate this advisor:</p>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRating(advisor.id, star)}
                              className="hover:scale-110 transition-transform"
                            >
                              <Star 
                                className={`h-5 w-5 ${
                                  star <= (userRatings[advisor.id] || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            </button>
                          ))}
                          {userRatings[advisor.id] && (
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              ({userRatings[advisor.id]}/5)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specialization */}
                      {advisor.specialization && (
                        <div className="mb-4">
                          <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                            {advisor.specialization}
                          </Badge>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-3 mb-6">
                        {advisor.experience && (
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                            <Briefcase className="h-4 w-4 mr-3 text-blue-500" />
                            <span className="font-medium">{advisor.experience}</span>
                          </div>
                        )}
                        {advisor.location && (
                          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
                            <MapPin className="h-4 w-4 mr-3 text-green-500" />
                            <span className="font-medium">{advisor.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          {advisor.phone && (
                            <Button
                              size="sm"
                              onClick={() => handleCall(advisor.phone)}
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                          )}
                          {advisor.email && (
                            <Button
                              size="sm"
                              onClick={() => handleEmail(advisor.email)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Email
                            </Button>
                          )}
                        </div>
                        {advisor.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWebsite(advisor.website)}
                            className="w-full border-2 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            Visit Website
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