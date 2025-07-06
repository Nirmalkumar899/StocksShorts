import React, { useState, useEffect } from "react";
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { toast } = useToast();

  // Detect keyboard appearance by monitoring viewport height changes
  useEffect(() => {
    const initialHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // If viewport height reduced by more than 150px, keyboard is likely open
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Add viewport change listener for mobile keyboards
  useEffect(() => {
    const handleViewportChange = () => {
      // Update CSS custom property for keyboard height
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      const keyboardHeight = Math.max(0, documentHeight - viewportHeight);
      
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    };

    window.addEventListener('resize', handleViewportChange);
    
    return () => {
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

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
    <div 
      className={`w-full max-w-sm mx-auto mobile-input-container ${isKeyboardOpen ? 'keyboard-open' : ''}`}
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        zIndex: 1000,
        // Ensure the component adapts to viewport changes (keyboard)
        minHeight: 'fit-content',
        paddingBottom: 'env(keyboard-inset-height, 0px)',
        // Use the detected keyboard height
        marginBottom: isKeyboardOpen ? 'var(--keyboard-height, 0px)' : '0px'
      }}
    >
      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="mobile-form">
          <div className="space-y-3" onClick={handleContainerClick}>
            {/* Larger phone icon and label */}
            <div className="text-center mb-4">
              <Phone className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Enter Mobile Number
              </p>
            </div>
            
            {/* Enhanced input field with proper spacing */}
            <div className="space-y-3 mt-4">
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => {
                  e.stopPropagation();
                  setPhoneNumber(formatPhoneNumber(e.target.value));
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  // Force text visibility styles when keyboard opens
                  const input = e.target as HTMLInputElement;
                  input.style.color = '#000000';
                  input.style.backgroundColor = '#ffffff';
                  input.style.webkitTextFillColor = '#000000';
                  input.style.webkitTextStroke = '0.5px #000000';
                  
                  // Scroll the input into view when focused
                  setTimeout(() => {
                    e.target.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }, 100);
                }}
                onInput={(e) => {
                  // Force text visibility during typing
                  const input = e.target as HTMLInputElement;
                  input.style.color = '#000000';
                  input.style.webkitTextFillColor = '#000000';
                  input.style.zIndex = '99999';
                }}
                onClick={handleContainerClick}
                className="w-full h-14 px-4 py-3 text-center text-xl font-bold border-2 border-blue-500 rounded-lg mobile-input"
                maxLength={10}
                autoComplete="tel"
                inputMode="numeric"
                style={{
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '800',
                  textAlign: 'center' as const,
                  WebkitTextFillColor: '#000000',
                  WebkitAppearance: 'none' as const,
                  border: '3px solid #1d4ed8',
                  borderRadius: '12px',
                  outline: 'none',
                  boxShadow: 'none',
                  letterSpacing: '3px',
                  padding: '16px',
                  zIndex: 10,
                  position: 'relative'
                } as React.CSSProperties}
              />
              
              <Button 
                type="submit" 
                onClick={handleContainerClick}
                className="w-full h-12 text-base font-medium mobile-button" 
                disabled={sendOtpMutation.isPending || phoneNumber.length !== 10}
                size="lg"
              >
                {sendOtpMutation.isPending ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-3 mobile-form" onClick={handleContainerClick}>
          {/* OTP step with larger elements */}
          <div className="text-center mb-4">
            <LogIn className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Enter OTP
            </p>
            <p className="text-xs text-muted-foreground">
              Sent to +91 {phoneNumber}
            </p>
          </div>
          
          <form onSubmit={handleOtpSubmit}>
            <div className="space-y-3 mt-4">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => {
                  e.stopPropagation();
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  // Force text visibility styles when keyboard opens
                  const input = e.target as HTMLInputElement;
                  input.style.color = '#000000';
                  input.style.backgroundColor = '#ffffff';
                  input.style.webkitTextFillColor = '#000000';
                  input.style.webkitTextStroke = '0.5px #000000';
                  
                  // More aggressive scrolling for OTP input when keyboard appears
                  setTimeout(() => {
                    const element = e.target;
                    const container = element.closest('.mobile-input-container');
                    
                    // First scroll the container to top of viewport
                    if (container) {
                      container.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                      });
                    }
                    
                    // Then add extra scroll up to account for keyboard
                    setTimeout(() => {
                      window.scrollBy(0, -150);
                    }, 200);
                  }, 50);
                }}
                onInput={(e) => {
                  // Force text visibility during typing
                  const input = e.target as HTMLInputElement;
                  input.style.color = '#000000';
                  input.style.webkitTextFillColor = '#000000';
                  input.style.zIndex = '99999';
                }}
                onClick={handleContainerClick}
                className="w-full h-14 px-4 py-3 text-center text-xl font-bold border-2 border-blue-500 rounded-lg mobile-input"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                style={{
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '800',
                  textAlign: 'center' as const,
                  WebkitTextFillColor: '#000000',
                  WebkitAppearance: 'none' as const,
                  border: '3px solid #1d4ed8',
                  borderRadius: '12px',
                  outline: 'none',
                  boxShadow: 'none',
                  letterSpacing: '6px',
                  padding: '16px',
                  zIndex: 10,
                  position: 'relative'
                } as React.CSSProperties}
              />
              
              <Button 
                type="submit" 
                onClick={handleContainerClick}
                className="w-full h-12 text-base font-medium mobile-button" 
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
                size="lg"
              >
                {verifyOtpMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-sm h-8"
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