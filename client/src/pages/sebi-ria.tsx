import React, { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Mail, Globe, ArrowLeft, Shield, AlertTriangle, CheckCircle, Video, MessageCircle, Plus, Upload, User, ExternalLink, Clock, Users, X } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  const [articleLinks, setArticleLinks] = useState<string[]>(['']);
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  const [availableForConsultations, setAvailableForConsultations] = useState(true);
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
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center flex-1">
            Join as SEBI registered investor advisor
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
              Login
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => setShowRegistrationForm(true)}
            >
              Sign Up
            </Button>
          </div>
          <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden">
                <Plus className="h-4 w-4 mr-1" />
                Join as RIA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Register as an Investment Advisor</DialogTitle>
                <DialogDescription>
                  Join our platform and start connecting with investors looking for professional guidance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" placeholder="Enter your first name" />
                        <p className="text-xs text-gray-500 mt-1">Your legal first name as per official documents</p>
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" placeholder="Enter your last name" />
                        <p className="text-xs text-gray-500 mt-1">Your legal last name as per official documents</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" placeholder="Enter your email address" />
                      <p className="text-xs text-gray-500 mt-1">We'll use this email to communicate about your registration and account</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Professional Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sebiNumber">SEBI Registration Number *</Label>
                      <Input id="sebiNumber" placeholder="Enter your SEBI registration number" />
                      <p className="text-xs text-gray-500 mt-1">Your unique SEBI registration identifier</p>
                    </div>
                    <div>
                      <Label htmlFor="companyName">Company/Firm Name</Label>
                      <Input id="companyName" placeholder="Enter your company name" />
                      <p className="text-xs text-gray-500 mt-1">Name of your advisory firm (if applicable)</p>
                    </div>
                    <div>
                      <Label htmlFor="qualification">Qualification</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="SEBI Registered Investment Advisor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sebi-ria">SEBI Registered Investment Advisor</SelectItem>
                          <SelectItem value="cfa">CFA</SelectItem>
                          <SelectItem value="cfp">CFP</SelectItem>
                          <SelectItem value="ca">Chartered Accountant</SelectItem>
                          <SelectItem value="cs">Company Secretary</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">Your professional qualifications and certifications</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="experience">Experience (Years) *</Label>
                        <Input id="experience" type="number" placeholder="1" />
                        <p className="text-xs text-gray-500 mt-1">Total years of experience in financial advisory</p>
                      </div>
                      <div>
                        <Label htmlFor="yearsInBusiness">Years in Business</Label>
                        <Input id="yearsInBusiness" type="number" placeholder="Enter years in business" />
                        <p className="text-xs text-gray-500 mt-1">How long have you been running your advisory business</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Office Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Office Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="officeAddress">Office Address</Label>
                      <Input id="officeAddress" placeholder="Enter your office street address" />
                      <p className="text-xs text-gray-500 mt-1">Complete street address of your office</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="Enter your city" />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                            <SelectItem value="delhi">Delhi</SelectItem>
                            <SelectItem value="gujarat">Gujarat</SelectItem>
                            <SelectItem value="karnataka">Karnataka</SelectItem>
                            <SelectItem value="maharashtra">Maharashtra</SelectItem>
                            <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                            <SelectItem value="telangana">Telangana</SelectItem>
                            <SelectItem value="west-bengal">West Bengal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input id="pincode" placeholder="Enter 6-digit pincode" maxLength={6} />
                      </div>
                      <div>
                        <Label htmlFor="professionalPhone">Professional Phone</Label>
                        <Input id="professionalPhone" placeholder="Enter 10-digit phone number" />
                        <p className="text-xs text-gray-500 mt-1">Professional contact number for client communication</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Online Presence
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="website">Website URL</Label>
                      <Input id="website" placeholder="https://your-website.com" />
                      <p className="text-xs text-gray-500 mt-1">Your professional website or business page</p>
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <Input id="linkedin" placeholder="https://linkedin.com/in/yourprofile" />
                      <p className="text-xs text-gray-500 mt-1">Your LinkedIn professional profile</p>
                    </div>
                    <div>
                      <Label>Articles/Blog Links</Label>
                      <p className="text-xs text-gray-500 mb-2">Add links to your published articles, blog posts, or research papers</p>
                      {articleLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...articleLinks];
                              newLinks[index] = e.target.value;
                              setArticleLinks(newLinks);
                            }}
                            placeholder="https://example.com/your-article"
                          />
                          {articleLinks.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLinks = articleLinks.filter((_, i) => i !== index);
                                setArticleLinks(newLinks);
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setArticleLinks([...articleLinks, ''])}
                      >
                        Add Article Link
                      </Button>
                    </div>
                    <div>
                      <Label>Other Social Media Links</Label>
                      <p className="text-xs text-gray-500 mb-2">Add links to your professional social media profiles (Twitter, YouTube, etc.)</p>
                      {socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...socialLinks];
                              newLinks[index] = e.target.value;
                              setSocialLinks(newLinks);
                            }}
                            placeholder="https://example.com/your-profile"
                          />
                          {socialLinks.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newLinks = socialLinks.filter((_, i) => i !== index);
                                setSocialLinks(newLinks);
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSocialLinks([...socialLinks, ''])}
                      >
                        Add Social Media Link
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Professional Services */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Professional Services
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium">Specializations *</Label>
                      <p className="text-xs text-gray-500 mb-3">Select all areas where you provide advisory services</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          'Equity Markets', 'Mutual Funds', 'Fixed Deposits', 'Insurance Planning',
                          'Retirement Planning', 'Tax Planning', 'Portfolio Management', 'Risk Assessment',
                          'Commodity Trading', 'Debt Securities', 'Real Estate Investment', 'Financial Planning'
                        ].map((spec) => (
                          <div key={spec} className="flex items-center space-x-2">
                            <Checkbox id={`spec-${spec}`} />
                            <Label htmlFor={`spec-${spec}`} className="text-sm">{spec}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium">Services Offered *</Label>
                      <p className="text-xs text-gray-500 mb-3">Select all types of services you provide to clients</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          'Investment Planning', 'Portfolio Review', 'Risk Assessment', 'Retirement Planning',
                          'Tax Planning', 'Insurance Consultation', 'Estate Planning', 'Debt Management',
                          'Goal-based Planning', 'SIP Advisory', 'Mutual Fund Selection', 'Stock Research'
                        ].map((service) => (
                          <div key={service} className="flex items-center space-x-2">
                            <Checkbox id={`service-${service}`} />
                            <Label htmlFor={`service-${service}`} className="text-sm">{service}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium">Languages Spoken *</Label>
                      <p className="text-xs text-gray-500 mb-3">Select all languages you can communicate in with clients</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
                          'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese'
                        ].map((language) => (
                          <div key={language} className="flex items-center space-x-2">
                            <Checkbox id={`lang-${language}`} />
                            <Label htmlFor={`lang-${language}`} className="text-sm">{language}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="aboutYou">About You *</Label>
                      <Textarea 
                        id="aboutYou" 
                        placeholder="Tell potential clients about your expertise, approach, and what makes you unique..." 
                        rows={4}
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">Describe your investment philosophy and services (10-1000 characters)</p>
                    </div>

                    <div>
                      <Label htmlFor="consultationFee">Consultation Fee (₹) *</Label>
                      <Input id="consultationFee" type="number" placeholder="100.00" min="0" max="10000" />
                      <p className="text-xs text-gray-500 mt-1">Your fee per consultation session (₹0-10,000)</p>
                    </div>
                  </div>
                </div>

                {/* Legal Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Legal Requirements
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox id="terms" className="mt-1" />
                      <div>
                        <Label htmlFor="terms" className="text-sm font-medium">I accept the Terms & Conditions *</Label>
                        <p className="text-xs text-gray-500">By checking this box, you agree to our platform's terms of service and user agreement.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="privacy" className="mt-1" />
                      <div>
                        <Label htmlFor="privacy" className="text-sm font-medium">I accept the Data Processing/Privacy Policy *</Label>
                        <p className="text-xs text-gray-500">You consent to the collection, processing, and storage of your personal and professional data for platform operations.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="disclaimer" className="mt-1" />
                      <div>
                        <Label htmlFor="disclaimer" className="text-sm font-medium">I acknowledge the Professional Disclaimer *</Label>
                        <p className="text-xs text-gray-500">I understand that all investment advice should be personalized and that past performance does not guarantee future results. I will provide advice in accordance with SEBI guidelines.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Availability
                  </h3>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Available for Consultations</Label>
                      <p className="text-xs text-gray-500">Toggle your availability for new consultation requests</p>
                    </div>
                    <Switch 
                      checked={availableForConsultations} 
                      onCheckedChange={setAvailableForConsultations}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                    Register as Advisor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Hero Section - InvestConnect Style */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-teal-500 text-white p-4 relative overflow-hidden">
          <div className="relative z-10 text-center max-w-full">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 px-2">
              Talk to India's Top
            </h1>
            <h1 className="text-2xl sm:text-3xl font-bold text-orange-400 mb-4 px-2">
              Investment Advisors
            </h1>
            <p className="text-blue-100 text-base sm:text-lg mb-2 px-2">
              Get expert advice from SEBI-registered professionals.
            </p>
            <p className="text-orange-300 font-semibold text-lg sm:text-xl mb-4 px-2">
              First consultation FREE!
            </p>
            
            <div className="px-2 mb-4">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 text-sm font-semibold rounded-full shadow-lg w-auto min-w-0 whitespace-nowrap">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Available Now - Start Consulting in 2 Minutes!</span>
              </Button>
            </div>

            {/* Search Section */}
            <div className="mx-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 max-w-xs mx-auto">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search by advisor name, specialization..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-3 py-2 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30 text-sm w-full"
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
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 font-semibold text-sm"
                  >
                    Search
                  </Button>
                </div>
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