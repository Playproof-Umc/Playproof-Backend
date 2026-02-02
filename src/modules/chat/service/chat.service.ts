import { inject, injectable } from 'tsyringe';
import { ChatRepository } from '../repository/chat.repository';
import {
  ChatMessageListResDto,
  ChatMessageResDto,
  ChatRoomCreateResDto,
  ChatRoomGetResDto,
} from '../dtos/chat.res.dto';
import { ChatErrorCode } from '../../../common/constants/error-code';
import {
  Result,
  created,
  forbidden,
  internalServerError,
  isSuccess,
  ok,
} from '../../../common/types/result.type';
import {
  validateAzitMemberOnly,
  validateIsRoomCreator,
  validateMessageContent,
  validateRoomAndMember,
} from '../utils/chat.validator';
import {
  ChatRoomCreateReqDto,
  ChatRoomUpdateReqDto,
  ChatType,
} from '../dtos/chat.req.dto';
import { ChatRoom, ChatRoomRole } from '.prisma/client';

@injectable()
export class ChatService {
  constructor(@inject(ChatRepository) private chatRepository: ChatRepository) {}

  async getChatRooms(
    azitId: number,
    userId: number,
  ): Promise<Result<ChatRoomGetResDto[]>> {
    const memberAccess = await validateAzitMemberOnly(
      this.chatRepository,
      userId,
      BigInt(azitId),
    );
    if (!isSuccess(memberAccess)) return memberAccess;

    const chatRooms = await this.chatRepository.getChatRooms(azitId, userId);
    return ok<ChatRoomGetResDto[]>(
      chatRooms.map(
        (chatRoom: ChatRoom): ChatRoomGetResDto => ({
          id: Number(chatRoom.id),
          roomName: chatRoom.roomName,
          chatType: chatRoom.roomType as ChatType,
          isPrivate: chatRoom.isPrivate,
          createdAt: chatRoom.createdAt.toISOString(),
          updatedAt: chatRoom.updatedAt.toISOString(),
        }),
      ),
    );
  }

  async joinRoom(
    roomId: number,
    userId: number,
  ): Promise<Result<{ roomId: number; azitId: number }>> {
    const access = await validateRoomAndMember(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(access)) return access;

    return ok({
      roomId: Number(access.data.room.id),
      azitId: Number(access.data.room.azitId),
    });
  }

  async sendMessage(
    roomId: number,
    userId: number,
    content: string,
  ): Promise<Result<ChatMessageResDto>> {
    const contentResult = validateMessageContent(content);
    if (!isSuccess(contentResult)) return contentResult;

    const access = await validateRoomAndMember(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(access)) return access;

    try {
      const chat = await this.chatRepository.createChat(
        roomId,
        access.data.member.id,
        contentResult.data.content,
      );
      return created({
        id: Number(chat.id),
        chatRoomId: Number(chat.chatRoomId),
        memberId: Number(chat.memberId),
        userId: Number(chat.member.userId),
        nickname: chat.member.user.nickname,
        content: chat.content,
        createdAt: chat.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Failed to create chat:', error);
      return internalServerError({
        message: '메시지 저장에 실패했습니다.',
        errorCode: ChatErrorCode.MESSAGE_CREATE_FAILED,
      });
    }
  }

  async getMessages(
    roomId: number,
    userId: number,
    options: { size?: number; cursor?: number },
  ): Promise<Result<ChatMessageListResDto>> {
    const access = await validateRoomAndMember(
      this.chatRepository,
      roomId,
      userId,
    );
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

    const nextCursor =
      chats.length === size ? Number(chats[chats.length - 1].id) : null;

    return ok({
      messages,
      nextCursor,
    });
  }

  async createChatRoom(
    azitId: number,
    userId: number,
    dto: ChatRoomCreateReqDto,
  ): Promise<Result<ChatRoomCreateResDto>> {
    const chatRoom = await this.chatRepository.createChatRoom(
      azitId,
      userId,
      dto,
    );
    return created({
      roomId: Number(chatRoom.id),
    });
  }

  async updateChatRoom(
    roomId: number,
    userId: number,
    dto: ChatRoomUpdateReqDto,
  ): Promise<Result<ChatRoomGetResDto>> {
    const access = await validateRoomAndMember(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(access)) return access;

    const isCreator = await validateIsRoomCreator(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(isCreator)) return isCreator;

    const updateData: {
      roomName?: string;
      isPrivate?: boolean;
    } = {};

    if (dto.roomName !== undefined) updateData.roomName = dto.roomName;
    if (dto.isPrivate !== undefined) updateData.isPrivate = dto.isPrivate;

    if (Object.keys(updateData).length === 0) {
      const { room } = access.data;
      return ok({
        id: Number(room.id),
        roomName: room.roomName,
        chatType: room.roomType as ChatType,
        isPrivate: room.isPrivate,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
      });
    }

    const updatedRoom = await this.chatRepository.updateChatRoom(
      roomId,
      updateData,
    );
    return ok({
      id: Number(updatedRoom.id),
      roomName: updatedRoom.roomName,
      chatType: updatedRoom.roomType as ChatType,
      isPrivate: updatedRoom.isPrivate,
      createdAt: updatedRoom.createdAt.toISOString(),
      updatedAt: updatedRoom.updatedAt.toISOString(),
    });
  }

  async deleteChatRoom(
    roomId: number,
    userId: number,
  ): Promise<Result<string>> {
    const access = await validateRoomAndMember(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(access)) return access;

    const isCreator = await validateIsRoomCreator(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(isCreator)) return isCreator;

    await this.chatRepository.deleteChatRoom(BigInt(roomId));
    return ok(`${roomId} 채팅방이 삭제되었습니다.`);
  }
}
