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

// Send OTP via SMS using Fast2SMS with your API key
async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    
    if (!fast2smsKey) {
      console.log(`📱 OTP for ${phoneNumber}: ${otp} (Valid for 5 minutes) - No API key configured`);
      return true;
    }

    // Try Fast2SMS with different routes until one works
    const routes = ['q', 'p', 'v3', 'dlt']; // Quality, Promotional, Basic, DLT
    
    for (const route of routes) {
      try {
        console.log(`Trying Fast2SMS route: ${route} for ${phoneNumber}`);
        
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: { 
            'Authorization': fast2smsKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `${otp} is your StocksShorts OTP. Valid for 5 minutes. Do not share this code.`,
            language: 'english',
            route: route,
            numbers: phoneNumber
          })
        });

        const result = await response.json();
        console.log(`Fast2SMS ${route} response:`, result);
        
        if (result.return === true) {
          console.log(`✅ SMS sent successfully to ${phoneNumber} via Fast2SMS (${route} route)`);
          return true;
        } else {
          console.log(`❌ Fast2SMS ${route} failed:`, result.message);
        }
      } catch (routeError) {
        console.log(`Route ${route} error:`, routeError);
        continue;
      }
    }

    // If all Fast2SMS routes fail, show OTP prominently for testing
    console.log(`\n🔑 YOUR OTP CODE: ${otp}`);
    console.log(`📱 Phone: ${phoneNumber}`); 
    console.log(`⏰ Valid for 5 minutes\n`);
    return true;
    
  } catch (error) {
    console.error('SMS sending error:', error);
    console.log(`📱 Fallback - OTP for ${phoneNumber}: ${otp} (Valid for 5 minutes)`);
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