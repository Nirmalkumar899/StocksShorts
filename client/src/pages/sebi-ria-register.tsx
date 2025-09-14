import { useState } from "react";
import { ArrowLeft, CheckCircle, Shield, AlertTriangle, User, Plus, Minus, FileText, MapPin, Globe, Users, Star, Phone } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

interface SebiRiaRegisterProps {
  onBack: () => void;
}

// Constants for form options
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Puducherry"
];

const qualificationOptions = [
  "SEBI Registered Investment Advisor",
  "Certified Financial Planner (CFP)",
  "Chartered Financial Analyst (CFA)",
  "Financial Risk Manager (FRM)",
  "Chartered Accountant (CA)",
  "Company Secretary (CS)",
  "Master of Business Administration (MBA) - Finance",
  "Post Graduate Diploma in Financial Management",
  "Other"
];

const specializationOptions = [
  "Equity Markets", "Mutual Funds", "Fixed Deposits", "Insurance Planning", 
  "Retirement Planning", "Tax Planning", "Portfolio Management", "Risk Assessment", 
  "Commodity Trading", "Debt Securities", "Real Estate Investment", "Financial Planning"
];

const servicesOptions = [
  "Investment Planning", "Portfolio Review", "Risk Assessment", "Retirement Planning", 
  "Tax Planning", "Insurance Consultation", "Estate Planning", "Debt Management", 
  "Goal-based Planning", "SIP Advisory", "Mutual Fund Selection", "Stock Research"
];

const languageOptions = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", 
  "Urdu", "Kannada", "Odia", "Malayalam", "Punjabi", "Assamese"
];

