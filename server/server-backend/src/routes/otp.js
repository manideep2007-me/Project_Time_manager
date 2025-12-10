const express = require('express');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/send', [ body('phoneNumber').isString() ], handleValidation, async (req, res) => {
  const { phoneNumber } = req.body;
  console.log('OTP requested to', phoneNumber);
  
  // Generate a 6-digit OTP for development
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // In production, you would send this via SMS service (Twilio, AWS SNS, etc.)
  console.log(`Generated OTP for ${phoneNumber}: ${otp}`);
  
  return res.json({ 
    success: true, 
    message: 'OTP sent successfully',
    otp: otp // Include OTP in development for testing
  });
});

router.post('/verify', [ body('phoneNumber').isString(), body('otp').isString() ], handleValidation, async (req, res) => {
  const { phoneNumber, otp } = req.body;
  console.log('OTP verification requested for', phoneNumber, 'with OTP:', otp);
  
  // In development, accept any 6-digit OTP
  // In production, verify against stored OTP
  const isValid = otp && otp.length === 6;
  
  return res.json({ 
    success: isValid,
    message: isValid ? 'OTP verified successfully' : 'Invalid OTP'
  });
});

router.post('/resend', [ body('phoneNumber').isString() ], handleValidation, async (req, res) => {
  const { phoneNumber } = req.body;
  console.log('OTP resend requested for', phoneNumber);
  
  // Generate a new 6-digit OTP for development
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // In production, you would send this via SMS service (Twilio, AWS SNS, etc.)
  console.log(`Resent OTP for ${phoneNumber}: ${otp}`);
  
  return res.json({ 
    success: true, 
    message: 'OTP resent successfully',
    otp: otp // Include OTP in development for testing
  });
});

module.exports = router;

