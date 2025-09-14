import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Clock, User, Calendar, Phone, CheckCircle, AlertCircle, Loader2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { InvestmentAdvisor } from "@shared/schema";

// Form validation schema
const bookingFormSchema = z.object({
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface ConsultationBookingFormProps {
  advisor: InvestmentAdvisor;
  duration: "15min" | "30min";
  selectedDate: Date;
  selectedTimeSlot: Date;
  onBookingSuccess: (bookingId: number) => void;
  onCancel: () => void;
}

// Calculate consultation fee
function getConsultationFee(advisor: InvestmentAdvisor, duration: "15min" | "30min"): number {
  if (duration === "15min") {
    return advisor.consultationFee15min ? parseFloat(advisor.consultationFee15min.toString()) : 0;
  } else {
    return advisor.consultationFee30min ? parseFloat(advisor.consultationFee30min.toString()) : 0;
  }
}

// Check if consultation is available for the duration
function isConsultationAvailable(advisor: InvestmentAdvisor, duration: "15min" | "30min"): boolean {
  if (!advisor.consultationEnabled) return false;
  
  if (duration === "15min") {
    return advisor.consultationFee15min !== null;
  } else {
    return advisor.consultationFee30min !== null;
  }
}

export default function ConsultationBookingForm({
  advisor,
  duration,
  selectedDate,
  selectedTimeSlot,
  onBookingSuccess,
  onCancel
}: ConsultationBookingFormProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Check if user qualifies for free consultation
  const { data: freeConsultationEligible, isLoading: checkingEligibility } = useQuery({
    queryKey: ['/api/teleconsultations/check-free-eligibility', advisor.id],
    enabled: isAuthenticated && !!advisor.id,
  });

  const consultationFee = getConsultationFee(advisor, duration);
  const isFreeConsultation = freeConsultationEligible?.eligible && consultationFee > 0;
  const finalFee = isFreeConsultation ? 0 : consultationFee;
  const isConsultationServiceAvailable = isConsultationAvailable(advisor, duration);

  // Create Razorpay order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest('POST', '/api/razorpay/create-order', bookingData);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to setup payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Book consultation mutation
  const bookConsultationMutation = useMutation({
    mutationFn: async (consultationData: any) => {
      return apiRequest('POST', '/api/teleconsultations/book', consultationData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teleconsultations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teleconsultations/availability'] });
      toast({
        title: "Consultation Booked!",
        description: "Your consultation has been successfully scheduled. You will receive a confirmation email with meeting details.",
        variant: "default",
      });
      onBookingSuccess(data.consultation.id);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFreeConsultationBooking = async (data: BookingFormData) => {
    const consultationData = {
      advisorId: advisor.id,
      duration,
      scheduledAt: selectedTimeSlot.toISOString(),
      fee: 0,
      notes: data.notes || "",
    };

    bookConsultationMutation.mutate(consultationData);
  };

  const handlePaidConsultationBooking = async (data: BookingFormData) => {
    setIsProcessingPayment(true);

    try {
      const orderData = {
        advisorId: advisor.id,
        duration,
        scheduledAt: selectedTimeSlot.toISOString(),
        fee: finalFee,
        notes: data.notes || "",
      };

      const { razorpayOrder, consultationData } = await createOrderMutation.mutateAsync(orderData);

      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "StocksShorts Consultation",
        description: `${duration} consultation with ${advisor.firstName} ${advisor.lastName}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Verify payment and create consultation
            const verificationData = {
              ...consultationData,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            };

            const result = await apiRequest('POST', '/api/razorpay/verify-payment', verificationData);
            
            queryClient.invalidateQueries({ queryKey: ['/api/teleconsultations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/teleconsultations/availability'] });
            
            toast({
              title: "Payment Successful!",
              description: "Your consultation has been booked successfully. You will receive a confirmation email.",
              variant: "default",
            });
            
            onBookingSuccess(result.consultation.id);
          } catch (error: any) {
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Payment was processed but booking failed. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast({
              title: "Payment Cancelled",
              description: "Payment was cancelled. Your consultation was not booked.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user?.name || `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
          contact: user?.phoneNumber,
        },
        theme: {
          color: "#2563eb"
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      setIsProcessingPayment(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to book a consultation.",
        variant: "destructive",
      });
      return;
    }

    if (!isConsultationServiceAvailable) {
      toast({
        title: "Service Unavailable",
        description: `${duration} consultations are not available with this advisor.`,
        variant: "destructive",
      });
      return;
    }

    if (finalFee === 0) {
      await handleFreeConsultationBooking(data);
    } else {
      await handlePaidConsultationBooking(data);
    }
  };

  const isLoading = bookConsultationMutation.isPending || createOrderMutation.isPending || isProcessingPayment;

  if (!isConsultationServiceAvailable) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {duration} consultations are not available with {advisor.firstName} {advisor.lastName}. 
          Please select a different duration or choose another advisor.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calendar className="h-5 w-5 mr-2" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Advisor Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={advisor.profileImageUrl || undefined} />
              <AvatarFallback className="text-lg">
                {advisor.firstName?.[0]}{advisor.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {advisor.firstName} {advisor.lastName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {advisor.qualification}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                SEBI Reg: {advisor.sebiRegNo}
              </p>
            </div>
          </div>

          <Separator />

          {/* Consultation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(selectedTimeSlot, 'h:mm a')} IST ({duration === "15min" ? "15" : "30"} minutes)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fee Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Consultation Fee ({duration})</span>
              <span className="text-sm">₹{consultationFee.toFixed(2)}</span>
            </div>
            
            {isFreeConsultation && (
              <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Free Consultation Discount</span>
                </div>
                <span className="text-sm">-₹{consultationFee.toFixed(2)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span>₹{finalFee.toFixed(2)}</span>
            </div>
            
            {isFreeConsultation && (
              <Badge variant="secondary" className="w-fit">
                First consultation is free!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for the Advisor (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe what you'd like to discuss during the consultation..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Help your advisor prepare by sharing your investment goals or specific questions.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="button-cancel-booking"
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isLoading || checkingEligibility}
                  className="flex-1"
                  data-testid="button-confirm-booking"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isProcessingPayment ? "Processing Payment..." : "Booking..."}
                    </>
                  ) : finalFee > 0 ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ₹{finalFee.toFixed(2)} & Book
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Book Free Consultation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Payment Security Notice */}
      {finalFee > 0 && (
        <Alert>
          <CreditCard className="h-4 w-4" />
          <AlertDescription>
            Your payment will be processed securely through Razorpay. We accept all major credit cards, 
            debit cards, and UPI payments. Your payment information is encrypted and secure.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}