import { inject, injectable } from 'tsyringe';
import { ChatRepository } from '../repository/chat.repository';
import {
  ChatMessageListResDto,
  ChatMessageResDto,
  ChatRoomCreateResDto,
  ChatRoomGetResDto,
  ChatRoomInviteResDto,
  ChatRoomMemberResDto,
} from '../dtos/chat.res.dto';
import { ChatErrorCode } from '../../../common/constants/error-code';
import {
  Result,
  badRequest,
  created,
  internalServerError,
  isSuccess,
  ok,
} from '../../../common/types/result.type';
import { uploadFileToS3 } from '../../../common/utils/file-util';
import {
  validateAzitMemberOnly,
  validateIsRoomCreator,
  validateMessageContentOrMedia,
  validateMembersNotInRoom,
  validateRoomAndMember,
  validateRoomIsPrivate,
  validatePrivateRoomMember,
} from '../utils/chat.validator';
import {
  ChatRoomCreateReqDto,
  ChatRoomInviteReqDto,
  ChatRoomUpdateReqDto,
  ChatType,
} from '../dtos/chat.req.dto';
import { ChatRoom, ChatRoomParticipation, ChatRoomRole } from '.prisma/client';

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
    const accessibleRooms = await Promise.all(
      chatRooms.map(async (chatRoom) => {
        if (!chatRoom.isPrivate) return chatRoom;
        const isMember = await this.chatRepository.isRoomMember(
          Number(chatRoom.id),
          userId,
        );
        return isMember ? chatRoom : null;
      }),
    );
    const filteredRooms = accessibleRooms.filter(
      (chatRoom): chatRoom is ChatRoom => chatRoom !== null,
    );

    return ok<ChatRoomGetResDto[]>(
      filteredRooms.map(
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

  public async getRoomAndMember(roomId: number, userId: number) {
    return validateRoomAndMember(this.chatRepository, roomId, userId);
  }

  async uploadChatImage(
    roomId: number,
    userId: number,
    file?: Express.Multer.File,
  ): Promise<Result<{ mediaUrl: string }>> {
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    if (!file || !file.buffer) {
      return badRequest({
        message: '이미지 파일이 필요합니다.',
        errorCode: ChatErrorCode.MESSAGE_INVALID,
      });
    }

    const isImage = file.mimetype?.startsWith('image/');
    if (!isImage) {
      return badRequest({
        message: '이미지 파일만 업로드 가능합니다.',
        errorCode: ChatErrorCode.MESSAGE_INVALID,
      });
    }

    const uploadResult = await uploadFileToS3(file, 'chat');
    if (!isSuccess(uploadResult)) return uploadResult;

    return created({ mediaUrl: uploadResult.data });
  }

  async joinRoom(
    roomId: number,
    userId: number,
  ): Promise<Result<{ roomId: number; azitId: number }>> {
    const access = await this.getRoomAndMember(roomId, userId);
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
    mediaUrls?: string[],
  ): Promise<Result<ChatMessageResDto>> {
    const messageResult = validateMessageContentOrMedia(content, mediaUrls);
    if (!isSuccess(messageResult)) return messageResult;

    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    try {
      const chat = await this.chatRepository.createChatWithMedias(
        roomId,
        access.data.member.id,
        messageResult.data.content,
        messageResult.data.mediaUrls ?? [],
      );
      const mediaUrlsRes = chat.medias
        .sort((a, b) => Number(a.id) - Number(b.id))
        .map((m) => m.mediaUrl);
      return created({
        id: Number(chat.id),
        chatRoomId: Number(chat.chatRoomId),
        memberId: Number(chat.memberId),
        userId: Number(chat.member.userId),
        nickname: chat.member.user.nickname,
        content: chat.content,
        mediaUrls: mediaUrlsRes.length > 0 ? mediaUrlsRes : undefined,
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
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;
    const privateAccess = await validatePrivateRoomMember(
      this.chatRepository,
      access.data.room,
      userId,
    );
    if (!isSuccess(privateAccess)) return privateAccess;

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
        mediaUrls:
          chat.medias?.length > 0
            ? chat.medias.map((m) => m.mediaUrl)
            : undefined,
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
    const memberAccess = await validateAzitMemberOnly(
      this.chatRepository,
      userId,
      BigInt(azitId),
    );
    if (!isSuccess(memberAccess)) return memberAccess;

    const chatRoom = await this.chatRepository.createChatRoom(
      azitId,
      memberAccess.data.id,
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
    const access = await this.getRoomAndMember(roomId, userId);
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
    const access = await this.getRoomAndMember(roomId, userId);
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

  async inviteToChatRoom(
    roomId: number,
    userId: number,
    dto: ChatRoomInviteReqDto,
  ): Promise<Result<ChatRoomInviteResDto>> {
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    const privateRoom = validateRoomIsPrivate(access.data.room);
    if (!isSuccess(privateRoom)) return privateRoom;

    const isCreator = await validateIsRoomCreator(
      this.chatRepository,
      roomId,
      userId,
    );
    if (!isSuccess(isCreator)) return isCreator;

    const notInvited = await validateMembersNotInRoom(
      this.chatRepository,
      roomId,
      dto.memberIds,
    );
    if (!isSuccess(notInvited)) return notInvited;

    const memberIds = dto.memberIds.map((id) => BigInt(id));
    const invitations = await this.chatRepository.inviteToChatRoom(
      roomId,
      memberIds,
    );

    // 초대된 멤버 수 반환
    return ok({
      invitations: invitations.count,
    });
  }

  async getPrivateRoomMembers(
    roomId: number,
    userId: number,
  ): Promise<Result<ChatRoomMemberResDto[]>> {
    const access = await this.getRoomAndMember(roomId, userId);
    if (!isSuccess(access)) return access;

    const privateRoom = validateRoomIsPrivate(access.data.room);
    if (!isSuccess(privateRoom)) return privateRoom;

    const privateAccess = await validatePrivateRoomMember(
      this.chatRepository,
      access.data.room,
      userId,
    );
    if (!isSuccess(privateAccess)) return privateAccess;

    const members = await this.chatRepository.getRoomMembers(roomId);
    return ok(
      members.map(
        (member): ChatRoomMemberResDto => ({
          id: Number(member.memberId),
          nickname: member.member.user.nickname,
          avatarUrl:
            member.member.user.userAvatars[0]?.avatar?.avatarUrl ?? null,
          role: member.role,
        }),
      ),
    );
  }
}
