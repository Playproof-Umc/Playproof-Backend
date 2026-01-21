import { ChatErrorCode } from '../../../common/constants/error-code';
import { forbidden, notFound, ok, Result } from '../../../common/types/result.type';
import { ChatRepository } from '../repository/chat.repository';

type ChatRoom = Awaited<ReturnType<ChatRepository['findChatRoomById']>>;
type AzitMember = Awaited<
  ReturnType<ChatRepository['findAzitUserByUserIdAndAzitId']>
>;

export async function validateRoomExists(
  chatRepository: ChatRepository,
  roomId: number,
): Promise<Result<NonNullable<ChatRoom>>> {
  const room = await chatRepository.findChatRoomById(roomId);
  if (!room) {
    return notFound({
      message: '채팅방을 찾을 수 없습니다.',
      errorCode: ChatErrorCode.ROOM_NOT_FOUND,
    });
  }

  return ok(room);
}

export async function validateAzitMemberOnly(
  chatRepository: ChatRepository,
  userId: number,
  azitId: bigint,
): Promise<Result<NonNullable<AzitMember>>> {
  const member = await chatRepository.findAzitUserByUserIdAndAzitId(
    userId,
    azitId,
  );
  if (!member) {
    return forbidden({
      message: '아지트 멤버만 채팅할 수 있습니다.',
      errorCode: ChatErrorCode.AZIT_MEMBER_ONLY,
    });
  }

  return ok(member);
}

export async function validateRoomAndMember(
  chatRepository: ChatRepository,
  roomId: number,
  userId: number,
): Promise<Result<{ room: NonNullable<ChatRoom>; member: NonNullable<AzitMember> }>> {
  const roomResult = await validateRoomExists(chatRepository, roomId);
  if (roomResult.error) return roomResult;

  const memberResult = await validateAzitMemberOnly(
    chatRepository,
    userId,
    roomResult.data.azitId,
  );
  if (memberResult.error) return memberResult;

  return ok({ room: roomResult.data, member: memberResult.data });
}
