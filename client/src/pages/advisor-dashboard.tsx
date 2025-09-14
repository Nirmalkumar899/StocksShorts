import { useState, useEffect, useRef } from "react";
import { ArrowLeft, User as UserIcon, Phone, Globe, Shield, Clock, CheckCircle, AlertCircle } from "@/lib/icons";
import { Activity, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { type InvestmentAdvisor, type User } from "@shared/schema";

// Contact preferences validation schema
const contactPreferencesSchema = z.object({
  displayPhone: z.boolean(),
  whatsappNumber: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    return /^(\+91[6-9]\d{9}|[6-9]\d{9})$/.test(val);
  }, "Please enter a valid 10-digit Indian mobile number (with or without +91)")
});

type ContactPreferencesData = z.infer<typeof contactPreferencesSchema>;

interface AdvisorDashboardProps {
  onBack?: () => void;
}

export default function AdvisorDashboard({ onBack }: AdvisorDashboardProps) {
  useSEO({
    title: "Advisor Dashboard | StocksShorts - Manage Your Advisory Profile",
    description: "Manage your SEBI advisor status, availability, and contact preferences. View profile information and engage with clients.",
    keywords: "advisor dashboard, SEBI advisor, investment advisor management, advisory status"
  });

  const { user, isAuthenticated, isLoading: authLoading } = useAuth() as {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'active' | 'offline'>('offline');
  const [lastActiveAt, setLastActiveAt] = useState<string | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current user's advisor data using secure endpoint
  const { data: advisorResponse, isLoading: advisorLoading, error: advisorError } = useQuery<{advisor: InvestmentAdvisor, timestamp: string}>({
    queryKey: ['/api/advisors/me'],
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });

  const advisor = advisorResponse?.advisor;

  // Update local status when advisor data changes
  useEffect(() => {
    if (advisor) {
      setStatus(advisor.status as 'active' | 'offline');
      setLastActiveAt(advisor.lastActiveAt ? advisor.lastActiveAt.toString() : null);
    }
  }, [advisor]);

  // Contact preferences form
  const contactForm = useForm<ContactPreferencesData>({
    resolver: zodResolver(contactPreferencesSchema),
    defaultValues: {
      displayPhone: false,
      whatsappNumber: "",
    },
  });

  // Update form when advisor data loads
  useEffect(() => {
    if (advisor) {
      contactForm.reset({
        displayPhone: advisor.displayPhone || false,
        whatsappNumber: advisor.whatsappNumber || "",
      });
    }
  }, [advisor, contactForm]);

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ advisorId, newStatus }: { advisorId: number; newStatus: 'active' | 'offline' }) =>
      apiRequest('PATCH', `/api/advisors/${advisorId}/status`, { status: newStatus }),
    onSuccess: (_, variables) => {
      setStatus(variables.newStatus);
      setLastActiveAt(new Date().toISOString());
      
      // Invalidate advisor data to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/advisors/me'] });
      
      toast({
        title: "Status Updated",
        description: `Your status has been changed to ${variables.newStatus}.`,
      });

      // Start or stop heartbeat based on status
      if (variables.newStatus === 'active') {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description: error?.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Heartbeat mutation
  const heartbeatMutation = useMutation({
    mutationFn: (advisorId: number) => apiRequest('POST', `/api/advisors/${advisorId}/heartbeat`),
    onSuccess: () => {
      setLastActiveAt(new Date().toISOString());
    },
    onError: (error: any) => {
      console.warn('Heartbeat failed:', error);
      // Don't show error toast for heartbeat failures as they're automatic
    },
  });

  // Contact preferences mutation
  const contactPrefsMutation = useMutation({
    mutationFn: ({ advisorId, prefs }: { advisorId: number; prefs: ContactPreferencesData }) =>
      apiRequest('PATCH', `/api/advisors/${advisorId}/contact-prefs`, prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advisors/me'] });
      toast({
        title: "Contact Preferences Updated",
        description: "Your contact preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update contact preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Heartbeat system
  const startHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    if (advisor?.id) {
      // Send immediate heartbeat
      heartbeatMutation.mutate(advisor.id);
      
      // Set up 30-second interval
      heartbeatInterval.current = setInterval(() => {
        if (advisor?.id) {
          heartbeatMutation.mutate(advisor.id);
        }
      }, 30000);
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  // Start/stop heartbeat based on status
  useEffect(() => {
    if (status === 'active' && advisor?.id) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    // Cleanup on unmount
    return () => stopHeartbeat();
  }, [status, advisor?.id]);

  // Handle status toggle
  const handleStatusToggle = (newStatus: 'active' | 'offline') => {
    if (!advisor?.id) {
      toast({
        title: "Error",
        description: "Advisor ID not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    statusMutation.mutate({ advisorId: advisor.id, newStatus });
  };

  // Handle contact preferences submission
  const onContactPrefsSubmit = (data: ContactPreferencesData) => {
    if (!advisor?.id) {
      toast({
        title: "Error",
        description: "Advisor ID not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    contactPrefsMutation.mutate({ advisorId: advisor.id, prefs: data });
  };

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to access the advisor dashboard.
            </p>
            <Link href="/mobile-login">
              <Button className="w-full" data-testid="login-button">
                Log In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (advisorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading advisor profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (advisorError || !advisor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Advisor Profile Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {advisorError instanceof Error ? advisorError.message : "Your advisor profile was not found. Please register as an advisor first."}
            </p>
            <div className="space-y-2">
              <Link href="/sebi-ria/register">
                <Button className="w-full" data-testid="register-advisor-button">
                  Register as Advisor
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full" data-testid="back-home-button">
                  Back to Home
                </Button>
              </Link>
            </div>
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
            <div className="flex items-center gap-4">
              {onBack ? (
                <Button variant="ghost" onClick={onBack} data-testid="back-button">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
              ) : (
                <Link href="/sebi-ria">
                  <Button variant="ghost" data-testid="back-to-directory">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Directory
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Advisor Dashboard</span>
              </div>
            </div>
            <Badge 
              variant={status === 'active' ? 'default' : 'secondary'}
              className={status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
              data-testid="status-badge"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              {status === 'active' ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <UserIcon className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome, {advisor.firstName} {advisor.lastName}
          </h1>
          <p className="text-lg text-blue-100">
            Manage your advisor profile and client interactions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Status Management */}
          <Card data-testid="status-management-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Status Management
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control your availability for client consultations
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <p className="font-medium">{status === 'active' ? 'Active' : 'Offline'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {status === 'active' ? 'Available for consultations' : 'Not available'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={status === 'active'}
                  onCheckedChange={(checked) => handleStatusToggle(checked ? 'active' : 'offline')}
                  disabled={statusMutation.isPending}
                  data-testid="status-toggle"
                />
              </div>

              {lastActiveAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Last active: {new Date(lastActiveAt).toLocaleString()}</span>
                </div>
              )}

              {status === 'active' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your status is automatically updated every 30 seconds while you're active.
                  </AlertDescription>
                </Alert>
              )}

              {statusMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Updating status...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          <Card data-testid="contact-preferences-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                Contact Preferences
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control how clients can reach you
              </p>
            </CardHeader>
            <CardContent>
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactPrefsSubmit)} className="space-y-6">
                  
                  <FormField
                    control={contactForm.control}
                    name="displayPhone"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Display Phone Number</FormLabel>
                          <FormDescription>
                            Show your phone number to clients in the directory
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-display-phone"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter WhatsApp number (e.g., +91 9876543210)"
                            {...field}
                            data-testid="input-whatsapp-number"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a WhatsApp number for quick client communication
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={contactPrefsMutation.isPending}
                    data-testid="save-contact-prefs-button"
                  >
                    {contactPrefsMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card className="md:col-span-2" data-testid="profile-info-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Profile Information
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your registered advisor profile details
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-base">{advisor.firstName} {advisor.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-base">{advisor.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Professional Phone</label>
                      <p className="text-base">{advisor.professionalPhone}</p>
                    </div>
                    {advisor.whatsappNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">WhatsApp</label>
                        <p className="text-base">{advisor.whatsappNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professional Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">SEBI Registration No.</label>
                      <p className="text-base font-mono">{advisor.sebiRegNo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Qualification</label>
                      <p className="text-base">{advisor.qualification}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-base">{advisor.experienceYears} years</p>
                    </div>
                    {advisor.company && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-base">{advisor.company}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Services */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Location & Services</h3>
                  <div className="space-y-3">
                    {(advisor.city || advisor.state) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-base">{[advisor.city, advisor.state].filter(Boolean).join(', ')}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Consultation Fee</label>
                      <p className="text-base">₹{advisor.consultationFee || 0} per session</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Available for Consultations</label>
                      <Badge variant={advisor.availableForConsultations ? 'default' : 'secondary'}>
                        {advisor.availableForConsultations ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Online Presence */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Online Presence</h3>
                  <div className="space-y-3">
                    {advisor.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Website</label>
                        <a 
                          href={advisor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-4 w-4" />
                          {advisor.website}
                        </a>
                      </div>
                    )}
                    {advisor.linkedinProfile && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                        <a 
                          href={advisor.linkedinProfile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline"
                        >
                          View LinkedIn Profile
                        </a>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-base">{new Date(advisor.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* About Section */}
              {advisor.aboutYou ? (
                <div key="about-section">
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">About</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {String(advisor.aboutYou)}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Specializations */}
              {advisor.specializations && Array.isArray(advisor.specializations) && advisor.specializations.length > 0 ? (
                <div key="specializations-section">
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {(advisor.specializations as string[]).map((spec: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {String(spec)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Services Offered */}
              {advisor.servicesOffered && Array.isArray(advisor.servicesOffered) && advisor.servicesOffered.length > 0 ? (
                <div key="services-section">
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Services Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {(advisor.servicesOffered as string[]).map((service: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {String(service)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}