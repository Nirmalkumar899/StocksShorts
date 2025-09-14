import { useState } from "react";
import { ArrowLeft, CheckCircle, Shield, AlertTriangle, User } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSEO } from "@/hooks/useSEO";

interface SebiRiaRegisterProps {
  onBack: () => void;
}

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  sebiRegNo: z.string().min(5, "SEBI registration number must be at least 5 characters").max(50, "Registration number too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  company: z.string().max(100, "Company name too long").optional(),
  specialization: z.string().min(1, "Please select a specialization"),
  experience: z.string().max(50, "Experience description too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const specializationOptions = [
  "Equity Trading",
  "Mutual Funds",
  "Portfolio Management",
  "Retirement Planning",
  "Tax Planning",
  "Insurance Planning",
  "Wealth Management",
  "Risk Management",
  "Financial Planning",
  "Corporate Finance",
  "Derivatives Trading",
  "Currency Trading",
  "Commodity Trading",
  "Real Estate Investment",
  "Fixed Income Securities",
  "Alternative Investments"
];

export default function SebiRiaRegister({ onBack }: SebiRiaRegisterProps) {
  useSEO({
    title: "Register as SEBI Investment Advisor | StocksShorts",
    description: "Register as a SEBI-certified investment advisor. Join our network of verified financial professionals and connect with potential clients.",
    keywords: "SEBI registration, investment advisor, financial professional, RIA registration"
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      sebiRegNo: "",
      email: "",
      phone: "",
      company: "",
      specialization: "",
      experience: "",
      location: "",
      bio: "",
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
    },
  });

  const onSubmit = (data: RegisterFormData) => {
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
            Register as SEBI Investment Advisor
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SEBI Registration Number */}
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

                {/* Email */}
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

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+91 9876543210"
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company */}
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company/Firm</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your company name"
                            {...field}
                            data-testid="input-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, State"
                            {...field}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Specialization */}
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Specialization *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-specialization">
                              <SelectValue placeholder="Select specialization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specializationOptions.map((option) => (
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

                  {/* Experience */}
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 5+ years"
                            {...field}
                            data-testid="input-experience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your expertise, approach, and what makes you unique as an investment advisor..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-bio"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        {field.value?.length || 0}/500 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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