import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Smartphone, ArrowLeft } from "@/lib/icons";

interface MobileLoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
}

export default function MobileLogin({ onBack, onLoginSuccess }: MobileLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits for Indian mobile numbers
    const limited = digits.slice(0, 10);
    
    // Format as XXX XXX XXXX
    if (limited.length >= 6) {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
    } else if (limited.length >= 3) {
      return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    }
    return limited;
  };

  const sendOTP = async () => {
    if (!phoneNumber.replace(/\s/g, '')) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter your 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/send-otp', { phoneNumber: phoneNumber.replace(/\s/g, '') });

      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
      setStep('otp');
    } catch (error) {
      toast({
        title: "Failed to Send OTP",
        description: "Please check your number and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/verify-otp', { 
        phoneNumber: phoneNumber.replace(/\s/g, ''), 
        otp 
      });

      // Wait for successful response
      if (response.ok) {
        // Invalidate auth cache to trigger re-fetch
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Show success message
        toast({
          title: "Login Successful",
          description: "Welcome to StocksShorts!",
        });
        
        // Small delay to ensure state updates properly
        setTimeout(() => {
          onLoginSuccess();
        }, 200);
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: "Invalid OTP",
        description: "Please check the code and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'phone' ? 'Login with Mobile' : 'Verify OTP'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {step === 'phone' 
                ? 'Enter your mobile number to receive OTP'
                : `Code sent to ${phoneNumber}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="999 999 9999"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="pl-12 text-lg tracking-wider"
                      maxLength={12}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Secure OTP-based authentication</p>
                  <p>• No password required</p>
                  <p>• Quick 2-step verification</p>
                </div>

                <Button 
                  onClick={sendOTP}
                  disabled={isLoading || !phoneNumber.replace(/\s/g, '')}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium py-3"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter 6-digit OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOtpChange}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setStep('phone')}
                    className="flex-1"
                  >
                    Change Number
                  </Button>
                  <Button 
                    onClick={verifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={sendOTP}
                    disabled={isLoading}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Didn't receive OTP? Resend
                  </Button>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}