import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";

@singleton()
export class ChatRepository {
  async findChatRoomById(roomId: number) {
    return prisma.chatRoom.findUnique({
      where: { id: BigInt(roomId) },
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
      orderBy: { id: "desc" },
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
}
