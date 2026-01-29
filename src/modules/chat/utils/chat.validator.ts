import { ChatErrorCode } from '../../../common/constants/error-code';
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  Result,
} from '../../../common/types/result.type';
import { ChatRepository } from '../repository/chat.repository';
import { CHAT_MESSAGE_MAX_LENGTH } from '../dtos/chat.req.dto';

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

export function validateMessageContent(content?: string): Result<{ content: string }> {
  const trimmed = content?.trim();
  if (!trimmed) {
    return badRequest({
      message: '메시지 입력이 올바르지 않습니다.',
      errorCode: ChatErrorCode.MESSAGE_INVALID,
    });
  }

  if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH) {
    return badRequest({
      message: `메시지는 ${CHAT_MESSAGE_MAX_LENGTH}자를 초과할 수 없습니다.`,
      errorCode: ChatErrorCode.MESSAGE_TOO_LONG,
    });
  }

  return ok({ content: trimmed });
}
