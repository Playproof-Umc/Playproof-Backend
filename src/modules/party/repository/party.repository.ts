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

  async findAzitById(id: number) {
    return prisma.azit.findUnique({ where: { id } });
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

  async updateParty(id: number, data: any, tx?: any) {
    const client = tx || prisma;
    const { positionIds, gameId, tierId, azitName, azitIconUrl, azitId, ...rest } = data;

    return client.partyPost.update({
      where: { id },
      data: {
        ...rest,
        game: gameId ? { connect: { id: gameId } } : undefined,
        tier: tierId !== undefined ? (tierId ? { connect: { id: tierId } } : { disconnect: true }) : undefined,
        azit: azitId ? { connect: { id: azitId } } : undefined,
        postPositions: positionIds
          ? {
              deleteMany: {},
              create: positionIds.map((pid: number) => ({ positionId: pid })),
            }
          : undefined,
      },
    });
  }

  async updateAzit(id: number, azitName?: string, imageUrl?: string, tx?: any) {
    const client = tx || prisma;
    return client.azit.update({
      where: { id },
      data: {
        azitName,
        imageUrl,
      },
    });
  }

  async deleteParty(id: number, tx?: any) {
    const client = tx || prisma;
    
    // 1. 관련 데이터 삭제
    await client.postPosition.deleteMany({ where: { postId: id } });
    await client.postCategory.deleteMany({ where: { postId: id } });
    await client.application.deleteMany({ where: { postId: id } });
    await client.postComment.deleteMany({ where: { postId: id } });
    await client.userPostLike.deleteMany({ where: { postId: id } });

    // 2. 파티 삭제
    return client.partyPost.delete({ where: { id } });
  }

  async deleteAzit(id: number, tx?: any) {
    const client = tx || prisma;
    return client.azit.delete({ where: { id } });
  }

  async countPartiesByAzitId(azitId: number, tx?: any) {
    const client = tx || prisma;
    return client.partyPost.count({ where: { azitId } });
  }

  async findParties(page: number, size: number, sort: "latest" | "mostliked") {
    const skip = (page - 1) * size;
    const orderBy: any = {};

    if (sort === "latest") {
      orderBy.createdAt = "desc";
    } else if (sort === "mostliked") {
      orderBy.likes = {
        _count: "desc",
      };
    }

    return prisma.partyPost.findMany({
      skip,
      take: size,
      orderBy,
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

  async countAll() {
    return prisma.partyPost.count();
  }
}
