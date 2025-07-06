import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, LogIn } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DirectLoginProps {
  onSuccess?: () => void;
}

export default function DirectLogin({ onSuccess }: DirectLoginProps) {
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
    e.stopPropagation();
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
    e.stopPropagation();
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

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="w-full" onClick={handleContainerClick}>
      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit}>
          <div className="flex items-center space-x-2" onClick={handleContainerClick}>
            <Phone className="h-3 w-3 text-primary flex-shrink-0" />
            <Input
              type="tel"
              placeholder="Mobile number"
              value={phoneNumber}
              onChange={(e) => {
                e.stopPropagation();
                setPhoneNumber(formatPhoneNumber(e.target.value));
              }}
              onClick={handleContainerClick}
              className="text-center text-xs h-7 flex-1"
              maxLength={10}
            />
            <Button 
              type="submit" 
              onClick={handleContainerClick}
              className="h-7 text-xs px-3 flex-shrink-0" 
              disabled={sendOtpMutation.isPending || phoneNumber.length !== 10}
            >
              {sendOtpMutation.isPending ? "..." : "Send"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2" onClick={handleContainerClick}>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              OTP sent to +91 {phoneNumber}
            </p>
          </div>
          <form onSubmit={handleOtpSubmit}>
            <div className="flex items-center space-x-2" onClick={handleContainerClick}>
              <LogIn className="h-3 w-3 text-primary flex-shrink-0" />
              <Input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => {
                  e.stopPropagation();
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                onClick={handleContainerClick}
                className="text-center text-xs h-7 tracking-widest flex-1"
                maxLength={6}
              />
              <Button 
                type="submit" 
                onClick={handleContainerClick}
                className="h-7 text-xs px-3 flex-shrink-0" 
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
              >
                {verifyOtpMutation.isPending ? "..." : "Login"}
              </Button>
            </div>
          </form>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs h-5"
            onClick={(e) => {
              e.stopPropagation();
              setStep("phone");
            }}
          >
            Change Number
          </Button>
        </div>
      )}
    </div>
  );
}