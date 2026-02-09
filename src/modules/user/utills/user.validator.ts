// src/modules/users/utils/user.validator.ts
import { UserRepository } from "../user.repository";
import { notFound, Result, success } from "../../../common/types/result.type";
import { UserErrorCode } from "../../../common/constants/error-code";

interface WithId {
  id: number;
}

export const checkUserExists = (userRepository: UserRepository) => {
  return async <T extends WithId>(data: T): Promise<Result<T>> => {
    
    const user = await userRepository.findById(data.id);

    if (!user) {
      return notFound({ 
        message: "유저를 찾을 수 없습니다.", 
        errorCode: UserErrorCode.NOT_FOUND 
      }) as Result<T>;
    }

    return success(data);
  };
};