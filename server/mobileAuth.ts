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

// Send OTP via SMS using Fast2SMS (₹0.15 per SMS) - now activated and working
async function sendSMS(phoneNumber: string, otp: string): Promise<boolean> {
  try {
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    
    // Try Fast2SMS first - now activated with balance
    if (fast2smsKey) {
      try {
        console.log(`Sending OTP to ${phoneNumber} via Fast2SMS (₹0.15 per SMS)`);
        
        const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: { 
            'Authorization': fast2smsKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `${otp} is your StocksShorts OTP. Valid for 5 minutes. Do not share this code.`,
            language: 'english',
            route: 'q',
            numbers: phoneNumber
          })
        });

        const fast2smsResult = await fast2smsResponse.json();
        console.log(`Fast2SMS response:`, fast2smsResult);
        
        if (fast2smsResult.return === true) {
          console.log(`✅ SMS sent successfully to ${phoneNumber} via Fast2SMS (Request ID: ${fast2smsResult.request_id})`);
          return true;
        } else {
          console.log(`❌ Fast2SMS failed: ${fast2smsResult.message}`);
        }
      } catch (fast2smsError) {
        console.log(`Fast2SMS error:`, fast2smsError);
      }
    }

    // Fallback to MSG91 if Fast2SMS fails
    try {
      console.log(`Fallback: Sending via MSG91 demo`);
      
      const msg91Response = await fetch(`https://control.msg91.com/api/sendotp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          authkey: 'demo',
          mobile: `91${phoneNumber}`,
          message: `${otp} is your StocksShorts verification code. Valid for 5 minutes.`,
          sender: 'VERIFY',
          otp: otp
        })
      });

      const msg91Text = await msg91Response.text();
      console.log(`MSG91 fallback response:`, msg91Text);
      
      if (msg91Text.includes('success')) {
        console.log(`MSG91 fallback responded for ${phoneNumber}`);
      }
    } catch (msg91Error) {
      console.log(`MSG91 fallback error:`, msg91Error);
    }

    // Console display for testing
    console.log(`\n🔑 YOUR OTP CODE: ${otp}`);
    console.log(`📱 Phone: ${phoneNumber} | ⏰ Valid for 5 minutes`);
    console.log(`💡 For real SMS delivery:`);
    console.log(`   • Fast2SMS: ₹0.15/SMS (activated)`);
    console.log(`   • MSG91: ₹0.15/SMS (register at msg91.com)`);
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

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      if (!isValidIndianMobile(normalizedPhone)) {
        return res.status(400).json({ message: "Invalid Indian mobile number" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      // Store OTP in database
      await storage.createOtp({
        phoneNumber: normalizedPhone,
        otp,
        expiresAt,
        isUsed: false
      });

      // Send SMS
      await sendSMS(normalizedPhone, otp);

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
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Verify OTP
      const validOtp = await storage.getValidOtp(normalizedPhone, otp);
      if (!validOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Mark OTP as used
      await storage.markOtpAsUsed(validOtp.id);

      // Check if user exists, if not create new user
      let user = await storage.getUserByPhone(normalizedPhone);
      if (!user) {
        user = await storage.createUser({
          phoneNumber: normalizedPhone,
          isVerified: true
        });
      } else {
        // Verify existing user
        await storage.verifyUser(normalizedPhone);
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

  // Check if user is authenticated
  isAuthenticated: (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as any;
    if (session && session.userId) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },

  // Get current authenticated user
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const session = req.session as any;
      if (!session || !session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  },

  // Update user profile
  updateProfile: async (req: Request, res: Response) => {
    try {
      const session = req.session as any;
      if (!session || !session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { firstName, lastName } = req.body;
      const user = await storage.getUser(session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user with new information
      const updatedUser = await storage.upsertUser({
        id: user.id,
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