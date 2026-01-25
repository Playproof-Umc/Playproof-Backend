// src/modules/auth/utils/auth.validator.ts
import { UserRepository } from "../../user/user.repository";
import { conflict, Result, success } from "../../../common/types/result.type";
import { UserErrorCode } from "../../../common/constants/error-code";

interface WithPhone {
  phone: string;
}

interface WithNickname {
  nickname: string;
}

export const checkPhoneNumberDuplicate = (userRepository: UserRepository) => {

  return async <T extends WithPhone>(data: T): Promise<Result<T>> => {
    
    const isPhoneExists = await userRepository.findByPhoneNumber(data.phone);

    if (isPhoneExists) {
      return conflict({ 
        message: "이미 가입된 번호입니다.", 
        errorCode: UserErrorCode.DUPLICATE_PHONE_NUMBER, 
        errors: [
          { field: "phone", value: data.phone, reason: "이미 사용 중인 전화번호입니다." }
        ] 
      }) as Result<T>;
    }

    return success(data); 
  };
};

export const checkNicknameDuplicate = (userRepository: UserRepository) => {
  return async <T extends WithNickname>(data: T): Promise<Result<T>> => {
    
    const isNicknameExists = await userRepository.findByName(data.nickname);
    
    if (isNicknameExists) {
      return conflict( {
        message: "이미 가입된 이름입니다.", 
        errorCode: UserErrorCode.DUPLICATE_NAME,
        errors: [
          { field: "nickname", value: data.nickname, reason: "이미 사용 중인 닉네임입니다." }
        ]
      }) as Result<T>;
    }

    return success(data);
  };
};