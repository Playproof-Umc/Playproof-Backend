import { User } from '.prisma/client';
import { UserErrorCode } from '../../../common/constants/error-code';
import {
  isSuccess,
  notFound,
  ok,
  Result,
} from '../../../common/types/result.type';
import { ChatService } from '../../chat/service/chat.service';
import { UserRepository } from '../../user/user.repository';

export async function validateUserExists(
  userId: number,
  userRepository: UserRepository,
): Promise<Result<User>> {
  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound({
      message: '사용자를 찾을 수 없습니다.',
      errorCode: UserErrorCode.NOT_FOUND,
    });
  }
  return ok(user);
}

export async function validateRoomAccess(
  chatService: ChatService,
  roomId: number,
  userId: number,
): Promise<Result<true>> {
  const access = await chatService.getRoomAndMember(roomId, userId);
  if (!isSuccess(access)) return access;
  return ok(true);
}
