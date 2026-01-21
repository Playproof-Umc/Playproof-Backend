import { User } from '.prisma/client';
import { UserErrorCode } from '../../../common/constants/error-code';
import { notFound, ok, Result } from '../../../common/types/result.type';
import { ChatService } from '../../chat/service/chat.service';
import { UserRepository } from '../../user/user.repository';

type RoomAccessResult = Awaited<ReturnType<ChatService['getRoomAndMember']>>;

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
): Promise<RoomAccessResult> {
  return chatService.getRoomAndMember(roomId, userId);
}