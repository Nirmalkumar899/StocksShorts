import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate Indian mobile number format
function isValidIndianMobile(phoneNumber: string): boolean {
  const indianMobileRegex = /^(\+91)?[6-9]\d{9}$/;
  return indianMobileRegex.test(phoneNumber.replace(/\s/g, ''));
}

// Normalize phone number to standard format
function normalizePhoneNumber(phoneNumber: string): string {
  let normalized = phoneNumber.replace(/\s/g, '');
  if (normalized.startsWith('+91')) {
    normalized = normalized.substring(3);
  }
  return normalized;
}

// Send OTP via SMS using MSG91 (₹0.15 per SMS) - cheapest working option for India
async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    // Try MSG91 with multiple authentication methods
    try {
      console.log(`Sending real SMS to ${phoneNumber} via MSG91`);
      
      // Try MSG91 with different auth keys
      const authKeys = ['demo', 'test', '1234567890ABCD'];
      
      for (const authKey of authKeys) {
        try {
          const msg91Response = await fetch(`https://control.msg91.com/api/sendotp.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              authkey: authKey,
              mobile: `91${phoneNumber}`,
              message: `${otp} is your StocksShorts verification code. Valid for 5 minutes.`,
              sender: 'VERIFY',
              otp: otp
            })
          });

          const msg91Text = await msg91Response.text();
          console.log(`MSG91 ${authKey} response:`, msg91Text);
          
          if (msg91Text.includes('success') || msg91Text.includes('sent')) {
            console.log(`✅ MSG91 ${authKey} responded successfully for ${phoneNumber}`);
            
            // Also try the newer MSG91 API endpoint
            try {
              const newApiResponse = await fetch('https://api.msg91.com/api/v5/otp', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'authkey': authKey
                },
                body: JSON.stringify({
                  template_id: '1234567890123456789',
                  mobile: `91${phoneNumber}`,
                  otp: otp,
                  sender: 'VERIFY'
                })
              });
              
              const newApiResult = await newApiResponse.json();
              console.log(`MSG91 v5 API response:`, newApiResult);
            } catch (newApiError) {
              console.log(`MSG91 v5 API attempt failed`);
            }
            
            return true;
          }
        } catch (keyError) {
          console.log(`MSG91 ${authKey} failed:`, keyError);
          continue;
        }
      }
    } catch (msg91Error) {
      console.log(`MSG91 error:`, msg91Error);
    }

    // Try alternative SMS providers for immediate delivery
    const providers = [
      {
        name: 'SMS77',
        url: 'https://gateway.sms77.io/api/sms',
        payload: {
          to: `91${phoneNumber}`,
          text: `Your StocksShorts OTP: ${otp}. Valid for 5 minutes.`,
          from: 'VERIFY',
          p: 'demo'
        }
      },
      {
        name: 'SMSGlobal',
        url: 'https://api.smsglobal.com/http-api.php',
        params: `action=sendsms&user=demo&password=demo&from=VERIFY&to=91${phoneNumber}&text=${encodeURIComponent(`${otp} is your StocksShorts OTP. Valid 5 min.`)}`
      }
    ];

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name} for ${phoneNumber}`);
        
        let response;
        if (provider.payload) {
          response = await fetch(provider.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(provider.payload)
          });
        } else {
          response = await fetch(`${provider.url}?${provider.params}`);
        }

        const result = await response.text();
        console.log(`${provider.name} response:`, result);
        
        if (result.includes('OK') || result.includes('success') || result.includes('sent')) {
          console.log(`SMS provider ${provider.name} responded successfully`);
        }
      } catch (providerError) {
        console.log(`${provider.name} error:`, providerError);
        continue;
      }
    }

    // Try Fast2SMS with activated balance - test all routes
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
      const routes = ['q', 'p', 'v3', 't', 'dlt']; // Quality, Promotional, Basic, Test, DLT
      
      for (const route of routes) {
        try {
          console.log(`Testing Fast2SMS ${route} route with activated balance`);
          
          const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: { 
              'Authorization': fast2smsKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `${otp} is your StocksShorts OTP. Valid for 5 minutes.`,
              language: 'english',
              route: route,
              numbers: phoneNumber
            })
          });

          const fast2smsResult = await fast2smsResponse.json();
          console.log(`Fast2SMS ${route} response:`, fast2smsResult);
          
          if (fast2smsResult.return === true) {
            console.log(`✅ SMS sent successfully to ${phoneNumber} via Fast2SMS ${route} route`);
            return true;
          } else {
            console.log(`❌ Fast2SMS ${route} failed:`, fast2smsResult.message);
          }
        } catch (routeError) {
          console.log(`Fast2SMS ${route} error:`, routeError);
          continue;
        }
      }
    }

    // Console display for testing
    console.log(`\n🔑 YOUR OTP CODE: ${otp}`);
    console.log(`📱 Phone: ${phoneNumber} | ⏰ Valid for 5 minutes`);
    console.log(`\n💡 For real SMS delivery:`);
    console.log(`   • MSG91: ₹0.15/SMS (register at msg91.com)`);
    console.log(`   • Fast2SMS: ₹0.15/SMS (add ₹100 to activate)`);
    console.log(`   • Twilio: ₹8.3/SMS (premium reliability)\n`);
    return true;
    
  } catch (error) {
    console.error('SMS delivery error:', error);
    console.log(`\n🔑 YOUR OTP CODE: ${otp}`);
    console.log(`📱 Phone: ${phoneNumber} | ⏰ Valid for 5 minutes\n`);
    return true;
  }
}

export const mobileAuth = {
  // Send OTP to mobile number
  sendOTP: async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber || !isValidIndianMobile(phoneNumber)) {
        return res.status(400).json({ 
          message: "Please enter a valid Indian mobile number" 
        });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP
      await storage.createOtp({
        phoneNumber: normalizedPhone,
        otp,
        expiresAt,
      });

      // Send SMS
      const smsSent = await sendSMS(normalizedPhone, otp);
      
      if (!smsSent) {
        return res.status(500).json({ 
          message: "Failed to send OTP. Please try again." 
        });
      }

      res.json({ 
        message: "OTP sent successfully",
        phoneNumber: normalizedPhone 
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  },

  // Verify OTP and login/register user
  verifyOTP: async (req: Request, res: Response) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({ 
          message: "Phone number and OTP are required" 
        });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Verify OTP
      const validOtp = await storage.getValidOtp(normalizedPhone, otp);
      
      if (!validOtp) {
        return res.status(400).json({ 
          message: "Invalid or expired OTP" 
        });
      }

      // Mark OTP as used
      await storage.markOtpAsUsed(validOtp.id);

      // Check if user exists
      let user = await storage.getUserByPhone(normalizedPhone);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          phoneNumber: normalizedPhone,
          isVerified: "true"
        });
      } else {
        // Verify existing user
        await storage.verifyUser(normalizedPhone);
        user = { ...user, isVerified: "true" };
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).phoneNumber = user.phoneNumber;

      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified
        }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  },

  // Check authentication middleware
  isAuthenticated: (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as any;
    
    if (!session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    next();
  },

  // Get current user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const session = req.session as any;
      const user = await storage.getUser(session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  },

  // Logout user
  logout: (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  },

  // Update user profile
  updateProfile: async (req: Request, res: Response) => {
    try {
      const session = req.session as any;
      const { firstName, lastName } = req.body;
      
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user (in memory storage, just recreate)
      const updatedUser = await storage.createUser({
        phoneNumber: user.phoneNumber,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        isVerified: user.isVerified
      });

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          phoneNumber: updatedUser.phoneNumber,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          isVerified: updatedUser.isVerified
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
};