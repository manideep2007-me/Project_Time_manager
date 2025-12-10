// OTP Service for phone number verification
// In a real app, this would integrate with SMS providers like Twilio, AWS SNS, etc.

import { API_BASE_URL } from '../utils/config';

export interface OTPData {
  phoneNumber: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

class OTPService {
  private static instance: OTPService;
  private otpStorage: Map<string, OTPData> = new Map();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  static getInstance(): OTPService {
    if (!OTPService.instance) {
      OTPService.instance = new OTPService();
    }
    return OTPService.instance;
  }

  // Generate a random OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Format phone number to standard format
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    return `+91${cleaned}`;
  }

  // Validate phone number format
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: string } {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const cleaned = formatted.replace(/\D/g, '');
    
    // Check if it's a valid Indian phone number
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return { isValid: true };
    }
    
    // Check if it's a 10-digit number (will add +91)
    if (cleaned.length === 10) {
      return { isValid: true };
    }
    
    return { 
      isValid: false, 
      error: 'Please enter a valid 10-digit phone number' 
    };
  }

  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return { success: false, message: validation.error || 'Invalid phone number' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Call backend API to send OTP
      const response = await fetch(`${API_BASE_URL}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone.replace('+91', '') // Send without country code
        }),
      });

      const result = await response.json();
      
      // Handle both new format (with success field) and old format (without success field)
      const isSuccess = result.success === true || result.success === undefined;
      
      if (isSuccess) {
        // Generate OTP locally if backend doesn't provide one (for development)
        const generatedOtp = result.otp || Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP data locally for verification
        const expiresAt = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
        this.otpStorage.set(formattedPhone, {
          phoneNumber: formattedPhone,
          otp: generatedOtp,
          expiresAt,
          attempts: 0
        });

        console.log(`OTP sent to ${formattedPhone}: ${generatedOtp}`);
        
        return { 
          success: true, 
          message: result.message || 'OTP sent successfully',
          otp: generatedOtp // Only for development - remove in production
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Failed to send OTP' 
        };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return { 
        success: false, 
        message: 'Failed to send OTP. Please check your internet connection.' 
      };
    }
  }

  // Verify OTP
  async verifyOTP(phoneNumber: string, enteredOTP: string): Promise<{ success: boolean; message: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Call backend API to verify OTP
      const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone.replace('+91', ''), // Send without country code
          otp: enteredOTP
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Clear local OTP data on successful verification
        this.otpStorage.delete(formattedPhone);
        return { 
          success: true, 
          message: result.message 
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Invalid OTP' 
        };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { 
        success: false, 
        message: 'Failed to verify OTP. Please check your internet connection.' 
      };
    }
  }

  // Resend OTP
  async resendOTP(phoneNumber: string): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return { success: false, message: validation.error || 'Invalid phone number' };
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Call backend API to resend OTP
      const response = await fetch(`${API_BASE_URL}/api/otp/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone.replace('+91', '') // Send without country code
        }),
      });

      const result = await response.json();
      
      // Handle both new format (with success field) and old format (without success field)
      const isSuccess = result.success === true || result.success === undefined;
      
      if (isSuccess) {
        // Generate OTP locally if backend doesn't provide one (for development)
        const generatedOtp = result.otp || Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP data locally for verification
        const expiresAt = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
        this.otpStorage.set(formattedPhone, {
          phoneNumber: formattedPhone,
          otp: generatedOtp,
          expiresAt,
          attempts: 0
        });

        console.log(`OTP resent to ${formattedPhone}: ${generatedOtp}`);
        
        return { 
          success: true, 
          message: result.message || 'OTP resent successfully',
          otp: generatedOtp // Only for development - remove in production
        };
      } else {
        return { 
          success: false, 
          message: result.message || 'Failed to resend OTP' 
        };
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { 
        success: false, 
        message: 'Failed to resend OTP. Please check your internet connection.' 
      };
    }
  }

  // Get remaining time for OTP
  getRemainingTime(phoneNumber: string): number {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const otpData = this.otpStorage.get(formattedPhone);
    
    if (!otpData || otpData.expiresAt < Date.now()) {
      return 0;
    }
    
    return Math.ceil((otpData.expiresAt - Date.now()) / 1000);
  }

  // Clear expired OTPs (cleanup method)
  clearExpiredOTPs(): void {
    const now = Date.now();
    for (const [phone, otpData] of this.otpStorage.entries()) {
      if (otpData.expiresAt < now) {
        this.otpStorage.delete(phone);
      }
    }
  }

  // Mock SMS sending (for development)
  private async sendSMS(phoneNumber: string, otp: string): Promise<void> {
    // In a real app, integrate with SMS provider
    // Example with Twilio:
    // await twilioClient.messages.create({
    //   body: `Your OTP is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
    
    console.log(`SMS would be sent to ${phoneNumber}: Your OTP is ${otp}`);
  }
}

export default OTPService.getInstance();
