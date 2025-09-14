import { useState, useEffect } from "react";
import { Phone, Mail, Globe, Search, AlertTriangle, Star, MapPin, CheckCircle, Shield, Clock, Users, MessageCircle, TrendingUp, ArrowLeft } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { InvestmentAdvisor } from "@shared/schema";
import { useSEO } from "@/hooks/useSEO";

interface SebiRiaProps {
  onBack: () => void;
}

// Internal Components
interface HeroSectionProps {
  onPrimaryClick: () => void;
  advisorCount: number;
}

function HeroSection({ onPrimaryClick, advisorCount }: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Talk to India's Top <br />
          <span className="text-orange-300">Investment Advisors</span>
        </h1>
        <p className="text-lg md:text-xl mb-2 text-blue-100">
          Get expert advice from SEBI-registered professionals.
        </p>
        <p className="text-xl md:text-2xl font-semibold mb-6 text-orange-300">
          First consultation FREE!
        </p>
        <Button 
          onClick={onPrimaryClick}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-8 py-3 text-lg font-semibold rounded-full mb-6 w-full sm:w-auto whitespace-normal break-words leading-snug text-center"
          data-testid="hero-start-consulting"
        >
          🎯 Available Now - Start Consulting!
        </Button>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>SEBI Registered</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <span>Verified Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SearchFiltersProps {
  searchQuery: string;
  selectedCity: string;
  selectedSpecialization: string;
  onSearchChange: (query: string) => void;
  onCityChange: (city: string) => void;
  onSpecializationChange: (spec: string) => void;
  cities: string[];
  specializations: string[];
}

function SearchFilters({ 
  searchQuery, 
  selectedCity, 
  selectedSpecialization,
  onSearchChange, 
  onCityChange, 
  onSpecializationChange,
  cities,
  specializations 
}: SearchFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-6 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by advisor name, specialization..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 py-3 text-lg"
            data-testid="search-advisors"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger data-testid="select-city">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Cities</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSpecialization} onValueChange={onSpecializationChange}>
            <SelectTrigger data-testid="select-specialization">
              <SelectValue placeholder="All Specializations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Specializations</SelectItem>
              {specializations.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold"
          data-testid="search-advisors-button"
        >
          Search Advisors
        </Button>
      </div>
    </div>
  );
}

function TopAdvisorsBadge() {
  return (
    <div className="flex justify-center mb-6">
      <Badge className="bg-green-500 text-white px-3 py-2 text-sm font-medium max-w-full whitespace-normal break-words text-center">
        🔥 Top SEBI Advisors Available Now
      </Badge>
    </div>
  );
}

function ConsultationHeader() {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Start Your Free Consultation
      </h2>
      <p className="text-gray-600 dark:text-gray-300 text-lg">
        Chat with these verified experts right now!
      </p>
    </div>
  );
}

interface SpecializationPillsProps {
  specializations: string[];
  activeSpecialization: string;
  onSelect: (spec: string) => void;
}

