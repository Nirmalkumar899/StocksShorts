import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, LogIn } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SimpleLoginProps {
  onSuccess?: () => void;
}

export default function SimpleLogin({ onSuccess }: SimpleLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest("POST", "/api/auth/send-otp", { phoneNumber: phone });
      return response;
    },
    onSuccess: () => {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check your phone for the 6-digit code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ phone, otpCode }: { phone: string; otpCode: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        phoneNumber: phone,
        otp: otpCode,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome! You can now read all articles.",
      });
      onSuccess?.();
      // Refresh the page to update authentication state
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    },
  });

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits;
    }
    return digits.slice(0, 10);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate(phoneNumber);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ phone: phoneNumber, otpCode: otp });
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-4">
        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            <div className="text-center mb-3">
              <Phone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Login to Read</h3>
              <p className="text-xs text-muted-foreground">Enter your mobile number</p>
            </div>
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                className="text-center"
                maxLength={10}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={sendOtpMutation.isPending || phoneNumber.length !== 10}
              >
                {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-3">
            <div className="text-center mb-3">
              <LogIn className="h-6 w-6 mx-auto mb-2 text-primary" />
              <h3 className="font-medium">Enter OTP</h3>
              <p className="text-xs text-muted-foreground">
                Sent to +91 {phoneNumber}
              </p>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Login"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setStep("phone")}
              >
                Change Number
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}