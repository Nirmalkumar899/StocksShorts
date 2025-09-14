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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvestmentAdvisor, InsertInvestmentAdvisor } from "@shared/schema";
import { insertInvestmentAdvisorSchema, INDIAN_STATES, QUALIFICATIONS, SPECIALIZATIONS, SERVICES_OFFERED, INDIAN_LANGUAGES } from "@shared/schema";

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
  const { toast } = useToast();

  // Form setup with validation
  const form = useForm<InsertInvestmentAdvisor>({
    resolver: zodResolver(insertInvestmentAdvisorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      sebiRegistrationNumber: '',
      companyName: '',
      qualification: '',
      experience: 1,
      yearsInBusiness: 0,
      officeAddress: '',
      city: '',
      state: '',
      pincode: '',
      professionalPhone: '',
      websiteUrl: '',
      linkedinProfile: '',
      articleLinks: [],
      socialMediaLinks: [],
      specializations: [],
      servicesOffered: [],
      languagesSpoken: [],
      aboutYou: '',
      consultationFee: 100,
      acceptTerms: false,
      acceptPrivacy: false,
      acceptDisclaimer: false,
      availableForConsultations: true,
    },
  });

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (data: InsertInvestmentAdvisor) => {
      return apiRequest('/api/investment-advisors', 'POST', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Submitted Successfully!",
        description: "Your advisor registration has been submitted for review. You will be notified once approved.",
      });
      setShowRegistrationForm(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/investment-advisors'] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "There was an error submitting your registration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertInvestmentAdvisor) => {
    // Add dynamic arrays to form data
    const formData = {
      ...data,
      articleLinks: articleLinks.filter(link => link.trim() !== ''),
      socialMediaLinks: socialLinks.filter(link => link.trim() !== ''),
    };
    registrationMutation.mutate(formData);
  };

  const { data: advisors = [], isLoading } = useQuery<InvestmentAdvisor[]>({
    queryKey: ['/api/investment-advisors'],
  });

  const filteredAdvisors = advisors.filter((advisor: InvestmentAdvisor) => {
    const matchesSearch = !searchQuery || 
      (advisor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    return (name || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      {/* Header - Clean Design */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">SEBI Registered Investment Advisors</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect with qualified financial experts</p>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => setShowRegistrationForm(true)}
            data-testid="button-join-as-advisor"
          >
            <Plus className="h-4 w-4 mr-2" />
            Join as Investment Advisor
          </Button>
        </div>
      </div>
      
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Register as an Investment Advisor</DialogTitle>
                <DialogDescription>
                  Join our platform and start connecting with investors looking for professional guidance.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4"
                      data-testid="advisor-registration-form">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your first name" 
                                data-testid="input-first-name"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Your legal first name as per official documents</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your last name" 
                                data-testid="input-last-name"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Your legal last name as per official documents</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email address" 
                              data-testid="input-email"
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">We'll use this email to communicate about your registration and account</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Professional Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sebiRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEBI Registration Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your SEBI registration number" 
                              data-testid="input-sebi-number"
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Your unique SEBI registration identifier</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Firm Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your company name" 
                              data-testid="input-company-name"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Name of your advisory firm (if applicable)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualification</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger data-testid="select-qualification">
                                <SelectValue placeholder="SEBI Registered Investment Advisor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sebi-ria">SEBI Registered Investment Advisor</SelectItem>
                              <SelectItem value="cfa">CFA</SelectItem>
                              <SelectItem value="cfp">CFP</SelectItem>
                              <SelectItem value="ca">Chartered Accountant</SelectItem>
                              <SelectItem value="cs">Company Secretary</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">Your professional qualifications and certifications</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience (Years) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                data-testid="input-experience-years"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Total years of experience in financial advisory</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="yearsInBusiness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years in Business</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter years in business" 
                                data-testid="input-years-business"
                                {...field}
                                value={field.value?.toString() || ''}
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">How long have you been running your advisory business</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    <FormField
                      control={form.control}
                      name="officeAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your office street address" 
                              data-testid="input-office-address"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Complete street address of your office</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your city" 
                                data-testid="input-city"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                              <FormControl>
                                <SelectTrigger data-testid="select-state">
                                  <SelectValue placeholder="Select your state" />
                                </SelectTrigger>
                              </FormControl>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter 6-digit pincode" 
                                maxLength={6}
                                data-testid="input-pincode"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="professionalPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Phone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter 10-digit phone number" 
                                data-testid="input-professional-phone"
                                {...field} 
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">Professional contact number for client communication</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://your-website.com" 
                              data-testid="input-website"
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Your professional website or business page</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedinProfile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn Profile</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://linkedin.com/in/your-profile" 
                              data-testid="input-linkedin"
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Your professional LinkedIn profile URL</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <Label className="text-base font-medium">Article Links</Label>
                      <p className="text-xs text-gray-500 mb-3">Add links to your published articles, blogs, or research papers</p>
                      {articleLinks.map((link, index) => (
                        <div key={index} className="flex gap-2 mb-2">
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
                      <Label className="text-base font-medium">Social Media Links</Label>
                      <p className="text-xs text-gray-500 mb-3">Add links to your professional social media profiles</p>
                      {socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2 mb-2">
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
                    <FormField
                      control={form.control}
                      name="specializations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Specializations *</FormLabel>
                          <p className="text-xs text-gray-500 mb-3">Select all areas where you provide advisory services</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Equity Markets', 'Mutual Funds', 'Fixed Deposits', 'Insurance Planning',
                              'Retirement Planning', 'Tax Planning', 'Portfolio Management', 'Risk Assessment',
                              'Commodity Trading', 'Debt Securities', 'Real Estate Investment', 'Financial Planning'
                            ].map((spec) => (
                              <FormItem key={spec} className="flex items-start gap-2">
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-specialization-${spec.toLowerCase().replace(/ /g, '-')}`}
                                    checked={field.value?.includes(spec)}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...(field.value || []), spec]
                                        : (field.value || []).filter((v) => v !== spec);
                                      field.onChange(next);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">{spec}</FormLabel>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="servicesOffered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Services Offered *</FormLabel>
                          <p className="text-xs text-gray-500 mb-3">Select all types of services you provide to clients</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'Investment Planning', 'Portfolio Review', 'Risk Assessment', 'Retirement Planning',
                              'Tax Planning', 'Insurance Consultation', 'Estate Planning', 'Debt Management',
                              'Goal-based Planning', 'SIP Advisory', 'Mutual Fund Selection', 'Stock Research'
                            ].map((service) => (
                              <FormItem key={service} className="flex items-start gap-2">
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-service-${service.toLowerCase().replace(/ /g, '-')}`}
                                    checked={field.value?.includes(service)}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...(field.value || []), service]
                                        : (field.value || []).filter((v) => v !== service);
                                      field.onChange(next);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">{service}</FormLabel>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="languagesSpoken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Languages Spoken *</FormLabel>
                          <p className="text-xs text-gray-500 mb-3">Select all languages you can communicate in with clients</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
                              'Gujarati', 'Urdu', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese'
                            ].map((language) => (
                              <FormItem key={language} className="flex items-start gap-2">
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-language-${language.toLowerCase()}`}
                                    checked={field.value?.includes(language)}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...(field.value || []), language]
                                        : (field.value || []).filter((v) => v !== language);
                                      field.onChange(next);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm">{language}</FormLabel>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aboutYou"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About You *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell potential clients about your expertise, approach, and what makes you unique..." 
                              rows={4}
                              maxLength={1000}
                              data-testid="textarea-about-you"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Describe your investment philosophy and services (10-1000 characters)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="consultationFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consultation Fee (₹) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100.00" 
                              min="0" 
                              max="10000"
                              data-testid="input-consultation-fee"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-gray-500">Your fee per consultation session (₹0-10,000)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Legal Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Legal Requirements
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              className="mt-1"
                              data-testid="checkbox-accept-terms"
                            />
                          </FormControl>
                          <div>
                            <FormLabel className="text-sm font-medium">I accept the Terms & Conditions *</FormLabel>
                            <p className="text-xs text-gray-500">By checking this box, you agree to our platform's terms of service and user agreement.</p>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acceptPrivacy"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              className="mt-1"
                              data-testid="checkbox-accept-privacy"
                            />
                          </FormControl>
                          <div>
                            <FormLabel className="text-sm font-medium">I accept the Data Processing/Privacy Policy *</FormLabel>
                            <p className="text-xs text-gray-500">You consent to the collection, processing, and storage of your personal and professional data for platform operations.</p>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acceptDisclaimer"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <Checkbox 
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              className="mt-1"
                              data-testid="checkbox-accept-disclaimer"
                            />
                          </FormControl>
                          <div>
                            <FormLabel className="text-sm font-medium">I acknowledge the Professional Disclaimer *</FormLabel>
                            <p className="text-xs text-gray-500">I understand that all investment advice should be personalized and that past performance does not guarantee future results. I will provide advice in accordance with SEBI guidelines.</p>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Availability
                  </h3>
                  <FormField
                    control={form.control}
                    name="availableForConsultations"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <FormLabel className="text-base font-medium">Available for Consultations</FormLabel>
                            <p className="text-xs text-gray-500">Toggle your availability for new consultation requests</p>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                              data-testid="switch-availability"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowRegistrationForm(false)}
                    data-testid="button-cancel-registration"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={registrationMutation.isPending}
                    data-testid="button-submit-registration"
                  >
                    {registrationMutation.isPending ? 'Submitting...' : 'Register as Advisor'}
                  </Button>
                </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

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
        <div className="bg-white dark:bg-gray-900 p-3">
          <div className="flex items-center justify-between text-center">
            <div className="flex-1">
              <div className="bg-green-50 dark:bg-green-900 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-green-800 dark:text-green-200">SEBI Verified</p>
              </div>
            </div>
            <div className="flex-1 mx-2">
              <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded-lg">
                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Video Calls</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-orange-50 dark:bg-orange-900 p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-orange-800 dark:text-orange-200">WhatsApp Chat</p>
              </div>
            </div>
          </div>
        </div>

        {/* Advisors List */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Advisors ({filteredAdvisors.length})
            </h2>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredAdvisors.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No advisors found matching your criteria</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search filters</p>
              </div>
            ) : (
              filteredAdvisors.map((advisor: InvestmentAdvisor) => (
                <Card key={advisor.id} className="border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className={`w-12 h-12 ${getRandomColor()} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                        {getAdvisorInitials(advisor.name || 'Unknown')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-1">
                            {advisor.name}
                          </h3>
                          <div className="flex items-center gap-1 mb-1">
                            <Shield className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">SEBI Registered</span>
                          </div>
                          {advisor.location && (
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{advisor.location}</span>
                            </div>
                          )}
                          {advisor.experience && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">{advisor.experience} years exp</span>
                            </div>
                          )}
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
  );
}