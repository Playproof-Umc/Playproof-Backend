import { prisma } from "../../../common/config/database"; 
import { singleton } from "tsyringe";

@singleton()
export class PartyRepository {
  async createParty(data: any, userId: number, azitId: number, tx?: any) {
    const client = tx || prisma;
    const { positionIds, gameId, tierId, azitName, azitIconUrl, ...rest } = data;
    return client.partyPost.create({
      data: {
        ...rest,
        postPositions: {
          create: positionIds.map((id: number) => ({ positionId: id })),
        },
        user: {
          connect: {
            id: userId,
          },
        },
        game: {
          connect: {
            id: gameId,
          },
        },
        tier: tierId
          ? {
              connect: {
                id: tierId,
              },
            }
          : undefined,
        azit: {
          connect: {
            id: azitId,
          },
        },
      },
    });
  }

  // 아지트 작업 완료 후 AzitService/Repository로 이동 필요
  async createTempAzit(azitName: string, imageUrl: string, tx?: any) {
    const client = tx || prisma;
    return client.azit.create({
      data: {
        azitName,
        imageUrl,
      },
    });
  }

  async findGameById(id: number) {
    return prisma.game.findUnique({ where: { id } });
  }

  async findTierById(id: number) {
    return prisma.tier.findUnique({ where: { id } });
  }

  async findPositionsByIds(ids: number[]) {
    return prisma.position.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  async findById(id: number) {
    return prisma.partyPost.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            userAvatars: {
              where: { isEquipped: true },
              include: { avatar: true },
            },
          },
        },
        tier: true,
        azit: true,
        postCategories: {
          include: { category: true },
        },
        postPositions: {
          include: { position: true },
        },
        applications: {
          where: { isAccepted: true },
        },
      },
    });
  }

  async findByUserId(userId: number) {
    return prisma.partyPost.findMany({ where: { userId } });
  }

  async findByGameId(gameId: number) {
    return prisma.partyPost.findMany({ where: { gameId } });
  }

  async findByAzitId(azitId: number) {
    return prisma.partyPost.findMany({ where: { azitId } });
  }

  async findByPositionId(positionId: number) {
    return prisma.partyPost.findMany({
      where: {
        postPositions: {
          some: { positionId },
        },
      },
    });
  }

  async findByTierId(tierId: number) {
    return prisma.partyPost.findMany({ where: { tierId } });
  }

  async updateParty(id: number, data: any) {
    return prisma.partyPost.update({ where: { id }, data });
  }

  async deleteParty(id: number) {
    return prisma.partyPost.delete({ where: { id } });
  }
}
