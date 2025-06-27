import { useState } from "react";
import { ArrowLeft, Search, Phone, Mail, MapPin, Star, Briefcase, Globe, Award, TrendingUp, Shield, Users, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Enhanced Header with Premium Design */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mr-4 hover:bg-white/50 dark:hover:bg-gray-700/50 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                  Premium Investment Advisors
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  SEBI Registered • Verified • Trusted
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{advisors.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Expert Advisors</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">100%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">SEBI Verified</p>
                </div>
              </div>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">24/7</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </div>
          <Input
            placeholder="🔍 Search by name, company, specialization, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-transparent focus:border-gradient-to-r focus:from-blue-500 focus:to-purple-500 shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-3xl focus:shadow-3xl placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
                {filteredAdvisors.map((advisor: InvestmentAdvisor, index) => (
                  <Card 
                    key={advisor.id} 
                    className="group bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 rounded-3xl overflow-hidden relative animate-fade-in-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* Premium Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 transition-all duration-500 rounded-3xl p-[2px]">
                      <div className="w-full h-full bg-white/95 dark:bg-gray-800/95 rounded-3xl"></div>
                    </div>
                    
                    {/* Sparkle Animation */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="h-5 w-5 text-yellow-400 animate-spin" />
                    </div>
                    
                    <CardContent className="p-8 relative z-10">
                      {/* Enhanced Header with Status Indicator */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                              {advisor.name}
                            </h3>
                            {advisor.company && (
                              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center">
                                <Briefcase className="h-3 w-3 mr-1" />
                                {advisor.company}
                              </p>
                            )}
                            {advisor.designation && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {advisor.designation}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">Active</span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-2 py-1">
                              SEBI Registered
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Rating Section */}
                      <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-2xl border border-yellow-200/50 dark:border-yellow-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Rating</p>
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <Award className="h-3 w-3" />
                            <span>Premium Advisor</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRating(advisor.id, star)}
                                className="hover:scale-125 transition-all duration-200 hover:rotate-12"
                              >
                                <Star 
                                  className={`h-6 w-6 transition-all duration-200 ${
                                    star <= (userRatings[advisor.id] || 0)
                                      ? 'text-yellow-400 fill-current drop-shadow-sm'
                                      : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          {userRatings[advisor.id] && (
                            <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 px-3 py-1 rounded-full">
                              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                                {userRatings[advisor.id]}/5
                              </span>
                              <div className="text-xs text-gray-500">
                                {userRatings[advisor.id] === 5 ? '🌟' : userRatings[advisor.id] >= 4 ? '⭐' : '👍'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Specialization with Multiple Tags */}
                      {advisor.specialization && (
                        <div className="mb-6">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Specialization</p>
                          <div className="flex flex-wrap gap-2">
                            {advisor.specialization.split(',').map((spec, idx) => (
                              <Badge 
                                key={idx}
                                variant="outline" 
                                className="text-xs bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 px-3 py-1 hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 hover:scale-105"
                              >
                                {spec.trim()}
                              </Badge>
                            ))}
                          </div>
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

                      {/* Premium Action Buttons */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {advisor.phone && (
                            <Button
                              size="sm"
                              onClick={() => handleCall(advisor.phone)}
                              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 rounded-xl"
                            >
                              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Phone className="h-4 w-4 mr-2 relative z-10" />
                              <span className="relative z-10 font-semibold">Call Now</span>
                            </Button>
                          )}
                          {advisor.email && (
                            <Button
                              size="sm"
                              onClick={() => handleEmail(advisor.email)}
                              className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 rounded-xl"
                            >
                              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                              <Mail className="h-4 w-4 mr-2 relative z-10" />
                              <span className="relative z-10 font-semibold">Email</span>
                            </Button>
                          )}
                        </div>
                        {advisor.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWebsite(advisor.website)}
                            className="w-full group relative overflow-hidden border-2 border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 transition-all duration-500 transform hover:scale-105 rounded-xl shadow-lg hover:shadow-xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <Globe className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400 relative z-10" />
                            <span className="font-semibold text-purple-700 dark:text-purple-300 relative z-10">Visit Website</span>
                          </Button>
                        )}
                        
                        {/* Quick Action Chips */}
                        <div className="flex justify-center space-x-2 pt-2">
                          <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                            💼 Consultation Available
                          </div>
                          <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full text-xs font-medium text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
                            🏆 Top Rated
                          </div>
                        </div>
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