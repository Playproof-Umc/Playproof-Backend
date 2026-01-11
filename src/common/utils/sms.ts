// src/common/utils/sms.ts
import mysms from "coolsms-node-sdk";
import "dotenv/config";
import { Result, ok, internalServerError } from "../types/result.type";

const API_KEY = process.env.SOLAPI_API_KEY!;
const API_SECRET = process.env.SOLAPI_API_SECRET!;
const SENDER_PHONE = process.env.SOLAPI_SENDER_PHONE!;

const messageService = new mysms(API_KEY, API_SECRET);

export const sendVerificationSms = async (toPhoneNumber: string, code: string): Promise<Result<boolean>> => {
  const text = `[Playproof] 인증 번호는 [${code}]입니다. 타인에게 노출하지 마세요.`;

  try {
    const response = await messageService.sendOne({
      to: toPhoneNumber,
      from: SENDER_PHONE,
      text: text,
      autoTypeDetect: true,
    });

    console.log(`✅ SMS 발송 성공 (${toPhoneNumber}):`, response);
    
    return ok(true);

  } catch (error: any) {
    console.error("❌ SMS 발송 실패:", error);

    // 에러 메시지 추출
    const errorDetail = error.response?.data?.message || error.message || "Unknown Error";

    return internalServerError({
      message: "문자 발송 시스템에 오류가 발생했습니다.",
      errorCode: "SMS_SEND_FAILED",
      errors: [
        { 
          field: "sms", 
          value: toPhoneNumber, 
          reason: errorDetail 
        }
      ]
    });
  }
};