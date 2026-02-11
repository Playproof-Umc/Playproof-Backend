// src/modules/users/utils/user.validator.ts
import { UserRepository } from "../user.repository";
import { conflict, notFound, Result, success } from "../../../common/types/result.type";
import { PartyErrorCode, UserErrorCode } from "../../../common/constants/error-code";
import { prisma } from "../../../common/config/database"; 

interface WithId {
  userId: number;
}

export const checkUserExists = (userRepository: UserRepository) => {
  return async <T extends WithId>(data: T): Promise<Result<T>> => {
    
    const user = await userRepository.findById(data.userId);

    if (!user) {
      return notFound({ 
        message: "유저를 찾을 수 없습니다.", 
        errorCode: UserErrorCode.NOT_FOUND 
      }) as Result<T>;
    }

    return success(data);
  };
};

interface WithGameId {
  gameId: number;
}

interface WithAccountInfo {
  userId: number;
  gameId: number;
  accountId: string;
}

export const checkGameExists = () => {
  return async <T extends WithGameId>(data: T): Promise<Result<T>> => {
    const game = await prisma.game.findUnique({
      where: { id: BigInt(data.gameId) }
    });

    if (!game) {
      return notFound({
        message: "게임을 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_GAME
      }) as Result<T>;
    }

    return success(data);
  };
};

export const checkDuplicateGameAccount = (userRepository: UserRepository) => {
  return async <T extends WithAccountInfo>(data: T): Promise<Result<T>> => {
    const existing = await userRepository.findUserGameAccount(
      data.userId,
      data.gameId,
      data.accountId
    );

    if (existing) {
      return conflict({
        message: "이미 등록된 게임 계정입니다.",
        errorCode: UserErrorCode.DUPLICATE_GAME_ACCOUNT,
        errors: [
          { field: "accountId", value: data.accountId, reason: "이미 등록된 계정입니다." }
        ]
      }) as Result<T>;
    }

    return success(data);
  };
};