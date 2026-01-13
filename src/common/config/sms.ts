// src/common/config/sms.ts
import "dotenv/config";

export const smsConfig = {
  verificationTTL: Number(process.env.SMS_CERTIFICATION_TTL) || 300, 
};