// src/modules/ban/utills/ban.validator.ts

import { isSuccess, badRequest, notFound, Result, success } from "../../../common/types/result.type";
import { BanErrorCode } from "../../../common/constants/error-code";
import { UserRepository } from "../../user/user.repository";
import { checkUserExists } from "../../user/utills/user.validator";

interface WithTargetId {
  userId: number,
  targetId: number
}

// 차단 요청자와 피차단인이 동일한지 검증
export const checkSameUser = () => {
  return async <T extends WithTargetId>(data: T): Promise<Result<T>> => {
    
    if (data.userId === data.targetId) {
      return badRequest({ 
        message: "자기 자신을 차단할 수 없습니다.", 
        errorCode: BanErrorCode.BAD_REQUEST.SELF_BAN_NOT_ALLOWED 
      }) as Result<T>;
    }
    return success(data);
  };
};

// 차단 대상 사용자가 존재하는지 검증
export const checkTargetUserExists = (userRepository: UserRepository) => {
  return async <T extends WithTargetId>(data: T): Promise<Result<T>> => {
    
    const checkResult = await checkUserExists(userRepository)({ userId: data.targetId });

    if (!isSuccess(checkResult)) {
      return notFound({ 
        message: "차단할 대상을 찾을 수 없습니다.", 
        errorCode: BanErrorCode.NOT_FOUND.TARGET_USER_NOT_FOUND 
      }) as Result<T>;
    }

    return success(data);
  };
};