function SpecializationPills({ specializations, activeSpecialization, onSelect }: SpecializationPillsProps) {
  const topSpecializations = ["All Specializations", "Equity", "Mutual Funds", "Insurance", "Tax Planning", "Retirement"];
  
  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {topSpecializations.map(spec => (
        <Button
          key={spec}
          variant={activeSpecialization === spec ? "default" : "outline"}
          onClick={() => onSelect(spec === "All Specializations" ? "All" : spec)}
          className={`${activeSpecialization === spec ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300'} 
                     ${spec === "Equity" || spec === "Mutual Funds" || spec === "Retirement" ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}
                     px-4 py-2 text-sm font-medium rounded-full`}
          data-testid={`specialization-${spec.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {spec}
        </Button>
      ))}
    </div>
  );
}

interface EnhancedAdvisorCardProps {
  advisor: InvestmentAdvisor;
  index: number;
}

function EnhancedAdvisorCard({ advisor, index }: EnhancedAdvisorCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const handleContact = (type: 'phone' | 'whatsapp' | 'email', advisor: InvestmentAdvisor) => {
    if (type === 'phone' && advisor.phone) {
      window.open(`tel:${advisor.phone}`, '_self');
    } else if (type === 'whatsapp' && advisor.phone) {
      const cleanPhone = advisor.phone.replace(/\D/g, '');
      const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      window.open(`https://wa.me/${phoneWithCountry}`, '_blank', 'noopener,noreferrer');
    } else if (type === 'email' && advisor.email) {
      window.open(`mailto:${advisor.email}`, '_self');
    }
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {getInitials(advisor.name)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
              {advisor.name}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              {advisor.rating && (
                <div className="flex items-center gap-1">
                  <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{advisor.rating}</span>
                </div>
              )}
              <Badge className="bg-blue-100 text-blue-800 text-xs">Available</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {advisor.designation} {advisor.company && ` • ${advisor.company}`}
            </p>
            {advisor.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                {advisor.location}
              </div>
            )}
          </div>
        </div>
        
        {advisor.specialization && (
          <div className="mb-4">
            <Badge variant="secondary" className="text-xs">
              {advisor.specialization}
            </Badge>
          </div>
        )}
        
        <div className="space-y-2">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium whitespace-normal break-words leading-snug"
            onClick={() => handleContact('phone', advisor)}
            disabled={!advisor.phone}
            data-testid={`start-consultation-${index}`}
          >
            💬 Start free consultation
          </Button>
          <Button 
            variant="outline"
            className="w-full py-2 text-sm whitespace-normal break-words leading-snug"
            onClick={() => handleContact('whatsapp', advisor)}
            disabled={!advisor.phone}
            data-testid={`chat-advisor-${index}`}
          >
            💬 Chat with advisor
          </Button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            First consultation free
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function HowItWorksSection() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            How InvestConnect Works
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Get expert investment advice in just 3 simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              1. Find Your Advisor
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Search and filter from hundreds of SEBI-registered investment advisors based on specialization, location, and ratings.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              2. Complete Risk Assessment
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Fill out a comprehensive risk assessment form to help your advisor understand your financial goals and risk tolerance.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              3. Get Expert Advice
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Start with a free consultation, then continue with affordable sessions at ₹100 per 5 minutes for personalized investment guidance.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-3 text-lg font-semibold w-full sm:w-auto whitespace-normal break-words leading-snug text-center"
            data-testid="how-it-works-cta"
          >
            Start Your Investment Journey
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SebiRiaNew({ onBack }: SebiRiaProps) {
  // SEO setup
  useSEO({
    title: "SEBI RIA Directory – Find Registered Investment Advisors | StocksShorts",
    description: "Connect with SEBI-registered investment advisors. Get expert financial advice, portfolio management, and investment planning. First consultation FREE!",
    keywords: "SEBI RIA, investment advisors, financial planning, portfolio management, investment advice India"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
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
  const cities = ["All", ...Array.from(new Set(advisors.map(advisor => advisor.location).filter((city): city is string => Boolean(city))))];

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) => {
    const matchesSearch = !searchQuery || 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialization = selectedSpecialization === "All" || advisor.specialization === selectedSpecialization;
    const matchesCity = selectedCity === "All" || advisor.location === selectedCity;
    
    return matchesSearch && matchesSpecialization && matchesCity;
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

  const scrollToSearch = () => {
    const searchElement = document.querySelector('[data-testid="search-advisors"]');
    if (searchElement) {
      searchElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">InvestConnect</h1>
        <div className="w-10" />
      </div>

      {/* Hero Section */}
      <HeroSection onPrimaryClick={scrollToSearch} advisorCount={advisors.length} />

      {/* Search Filters */}
      <SearchFilters 
        searchQuery={searchQuery}
        selectedCity={selectedCity}
        selectedSpecialization={selectedSpecialization}
        onSearchChange={setSearchQuery}
        onCityChange={setSelectedCity}
        onSpecializationChange={setSelectedSpecialization}
        cities={cities}
        specializations={specializations}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <TopAdvisorsBadge />
        <ConsultationHeader />
        <SpecializationPills 
          specializations={specializations}
          activeSpecialization={selectedSpecialization}
          onSelect={setSelectedSpecialization}
        />

        {/* Compact Disclaimer */}
        <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Contact details not verified - verify SEBI registration independently
          </p>
        </div>

        {/* Results */}
        {sortedAdvisors.length === 0 ? (
          <div className="text-center py-12">
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
                setSelectedCity("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 mb-12">
            {sortedAdvisors.map((advisor: InvestmentAdvisor, index: number) => (
              <EnhancedAdvisorCard key={advisor.id} advisor={advisor} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <HowItWorksSection />
    </div>
  );
}