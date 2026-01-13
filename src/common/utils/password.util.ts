import bcrypt from "bcrypt";
import { authConfig } from "../config/auth";
import { Result, ok, internalServerError } from "../types/result.type";
import { AuthErrorCode } from "../constants/error-code"; 

// 비밀번호 해싱
export const hashPassword = async (password: string): Promise<Result<string>> => {
  try {
    const hashed = await bcrypt.hash(password, authConfig.passwordSaltRounds);
    return ok(hashed);
    
  } catch (error: any) {
    console.error("❌ Password Hash Failed:", error);
    
    return internalServerError({
      message: "비밀번호 암호화 중 오류가 발생했습니다.",
      errorCode: AuthErrorCode.ENCRYPTION_FAILED, 
      errors: [
        { field: "password", value: "hidden", reason: error.message }
      ]
    });
  }
};

// 평문 비밀번호와 해싱 비밀번호와 비교
export const comparePassword = async (plain: string, hashed: string): Promise<Result<boolean>> => {
  try {
    const isMatch = await bcrypt.compare(plain, hashed);
    return ok(isMatch);

  } catch (error: any) {
    console.error("❌ Password Compare Failed:", error);

    return internalServerError({
      message: "비밀번호 검증 시스템에 오류가 발생했습니다.",
      errorCode: AuthErrorCode.COMPARE_ERROR,
      errors: [
        { field: "password", value: "hidden", reason: error.message }
      ]
    });
  }
};