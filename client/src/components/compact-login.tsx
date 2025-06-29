import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, LogIn } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompactLoginProps {
  onSuccess?: () => void;
}

export default function CompactLogin({ onSuccess }: CompactLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const { toast } = useToast();

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
    <div className="w-full max-w-xs mx-auto">
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-2">
            <div className="text-center">
              <Phone className="h-4 w-4 mx-auto mb-1 text-primary" />
              <h3 className="font-medium text-sm mb-2">Login to Read</h3>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                className="text-center text-sm h-8 mb-2"
                maxLength={10}
              />
              <Button 
                type="submit" 
                className="w-full h-8 text-xs" 
                disabled={sendOtpMutation.isPending || phoneNumber.length !== 10}
              >
                {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-2">
            <div className="text-center">
              <LogIn className="h-4 w-4 mx-auto mb-1 text-primary" />
              <h3 className="font-medium text-sm">Enter OTP</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Sent to +91 {phoneNumber}
              </p>
              <Input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-sm h-8 tracking-widest mb-2"
                maxLength={6}
              />
              <div className="space-y-1">
                <Button 
                  type="submit" 
                  className="w-full h-8 text-xs" 
                  disabled={verifyOtpMutation.isPending || otp.length !== 6}
                >
                  {verifyOtpMutation.isPending ? "Verifying..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs h-6"
                  onClick={() => setStep("phone")}
                >
                  Change Number
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}