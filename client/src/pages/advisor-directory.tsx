import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Search, Phone, MessageCircle, Users, MapPin, Filter, Clock, User, Globe, Star, CheckCircle, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { InvestmentAdvisor } from "@shared/schema";

// API Response Types
interface AdvisorApiResponse {
  advisors: InvestmentAdvisor[];
  total: number;
  filters?: any;
  timestamp?: string;
}

interface AdvisorDirectoryProps {
  onBack?: () => void;
}

// Indian states for dropdown
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Puducherry"
];

// Common services for filtering
const commonServices = [
  "Investment Planning", "Portfolio Review", "Risk Assessment", "Retirement Planning", 
  "Tax Planning", "Insurance Consultation", "Estate Planning", "Debt Management", 
  "Goal-based Planning", "SIP Advisory", "Mutual Fund Selection", "Stock Research"
];

export default function AdvisorDirectory({ onBack }: AdvisorDirectoryProps) {
  useSEO({
    title: "Find SEBI Investment Advisors | StocksShorts",
    description: "Connect with verified SEBI-registered investment advisors. Search by location, specialization, and services. Get professional financial advice from qualified experts.",
    keywords: "SEBI investment advisors, financial advisors, investment consultants, portfolio management, financial planning"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters for API call
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedState) params.state = selectedState;
    if (selectedCity) params.city = selectedCity;
    if (statusFilter !== "all") params.status = statusFilter;
    return params;
  }, [debouncedSearch, selectedState, selectedCity, statusFilter]);

  // Fetch advisors from API
  const { data, isLoading, error, refetch } = useQuery<AdvisorApiResponse>({
    queryKey: ['/api/advisors', queryParams],
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds for status updates
  });

  const advisors: InvestmentAdvisor[] = data?.advisors || [];
  const totalCount = data?.total || 0;

  // Filter advisors by service if selected
  const filteredAdvisors = useMemo(() => {
    if (!serviceFilter) return advisors;
    return advisors.filter(advisor => {
      const services = Array.isArray(advisor.servicesOffered) ? advisor.servicesOffered : [];
      return services.includes(serviceFilter);
    });
  }, [advisors, serviceFilter]);

  // Get unique cities for selected state
  const availableCities = useMemo(() => {
    if (!selectedState) return [];
    const cities = advisors
      .filter(advisor => advisor.state === selectedState)
      .map(advisor => advisor.city)
      .filter((city): city is string => Boolean(city && city.trim()))
      .filter((city, index, arr) => arr.indexOf(city) === index)
      .sort();
    return cities;
  }, [advisors, selectedState]);

  // Clear city when state changes
  useEffect(() => {
    if (selectedState && selectedCity && !availableCities.includes(selectedCity)) {
      setSelectedCity("");
    }
  }, [selectedState, selectedCity, availableCities]);

  const handleWhatsAppContact = (advisor: InvestmentAdvisor) => {
    const phoneNumber = advisor.whatsappNumber || advisor.professionalPhone || null;
    if (!phoneNumber) return;
    
    const message = `Hi ${advisor.firstName}, I found your profile on StocksShorts and would like to inquire about your investment advisory services.`;
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhoneCall = (advisor: InvestmentAdvisor) => {
    const phoneNumber = advisor.professionalPhone || advisor.phone || null;
    if (!phoneNumber) return;
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    window.location.href = `tel:+91${cleanPhone}`;
  };

  const handleMessage = (advisor: InvestmentAdvisor) => {
    toast({
      title: "Feature Coming Soon",
      description: "In-app messaging will be available soon. For now, please use WhatsApp or phone contact.",
    });
  };

  const getStatusColor = (advisor: InvestmentAdvisor) => {
    const now = new Date();
    const lastActive = advisor.lastActiveAt ? new Date(advisor.lastActiveAt) : null;
    const isRecentlyActive = lastActive && (now.getTime() - lastActive.getTime()) < 2 * 60 * 1000; // 2 minutes
    
    if (advisor.status === 'active' && isRecentlyActive) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getStatusText = (advisor: InvestmentAdvisor) => {
    const now = new Date();
    const lastActive = advisor.lastActiveAt ? new Date(advisor.lastActiveAt) : null;
    const isRecentlyActive = lastActive && (now.getTime() - lastActive.getTime()) < 2 * 60 * 1000; // 2 minutes
    
    if (advisor.status === 'active' && isRecentlyActive) {
      return 'Active Now';
    }
    return 'Offline';
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedState("");
    setSelectedCity("");
    setStatusFilter("all");
    setServiceFilter("");
  };

  const hasActiveFilters = searchTerm || selectedState || selectedCity || statusFilter !== "all" || serviceFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="text-gray-600 dark:text-gray-300"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  SEBI Investment Advisors
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalCount} verified professionals
                </p>
              </div>
            </div>
            
            {/* Mobile filter toggle */}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${isMobile && !showFilters ? 'hidden' : ''}`}>
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-red-600 dark:text-red-400"
                      data-testid="button-clear-filters"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Name, location, specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    State
                  </label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger data-testid="select-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {indianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Filter */}
                {selectedState && availableCities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      City
                    </label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger data-testid="select-city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Cities</SelectItem>
                        {availableCities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Availability
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Advisors</SelectItem>
                      <SelectItem value="active">Active Now</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Services
                  </label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger data-testid="select-service">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Services</SelectItem>
                      {commonServices.map(service => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400">
                  {isLoading ? (
                    "Searching advisors..."
                  ) : (
                    `${filteredAdvisors.length} advisor${filteredAdvisors.length !== 1 ? 's' : ''} found`
                  )}
                </p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  data-testid="button-refresh"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <Alert className="mb-6">
                <AlertDescription>
                  Failed to load advisors. Please try again later.
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredAdvisors.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No advisors found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Try adjusting your search criteria or filters.
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearAllFilters} data-testid="button-clear-empty-state">
                    Clear all filters
                  </Button>
                )}
              </div>
            )}

            {/* Advisor Cards */}
            {!isLoading && filteredAdvisors.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAdvisors.map((advisor) => (
                  <Card key={advisor.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200" data-testid={`card-advisor-${advisor.id}`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={advisor.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {advisor.firstName?.[0]}{advisor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {advisor.firstName} {advisor.lastName}
                          </h3>
                          
                          {advisor.company && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {advisor.company}
                            </p>
                          )}
                          
                          <div className="flex items-center mt-1">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(advisor)}`}
                              data-testid={`status-${advisor.id}`}
                            >
                              {getStatusText(advisor)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Location & Registration */}
                      <div className="space-y-2 mb-4">
                        {(advisor.city || advisor.state) && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {[advisor.city, advisor.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">SEBI Reg: {advisor.sebiRegNo}</span>
                        </div>
                        
                        {(advisor.experienceYears ?? 0) > 0 && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Star className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{advisor.experienceYears} years experience</span>
                          </div>
                        )}
                      </div>

                      {/* Specializations */}
                      {Array.isArray(advisor.specializations) && advisor.specializations.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {advisor.specializations.slice(0, 3).map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {advisor.specializations.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{advisor.specializations.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Buttons */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {advisor.displayPhone && advisor.whatsappNumber && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleWhatsAppContact(advisor)}
                              data-testid={`button-whatsapp-${advisor.id}`}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          
                          {advisor.displayPhone && (advisor.professionalPhone || advisor.phone) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handlePhoneCall(advisor)}
                              data-testid={`button-phone-${advisor.id}`}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleMessage(advisor)}
                            data-testid={`button-message-${advisor.id}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </div>
                        
                        {/* Privacy Notice */}
                        {!advisor.displayPhone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                            Contact via message only - advisor privacy preferences
                          </div>
                        )}
                      </div>

                      {/* Website Link */}
                      {advisor.website && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <a
                            href={advisor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            data-testid={`link-website-${advisor.id}`}
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Visit Website
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}