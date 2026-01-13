// src/modules/auth/utils/auth.validator.ts

import { UserRepository } from "../../user/user.repository";
import { conflict, Result } from "../../../common/types/result.type";
import { UserErrorCode } from "../../../common/constants/error-code";

// 전화번호 중복 확인(이미 존재하는 유저)
export const checkPhoneNumberDuplicate = async <T> (
  userRepository: UserRepository, 
  phone: string
): Promise<Result<T> | null> => {
  
  const isPhoneExists = await userRepository.findByPhoneNumber(phone);

  if (isPhoneExists) {
    return conflict({ 
      message: "이미 가입된 번호입니다.", 
      errorCode: UserErrorCode.DUPLICATE_PHONE_NUMBER, 
      errors: [
        { field: "phone", value: phone, reason: "이미 사용 중인 전화번호입니다." }
      ] 
    }) as Result<T>;
  }

  return null; 
};

// 닉네임 중복 확인(이미 존재하는 닉네임)
export const checkNicknameDuplicate = async <T>(
    userRepository: UserRepository,
    nickname: string
): Promise<Result<T> | null> => {
    const isNicknameExists = await userRepository.findByName(nickname);
    
    if (isNicknameExists) {
      return conflict( {
        message: "이미 가입된 이름입니다.",
        errorCode: UserErrorCode.DUPLICATE_NAME,
        errors: [
          { field: "nickname", value: nickname, reason: "이미 사용 중인 닉네임입니다." }
        ]
      }) as Result<T>;
    }

    return null;
} 
