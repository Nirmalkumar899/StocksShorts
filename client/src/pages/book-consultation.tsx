import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, User, CheckCircle, AlertCircle, Phone, MapPin } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfDay, addDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import ConsultationBookingForm from "@/components/ConsultationBookingForm";
import type { InvestmentAdvisor } from "@shared/schema";

interface BookConsultationProps {
  onBack?: () => void;
}

export default function BookConsultation({ onBack }: BookConsultationProps) {
  const { advisorId } = useParams<{ advisorId?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Booking flow state
  const [selectedAdvisor, setSelectedAdvisor] = useState<InvestmentAdvisor | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<"15min" | "30min" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(addDays(new Date(), 1))); // Default to tomorrow
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | null>(null);
  const [bookingStep, setBookingStep] = useState<"advisor" | "duration" | "schedule" | "confirm" | "success">("advisor");
  const [bookingId, setBookingId] = useState<number | null>(null);

  useSEO({
    title: selectedAdvisor ? 
      `Book Consultation with ${selectedAdvisor.firstName} ${selectedAdvisor.lastName} | StocksShorts` :
      "Book Investment Consultation | StocksShorts",
    description: selectedAdvisor ?
      `Schedule a consultation with SEBI-registered investment advisor ${selectedAdvisor.firstName} ${selectedAdvisor.lastName}. Get personalized investment advice from qualified experts.` :
      "Book a consultation with verified SEBI-registered investment advisors. Get professional investment advice and financial planning services.",
    keywords: "book consultation, investment advisor, SEBI advisor, financial consultation, investment advice"
  });

  // Fetch specific advisor if advisorId is provided
  const { data: advisor, isLoading: advisorLoading, error: advisorError } = useQuery<InvestmentAdvisor>({
    queryKey: ['/api/advisors', advisorId],
    enabled: !!advisorId,
  });

  // Fetch all advisors for selection if no specific advisor
  const { data: advisorsData, isLoading: advisorsLoading } = useQuery<{ advisors: InvestmentAdvisor[] }>({
    queryKey: ['/api/advisors'],
    enabled: !advisorId,
  });

  const advisors = advisorsData?.advisors || [];
  const enabledAdvisors = advisors.filter(a => a.consultationEnabled);

  // Initialize booking flow based on URL parameters
  useEffect(() => {
    if (advisorId && advisor && advisor.consultationEnabled) {
      setSelectedAdvisor(advisor);
      setBookingStep("duration");
    } else if (advisorId && advisor && !advisor.consultationEnabled) {
      toast({
        title: "Consultation Unavailable",
        description: "This advisor is not currently accepting consultations.",
        variant: "destructive",
      });
      setLocation('/advisor-directory');
    } else if (!advisorId) {
      setBookingStep("advisor");
    }
  }, [advisorId, advisor, setLocation, toast]);

  // Handle advisor selection
  const handleAdvisorSelect = (advisorData: InvestmentAdvisor) => {
    if (!advisorData.consultationEnabled) {
      toast({
        title: "Consultation Unavailable", 
        description: "This advisor is not currently accepting consultations.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAdvisor(advisorData);
    setBookingStep("duration");
  };

  // Handle duration selection
  const handleDurationSelect = (duration: "15min" | "30min") => {
    if (!selectedAdvisor) return;
    
    // Check if the selected duration is available
    const isAvailable = duration === "15min" ? 
      selectedAdvisor.consultationFee15min !== null :
      selectedAdvisor.consultationFee30min !== null;
    
    if (!isAvailable) {
      toast({
        title: "Duration Unavailable",
        description: `${duration === "15min" ? "15-minute" : "30-minute"} consultations are not available with this advisor.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedDuration(duration);
    setBookingStep("schedule");
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: Date) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Proceed to confirmation
  const handleProceedToConfirm = () => {
    if (!selectedTimeSlot) {
      toast({
        title: "Time Slot Required",
        description: "Please select a time slot for your consultation.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to book a consultation.",
        variant: "destructive",
      });
      setLocation('/profile');
      return;
    }
    
    setBookingStep("confirm");
  };

  // Handle booking success
  const handleBookingSuccess = (id: number) => {
    setBookingId(id);
    setBookingStep("success");
  };

  // Handle back navigation
  const handleBack = () => {
    if (bookingStep === "success") {
      setLocation('/profile');
    } else if (bookingStep === "confirm") {
      setBookingStep("schedule");
    } else if (bookingStep === "schedule") {
      setBookingStep("duration");
    } else if (bookingStep === "duration") {
      if (advisorId) {
        setLocation(`/advisor-directory`);
      } else {
        setBookingStep("advisor");
      }
    } else if (bookingStep === "advisor") {
      if (onBack) {
        onBack();
      } else {
        setLocation('/advisor-directory');
      }
    }
  };

  // Get available durations for selected advisor
  const getAvailableDurations = (advisor: InvestmentAdvisor): Array<{value: "15min" | "30min", label: string, fee: number}> => {
    const durations: Array<{value: "15min" | "30min", label: string, fee: number}> = [];
    
    if (advisor.consultationFee15min !== null) {
      durations.push({
        value: "15min",
        label: "15 minutes",
        fee: parseFloat(advisor.consultationFee15min.toString())
      });
    }
    
    if (advisor.consultationFee30min !== null) {
      durations.push({
        value: "30min", 
        label: "30 minutes",
        fee: parseFloat(advisor.consultationFee30min.toString())
      });
    }
    
    return durations;
  };

  // Loading states
  if (advisorId && advisorLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (advisorId && advisorError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load advisor information. Please try again or select a different advisor.
            </AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/advisor-directory')} data-testid="button-back-to-directory">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Advisor Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 dark:text-gray-300"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {bookingStep === "success" ? "Booking Confirmed" : "Book Consultation"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {bookingStep === "advisor" && "Select an advisor"}
                  {bookingStep === "duration" && "Choose consultation duration"}
                  {bookingStep === "schedule" && "Select date and time"}
                  {bookingStep === "confirm" && "Review and confirm booking"}
                  {bookingStep === "success" && "Your consultation has been scheduled"}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            {bookingStep !== "success" && (
              <div className="hidden sm:flex items-center space-x-2">
                {["advisor", "duration", "schedule", "confirm"].map((step, index) => {
                  const currentIndex = ["advisor", "duration", "schedule", "confirm"].indexOf(bookingStep);
                  const isCompleted = index < currentIndex;
                  const isCurrent = index === currentIndex;
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isCurrent ? 'bg-blue-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      {index < 3 && (
                        <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Advisor Selection Step */}
        {bookingStep === "advisor" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Select an Investment Advisor
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose from our verified SEBI-registered investment advisors
                </p>
              </CardHeader>
              <CardContent>
                {advisorsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : enabledAdvisors.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No advisors are currently available for consultations. Please check back later.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enabledAdvisors.slice(0, 10).map((advisorData) => (
                      <Card 
                        key={advisorData.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                        onClick={() => handleAdvisorSelect(advisorData)}
                        data-testid={`card-advisor-${advisorData.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={advisorData.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {advisorData.firstName?.[0]}{advisorData.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {advisorData.firstName} {advisorData.lastName}
                              </h3>
                              
                              {advisorData.company && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {advisorData.company}
                                </p>
                              )}
                              
                              <div className="flex items-center mt-1 space-x-2">
                                {(advisorData.city || advisorData.state) && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {[advisorData.city, advisorData.state].filter(Boolean).join(', ')}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center mt-2 space-x-2">
                                {advisorData.consultationFee15min && (
                                  <Badge variant="outline" className="text-xs">
                                    15min: ₹{parseFloat(advisorData.consultationFee15min.toString())}
                                  </Badge>
                                )}
                                {advisorData.consultationFee30min && (
                                  <Badge variant="outline" className="text-xs">
                                    30min: ₹{parseFloat(advisorData.consultationFee30min.toString())}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Duration Selection Step */}
        {bookingStep === "duration" && selectedAdvisor && (
          <div className="space-y-6">
            {/* Selected Advisor Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedAdvisor.profileImageUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {selectedAdvisor.firstName?.[0]}{selectedAdvisor.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedAdvisor.firstName} {selectedAdvisor.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedAdvisor.qualification}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      SEBI Reg: {selectedAdvisor.sebiRegNo}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Duration Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2" />
                  Choose Consultation Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getAvailableDurations(selectedAdvisor).map((duration) => (
                    <Card 
                      key={duration.value}
                      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2"
                      onClick={() => handleDurationSelect(duration.value)}
                      data-testid={`card-duration-${duration.value}`}
                    >
                      <CardContent className="p-6 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                        <h3 className="text-lg font-semibold mb-2">{duration.label}</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          ₹{duration.fee}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Perfect for {duration.value === "15min" ? "quick questions" : "detailed discussions"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Schedule Selection Step */}
        {bookingStep === "schedule" && selectedAdvisor && selectedDuration && (
          <div className="space-y-6">
            {/* Selected Details Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedAdvisor.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {selectedAdvisor.firstName?.[0]}{selectedAdvisor.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedAdvisor.firstName} {selectedAdvisor.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDuration === "15min" ? "15-minute" : "30-minute"} consultation
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    ₹{selectedDuration === "15min" ? 
                      parseFloat(selectedAdvisor.consultationFee15min!.toString()) :
                      parseFloat(selectedAdvisor.consultationFee30min!.toString())
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Time Slot Picker */}
            <TimeSlotPicker
              advisor={selectedAdvisor}
              duration={selectedDuration}
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot || undefined}
              onDateChange={setSelectedDate}
              onTimeSlotSelect={handleTimeSlotSelect}
            />

            {/* Continue Button */}
            {selectedTimeSlot && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Selected Time:</p>
                      <p className="text-lg font-semibold">
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {format(selectedTimeSlot, 'h:mm a')}
                      </p>
                    </div>
                    <Button onClick={handleProceedToConfirm} size="lg" data-testid="button-proceed-to-confirm">
                      Continue to Booking
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Confirmation Step */}
        {bookingStep === "confirm" && selectedAdvisor && selectedDuration && selectedDate && selectedTimeSlot && (
          <ConsultationBookingForm
            advisor={selectedAdvisor}
            duration={selectedDuration}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onBookingSuccess={handleBookingSuccess}
            onCancel={handleBack}
          />
        )}

        {/* Success Step */}
        {bookingStep === "success" && bookingId && selectedAdvisor && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your consultation has been successfully scheduled with {selectedAdvisor.firstName} {selectedAdvisor.lastName}.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Booking ID</p>
                      <p className="text-gray-600 dark:text-gray-400">#{bookingId}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Date & Time</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {format(selectedDate, 'MMM d, yyyy')} at {format(selectedTimeSlot, 'h:mm a')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Duration</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedDuration === "15min" ? "15" : "30"} minutes
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">Advisor</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedAdvisor.firstName} {selectedAdvisor.lastName}
                      </p>
                    </div>
                  </div>
                </div>

                <Alert className="text-left mb-6">
                  <Phone className="h-4 w-4" />
                  <AlertDescription>
                    You will receive a confirmation email with meeting details shortly. The advisor will contact you 
                    at the scheduled time. Please ensure you have a stable internet connection for the video call.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => setLocation('/profile')}
                    data-testid="button-view-bookings"
                  >
                    View My Bookings
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/advisor-directory')}
                    data-testid="button-book-another"
                  >
                    Book Another Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}