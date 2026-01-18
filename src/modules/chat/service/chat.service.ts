import { inject, injectable } from "tsyringe";
import { ChatRepository } from "../repository/chat.repository";
import { ChatMessageListResDto, ChatMessageResDto } from "../dtos/chat.res.dto";
import { ChatErrorCode } from "../../../common/constants/error-code";
import { Result, forbidden, internalServerError, isSuccess, notFound, ok } from "../../../common/types/result.type";

@injectable()
export class ChatService {
  constructor(@inject(ChatRepository) private chatRepository: ChatRepository) {}

  private async getRoomAndMember(roomId: number, userId: number) {
    const room = await this.chatRepository.findChatRoomById(roomId);
    if (!room) {
      return notFound({
        message: "채팅방을 찾을 수 없습니다.",
        errorCode: ChatErrorCode.ROOM_NOT_FOUND,
      });
    }

    const member = await this.chatRepository.findAzitUserByUserIdAndAzitId(userId, room.azitId);
    if (!member) {
      return forbidden({
        message: "아지트 멤버만 채팅할 수 있습니다.",
        errorCode: ChatErrorCode.AZIT_MEMBER_ONLY,
      });
    }

    return ok({ room, member });
  }

  async joinRoom(roomId: number, userId: number): Promise<Result<{ roomId: number; azitId: number }>> {
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    return ok({
      roomId: Number(access.data.room.id),
      azitId: Number(access.data.room.azitId),
    });
  }

  async sendMessage(roomId: number, userId: number, content: string): Promise<Result<ChatMessageResDto>> {
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    try {
      const chat = await this.chatRepository.createChat(roomId, access.data.member.id, content);
      return ok({
        id: Number(chat.id),
        chatRoomId: Number(chat.chatRoomId),
        memberId: Number(chat.memberId),
        userId: Number(chat.member.userId),
        nickname: chat.member.user.nickname,
        content: chat.content,
        createdAt: chat.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Failed to create chat:", error);
      return internalServerError({
        message: "메시지 저장에 실패했습니다.",
        errorCode: ChatErrorCode.MESSAGE_CREATE_FAILED,
      });
    }
  }

  async getMessages(
    roomId: number,
    userId: number,
    options: { size?: number; cursor?: number }
  ): Promise<Result<ChatMessageListResDto>> {
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    const size = options.size ?? 50;
    const cursor = options.cursor;

    const chats = await this.chatRepository.listChats(roomId, size, cursor);
    const messages = chats
      .map((chat) => ({
        id: Number(chat.id),
        chatRoomId: Number(chat.chatRoomId),
        memberId: Number(chat.memberId),
        userId: Number(chat.member.userId),
        nickname: chat.member.user.nickname,
        content: chat.content,
        createdAt: chat.createdAt.toISOString(),
      }))
      .reverse();

    const nextCursor = chats.length === size ? Number(chats[chats.length - 1].id) : null;

    return ok({
      messages,
      nextCursor,
    });
  }
}
