import React, { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Shield, AlertTriangle, CheckCircle, Video, MessageCircle, Plus, Upload, User, ExternalLink, Clock, Users } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvestmentAdvisor, InsertInvestmentAdvisor } from "@shared/schema";

interface SebiRiaProps {
  onBack: () => void;
}

export default function SebiRia({ onBack }: SebiRiaProps) {
  console.log('🎯 SEBI RIA v6.0 INVESTCONNECT STYLE INTERFACE! 🚀');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const { toast } = useToast();

  const { data: advisors = [], isLoading } = useQuery<InvestmentAdvisor[]>({
    queryKey: ['/api/investment-advisors'],
  });

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) => {
    const matchesSearch = !searchQuery || 
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === "all" || 
      (advisor.location || '').toLowerCase().includes(selectedCity.toLowerCase());
    
    const matchesSpecialization = selectedSpecialization === "all" || 
      (advisor.specialization || '').toLowerCase().includes(selectedSpecialization.toLowerCase());

    return matchesSearch && matchesCity && matchesSpecialization;
  });

  const specializations = [
    "All Specializations",
    "Equity",
    "Mutual Funds", 
    "Insurance",
    "Tax Planning",
    "Retirement",
    "Portfolio Management",
    "Wealth Management"
  ];

  const getAdvisorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = () => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Loading...</h1>
          <div className="w-9" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header - InvestConnect Style */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Join as SEBI registered investment advisor
          </div>
          <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Join as RIA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Join as SEBI Registered Investment Advisor</DialogTitle>
                <DialogDescription>
                  Create your professional profile and start connecting with investors
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="Your full name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <Label htmlFor="sebi">SEBI RIA Registration Number *</Label>
                    <Input id="sebi" placeholder="INA000000000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company Name *</Label>
                    <Input id="company" placeholder="Your company" />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation *</Label>
                    <Input id="designation" placeholder="Investment Advisor" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="tax-planning">Tax Planning</SelectItem>
                        <SelectItem value="retirement">Retirement Planning</SelectItem>
                        <SelectItem value="portfolio">Portfolio Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input id="location" placeholder="Mumbai, Delhi, etc." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input id="experience" placeholder="5" />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://yourwebsite.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input id="linkedin" placeholder="https://linkedin.com/in/yourprofile" />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter Profile</Label>
                    <Input id="twitter" placeholder="https://twitter.com/yourhandle" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="qualification">Professional Qualifications</Label>
                  <Input id="qualification" placeholder="CFA, CFP, etc." />
                </div>
                <div>
                  <Label htmlFor="about">About You</Label>
                  <Textarea id="about" placeholder="Brief description about your expertise and investment philosophy..." rows={3} />
                </div>
                <div>
                  <Label htmlFor="profile-pic">Profile Picture</Label>
                  <Input id="profile-pic" type="file" accept="image/*" />
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Submit Application
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Hero Section - InvestConnect Style */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-teal-500 text-white p-6 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-bold mb-2">
              Talk to India's Top
            </h1>
            <h1 className="text-3xl font-bold text-orange-400 mb-4">
              Investment Advisors
            </h1>
            <p className="text-blue-100 text-lg mb-2">
              Get expert advice from SEBI-registered professionals.
            </p>
            <p className="text-orange-300 font-semibold text-xl mb-6">
              First consultation FREE!
            </p>
            
            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-base font-semibold rounded-full shadow-lg mb-6 max-w-full break-words">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="leading-tight">Start Consulting Now!</span>
            </Button>

            {/* Search Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-sm mx-auto w-full px-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search advisors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30 text-sm"
                  />
                </div>
                
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="pune">Pune</SelectItem>
                    <SelectItem value="chennai">Chennai</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={() => {}}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 font-semibold"
                >
                  Search Advisors
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="bg-teal-600 text-white py-4">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-1" />
              <p className="text-sm font-medium">SEBI</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-1" />
              <p className="text-sm font-medium">Verified</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-1" />
              <p className="text-sm font-medium">24/7</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
          <div className="p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Start Your Free Consultation
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Chat with these verified experts right now!
              </p>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {specializations.map((spec) => (
                <Button
                  key={spec}
                  variant={selectedSpecialization === spec.toLowerCase().replace(' ', '-') ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSpecialization(spec === "All Specializations" ? "all" : spec.toLowerCase().replace(' ', '-'))}
                  className={`rounded-full text-sm ${
                    selectedSpecialization === (spec === "All Specializations" ? "all" : spec.toLowerCase().replace(' ', '-'))
                      ? "bg-blue-500 text-white" 
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {spec}
                </Button>
              ))}
            </div>

            {/* Results Count */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              {filteredAdvisors.length} advisors found
            </p>

            {/* Advisor Cards */}
            <div className="space-y-4 max-w-2xl mx-auto">
              {filteredAdvisors.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">No advisors found</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAdvisors.slice(0, 20).map((advisor: InvestmentAdvisor) => (
                  <Card key={advisor.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Profile Picture */}
                        <div className={`w-16 h-16 rounded-full ${getRandomColor()} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                          {getAdvisorInitials(advisor.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                {advisor.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight truncate">
                                {advisor.company}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                  {advisor.rating || "0.0"}
                                </span>
                              </div>
                              <Badge variant="default" className="bg-blue-500 text-white text-xs">
                                Available
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {advisor.experience || "0"} years exp
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {advisor.location || "Remote"}
                            </div>
                          </div>

                          {advisor.specialization && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Specializes in:</p>
                              <Badge variant="secondary" className="text-xs truncate max-w-full">
                                {advisor.specialization}
                              </Badge>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white flex-1 min-w-0">
                              <MessageCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">WhatsApp Chat</span>
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 min-w-0">
                              <Video className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Video Call</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Bottom spacing for navigation */}
            <div className="pb-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}