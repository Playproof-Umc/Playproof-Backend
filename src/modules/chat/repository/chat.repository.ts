import { singleton } from 'tsyringe';
import { prisma } from '../../../common/config/database';
import { ChatRoomCreateReqDto } from '../dtos/chat.req.dto';
import { ChatRoomRole } from '@prisma/client';

@singleton()
export class ChatRepository {
  async createChatRoom(
    azitId: number,
    userId: number,
    dto: ChatRoomCreateReqDto,
  ) {
    return prisma.chatRoom.create({
      data: {
        azitId: BigInt(azitId),
        roomName: dto.roomName,
        roomType: dto.chatType,
        isPrivate: dto.isPrivate ?? false,
        chatRoomParticipation: {
          create: {
            memberId: BigInt(userId),
            role: ChatRoomRole.CREATOR,
          },
        },
      },
    });
  }
  async findChatRoomById(roomId: number) {
    return prisma.chatRoom.findUnique({
      where: { id: BigInt(roomId) },
    });
  }

  // 오직 방 방에 대한 정보만 반환. 메시지는 제외
  async getChatRooms(azitId: number, userId: number) {
    return prisma.chatRoom.findMany({
      where: {
        azitId: BigInt(azitId),
      },
    });
  }

  async findAzitUserByUserIdAndAzitId(userId: number, azitId: bigint) {
    return prisma.azitUser.findFirst({
      where: {
        userId: BigInt(userId),
        azitId,
      },
    });
  }

  async createChat(chatRoomId: number, memberId: bigint, content: string) {
    return prisma.chat.create({
      data: {
        chatRoomId: BigInt(chatRoomId),
        memberId,
        content,
      },
      include: {
        member: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    });
  }

  async listChats(chatRoomId: number, size: number, cursor?: number) {
    return prisma.chat.findMany({
      where: { chatRoomId: BigInt(chatRoomId) },
      orderBy: { id: 'desc' },
      take: size,
      ...(cursor
        ? {
            cursor: { id: BigInt(cursor) },
            skip: 1,
          }
        : {}),
      include: {
        member: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                nickname: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteChatRoom(roomId: bigint) {
    return prisma.chatRoom.delete({
      where: { id: roomId },
    });
  }

  async updateChatRoom(
    roomId: number,
    data: {
      roomName?: string;
      isPrivate?: boolean;
    },
  ) {
    return prisma.chatRoom.update({
      where: { id: BigInt(roomId) },
      data,
    });
  }

  async isRoomCreator(roomId: number, userId: number) {
    const participation = await prisma.chatRoomParticipation.findFirst({
      where: {
        roomId: BigInt(roomId),
        memberId: BigInt(userId),
      },
    });
    return participation?.role === ChatRoomRole.CREATOR;
  }

  async inviteToChatRoom(roomId: number, memberIds: bigint[]) {
    return prisma.chatRoomParticipation.createMany({
      data: memberIds.map((memberId) => ({
        roomId: BigInt(roomId),
        memberId,
      })),
    });
  }
}