// Comprehensive validation schema
const registerSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name too long"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name too long"),
  email: z.string().email("Please enter a valid email address"),
  
  // Professional Information
  sebiRegNo: z.string().min(5, "SEBI registration number must be at least 5 characters").max(50, "Registration number too long"),
  company: z.string().max(100, "Company name too long").optional(),
  qualification: z.string().min(1, "Please select a qualification"),
  experienceYears: z.coerce.number().min(0, "Experience cannot be negative").max(50, "Experience cannot exceed 50 years"),
  yearsInBusiness: z.coerce.number().min(0, "Years in business cannot be negative").max(50, "Years in business cannot exceed 50 years").optional(),
  
  // Office Contact Information
  officeAddress: z.string().max(200, "Office address too long").optional(),
  city: z.string().max(50, "City name too long").optional(),
  state: z.string().max(50, "State name too long").optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").or(z.literal("")).optional(),
  professionalPhone: z.string().regex(/^(\+91[6-9]\d{9}|[6-9]\d{9})$/, "Please enter a valid 10-digit Indian mobile number (with or without +91)"),
  
  // Online Presence
  website: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  linkedinProfile: z.string().url("Please enter a valid LinkedIn URL").or(z.literal("")).optional(),
  articleLinks: z.array(z.object({
    url: z.string().url("Please enter a valid URL"),
    title: z.string().optional()
  })).default([]),
  socialMediaLinks: z.array(z.object({
    platform: z.string().min(1, "Platform name required"),
    url: z.string().url("Please enter a valid URL")
  })).default([]),
  
  // Professional Services
  specializations: z.array(z.string()).min(1, "Please select at least one specialization"),
  servicesOffered: z.array(z.string()).min(1, "Please select at least one service"),
  languagesSpoken: z.array(z.string()).min(1, "Please select at least one language"),
  
  // Additional Information
  aboutYou: z.string().min(10, "Please write at least 10 characters about yourself").max(1000, "Description too long"),
  consultationFee: z.coerce.number().min(0, "Fee cannot be negative").max(10000, "Fee cannot exceed ₹10,000"),
  
  // File Uploads (optional for now, URLs will be set after upload)
  profileImageUrl: z.string().optional(),
  sebiCertificateUrl: z.string().optional(),
  
  // Legal Requirements
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the Terms & Conditions"),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, "You must accept the Privacy Policy"),
  professionalDisclaimerAccepted: z.boolean().refine(val => val === true, "You must acknowledge the Professional Disclaimer"),
  
  // Availability
  availableForConsultations: z.boolean().default(true),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function SebiRiaRegister({ onBack }: SebiRiaRegisterProps) {
  useSEO({
    title: "Register as SEBI Investment Advisor | StocksShorts",
    description: "Register as a SEBI-certified investment advisor. Join our network of verified financial professionals and connect with potential clients.",
    keywords: "SEBI registration, investment advisor, financial professional, RIA registration"
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      // Personal Information
      firstName: "",
      lastName: "",
      email: "",
      
      // Professional Information
      sebiRegNo: "",
      company: "",
      qualification: "SEBI Registered Investment Advisor",
      experienceYears: 0,
      yearsInBusiness: 0,
      
      // Office Contact Information
      officeAddress: "",
      city: "",
      state: "",
      pincode: "",
      professionalPhone: "",
      
      // Online Presence
      website: "",
      linkedinProfile: "",
      articleLinks: [],
      socialMediaLinks: [],
      
      // Professional Services
      specializations: [],
      servicesOffered: [],
      languagesSpoken: [],
      
      // Additional Information
      aboutYou: "",
      consultationFee: 100,
      
      // File Uploads
      profileImageUrl: "",
      sebiCertificateUrl: "",
      
      // Legal Requirements
      termsAccepted: false,
      privacyPolicyAccepted: false,
      professionalDisclaimerAccepted: false,
      
      // Availability
      availableForConsultations: true,
    },
  });

  // Field arrays for dynamic inputs
  const { 
    fields: articleFields, 
    append: appendArticle, 
    remove: removeArticle 
  } = useFieldArray({
    control: form.control,
    name: "articleLinks"
  });

  const { 
    fields: socialFields, 
    append: appendSocial, 
    remove: removeSocial 
  } = useFieldArray({
    control: form.control,
    name: "socialMediaLinks"
  });

  const sendOtpMutation = useMutation({
    mutationFn: (phoneNumber: string) => apiRequest("POST", "/api/auth/send-otp", { phoneNumber }),
    onSuccess: () => {
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ phoneNumber, otp }: { phoneNumber: string; otp: string }) => 
      apiRequest("POST", "/api/auth/verify-otp", { phoneNumber, otp }),
    onSuccess: () => {
      setOtpVerified(true);
      setVerifyingOtp(false);
      toast({
        title: "OTP Verified",
        description: "Phone number verified successfully.",
      });
    },
    onError: (error: any) => {
      setVerifyingOtp(false);
      toast({
        title: "Error",
        description: error?.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => apiRequest("POST", "/api/investment-advisors", data),
    onSuccess: () => {
      setIsSuccess(true);
      // Invalidate investment advisors cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/investment-advisors'] });
      // Clear form
      form.reset();
      // Navigate back after 3 seconds
      setTimeout(() => {
        onBack();
      }, 3000);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Error",
        description: error?.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendOtp = () => {
    const phoneNumber = form.getValues("professionalPhone");
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter your phone number first.",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate(phoneNumber);
  };

  const handleVerifyOtp = () => {
    const phoneNumber = form.getValues("professionalPhone");
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP.",
        variant: "destructive",
      });
      return;
    }
    setVerifyingOtp(true);
    verifyOtpMutation.mutate({ phoneNumber, otp });
  };

  const onSubmit = (data: RegisterFormData) => {
    if (!otpVerified) {
      toast({
        title: "Error",
        description: "Please verify your phone number with OTP first.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your SEBI advisor profile has been created successfully. You will be redirected to the directory shortly.
            </p>
            <Button onClick={onBack} className="w-full" data-testid="back-to-directory">
              Back to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} data-testid="back-button">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Directory
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">SEBI Registration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <User className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Register as SEBI Investment Advisor - NEW VERSION
          </h1>
          <p className="text-lg text-blue-100">
            Join our network of verified financial professionals
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Registration Form
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please fill in all required information to create your advisor profile.
            </p>
          </CardHeader>
          <CardContent>
            {registerMutation.error && (
              <Alert variant="destructive" className="mb-6" data-testid="error-alert">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {registerMutation.error instanceof Error 
                    ? registerMutation.error.message 
                    : "Registration failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* PERSONAL INFORMATION SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Personal Information
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter first name"
                              {...field}
                              data-testid="input-first-name"
                            />
                          </FormControl>
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
                              placeholder="Enter last name"
                              {...field}
                              data-testid="input-last-name"
                            />
                          </FormControl>
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
                            placeholder="your.email@example.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* PROFESSIONAL INFORMATION SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <Star className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Professional Information
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="sebiRegNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEBI Registration Number *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., INA123456789"
                            {...field}
                            data-testid="input-sebi-reg-no"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company/Firm Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your company or firm name"
                            {...field}
                            data-testid="input-company"
                          />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-qualification">
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {qualificationOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="experienceYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience (Years) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              placeholder="5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-experience-years"
                            />
                          </FormControl>
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
                              min="0"
                              max="50"
                              placeholder="3"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-years-in-business"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* OFFICE CONTACT INFORMATION SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Office Contact Information
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="officeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your office address"
                            className="min-h-[80px]"
                            {...field}
                            data-testid="textarea-office-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter city"
                              {...field}
                              data-testid="input-city"
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-state">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianStates.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123456"
                              maxLength={6}
                              {...field}
                              data-testid="input-pincode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="professionalPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Phone *</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Input
                              type="tel"
                              placeholder="+91 9876543210"
                              {...field}
                              data-testid="input-professional-phone"
                              disabled={otpVerified}
                              autoComplete="off"
                            />
                            {field.value && !otpVerified && (
                              <Button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendOtpMutation.isPending}
                                className="w-full"
                                data-testid="button-send-otp"
                              >
                                {sendOtpMutation.isPending ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                              </Button>
                            )}
                            {otpSent && !otpVerified && (
                              <div className="space-y-3">
                                <Input
                                  type="text"
                                  placeholder="Enter 6-digit OTP"
                                  value={otp}
                                  onChange={(e) => setOtp(e.target.value)}
                                  maxLength={6}
                                  data-testid="input-otp"
                                />
                                <Button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  disabled={verifyingOtp || verifyOtpMutation.isPending}
                                  className="w-full"
                                  data-testid="button-verify-otp"
                                >
                                  {verifyingOtp || verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
                                </Button>
                              </div>
                            )}
                            {otpVerified && (
                              <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                  Phone number verified successfully!
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ONLINE PRESENCE SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Online Presence
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourwebsite.com"
                              {...field}
                              data-testid="input-website"
                            />
                          </FormControl>
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
                              placeholder="https://linkedin.com/in/yourprofile"
                              {...field}
                              data-testid="input-linkedin"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Article Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Articles/Blog Links</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendArticle({ url: "", title: "" })}
                        data-testid="button-add-article"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Article
                      </Button>
                    </div>
                    {articleFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`articleLinks.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="https://example.com/article"
                                    {...field}
                                    data-testid={`input-article-url-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArticle(index)}
                          data-testid={`button-remove-article-${index}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Other Social Media Links</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendSocial({ platform: "", url: "" })}
                        data-testid="button-add-social"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Social Link
                      </Button>
                    </div>
                    {socialFields.map((field, index) => (
                      <div key={field.id} className="flex gap-3 items-end">
                        <div className="w-32">
                          <FormField
                            control={form.control}
                            name={`socialMediaLinks.${index}.platform`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Platform"
                                    {...field}
                                    data-testid={`input-social-platform-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`socialMediaLinks.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="https://platform.com/profile"
                                    {...field}
                                    data-testid={`input-social-url-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSocial(index)}
                          data-testid={`button-remove-social-${index}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROFESSIONAL SERVICES SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Professional Services
                    </h3>
                  </div>

                  {/* Specializations */}
                  <FormField
                    control={form.control}
                    name="specializations"
                    render={() => (
                      <FormItem>
                        <FormLabel>Specializations * (Select at least one)</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {specializationOptions.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="specializations"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item
                                                )
                                              )
                                        }}
                                        data-testid={`checkbox-specialization-${item.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Services Offered */}
                  <FormField
                    control={form.control}
                    name="servicesOffered"
                    render={() => (
                      <FormItem>
                        <FormLabel>Services Offered * (Select at least one)</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {servicesOptions.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="servicesOffered"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item
                                                )
                                              )
                                        }}
                                        data-testid={`checkbox-service-${item.toLowerCase().replace(/\s+/g, '-')}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Languages Spoken */}
                  <FormField
                    control={form.control}
                    name="languagesSpoken"
                    render={() => (
                      <FormItem>
                        <FormLabel>Languages Spoken * (Select at least one)</FormLabel>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {languageOptions.map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="languagesSpoken"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item
                                                )
                                              )
                                        }}
                                        data-testid={`checkbox-language-${item.toLowerCase()}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {item}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ADDITIONAL INFORMATION SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Additional Information
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="aboutYou"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About You *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your investment philosophy, approach, and what makes you unique as an investment advisor. Share your expertise and how you help clients achieve their financial goals..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-about-you"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          {field.value?.length || 0}/1000 characters
                        </p>
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
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                            <Input
                              type="number"
                              min="0"
                              max="10000"
                              placeholder="100"
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-consultation-fee"
                            />
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Range: ₹0 - ₹10,000 per consultation
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* FILE UPLOADS SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      File Uploads
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Profile Image</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="file"
                                accept="image/*"
                                placeholder="Upload profile image"
                                data-testid="input-profile-image"
                                className="file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Max 5MB, 400x400px recommended
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sebiCertificateUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEBI Certificate</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Input
                                type="file"
                                accept="image/*,.pdf"
                                placeholder="Upload SEBI certificate"
                                data-testid="input-sebi-certificate"
                                className="file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                          </FormControl>
                          <p className="text-xs text-gray-500">
                            Max 5MB, PDF or image formats accepted
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* LEGAL REQUIREMENTS SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Legal Requirements
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-terms"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">
                            I accept the <a href="/terms" className="text-blue-600 underline" target="_blank">Terms & Conditions</a> *
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacyPolicyAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-privacy"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">
                            I accept the <a href="/privacy" className="text-blue-600 underline" target="_blank">Data Processing/Privacy Policy</a> *
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="professionalDisclaimerAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-disclaimer"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">
                            I acknowledge the <a href="/disclaimer" className="text-blue-600 underline" target="_blank">Professional Disclaimer</a> *
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* AVAILABILITY SECTION */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Availability
                    </h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="availableForConsultations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Available for Consultations
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            Allow potential clients to book consultations with you
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-availability"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="sm:w-auto"
                    data-testid="cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="sm:flex-1 bg-blue-600 hover:bg-blue-700"
                    data-testid="submit-button"
                  >
                    {registerMutation.isPending ? "Registering..." : "Register as SEBI Advisor"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            By registering, you confirm that you are a SEBI-registered investment advisor
            and agree to our terms of service.
          </p>
          <p>
            Your profile will be reviewed and made visible to potential clients once verified.
          </p>
        </div>
      </div>
    </div>
  );
}