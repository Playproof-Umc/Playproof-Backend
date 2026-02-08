import { prisma } from "../../../common/config/database";
import { singleton } from "tsyringe";
import { PartyPost } from "@prisma/client";

@singleton()
export class PartyRepository {
  // 1. 파티 게시글 ID(PostId)로 존재 여부 확인
  async findPartyPostByPostId(postId: number): Promise<PartyPost | null> {
    return prisma.partyPost.findUnique({
      where: { id: BigInt(postId) },
    });
  }

  // 2. 파티 생성
  async createParty(data: any, userId: number, azitId?: number | null, tx?: any) {
    const client = tx || prisma;
    const { positionIds, gameId, tierId, azitId: _azitId, ...rest } = data;
    return client.partyPost.create({
      data: {
        ...rest,
        recruitmentStatus: rest.recruitmentStatus ?? "active",
        postPositions: {
          create: positionIds.map((id: number) => ({ positionId: BigInt(id) })),
        },
        user: { connect: { id: BigInt(userId) } },
        game: { connect: { id: BigInt(gameId) } },
        tier: tierId ? { connect: { id: BigInt(tierId) } } : undefined,
        azit: azitId ? { connect: { id: BigInt(azitId) } } : undefined,
      },
    });
  }

  // 3. 파티 상세 조회 (인클루드 포함)
  async findById(id: number) {
    return prisma.partyPost.findUnique({
      where: { id: BigInt(id) },
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
        postCategories: { include: { category: true } },
        postPositions: { include: { position: true } },
        applications: { where: { isAccepted: true } },
      },
    });
  }

  // 4. 파티 수정
  async updateParty(id: number, data: any, tx?: any) {
    const client = tx || prisma;
    const { positionIds, gameId, tierId, azitId, ...rest } = data;
    return client.partyPost.update({
      where: { id: BigInt(id) },
      data: {
        ...rest,
        game: gameId ? { connect: { id: BigInt(gameId) } } : undefined,
        tier: tierId !== undefined ? (tierId ? { connect: { id: BigInt(tierId) } } : { disconnect: true }) : undefined,
        azit: azitId ? { connect: { id: BigInt(azitId) } } : undefined,
        postPositions: positionIds
          ? {
              deleteMany: {},
              create: positionIds.map((pid: number) => ({ positionId: BigInt(pid) })),
            }
          : undefined,
      },
    });
  }

  // 5. 파티 삭제
  async deleteParty(id: number, tx?: any) {
    const client = tx || prisma;
    const bigIntId = BigInt(id);
    await client.postPosition.deleteMany({ where: { postId: bigIntId } });
    await client.postCategory.deleteMany({ where: { postId: bigIntId } });
    await client.application.deleteMany({ where: { postId: bigIntId } });
    await client.userPostLike.deleteMany({ where: { postId: bigIntId } });
    return client.partyPost.delete({ where: { id: bigIntId } });
  }

  // 6. 마스터 데이터 조회
  async findGameById(id: number) { 
    return prisma.game.findUnique({ where: { id: BigInt(id) } }); 
  }
  async findTierById(id: number) { 
    return prisma.tier.findUnique({ where: { id: BigInt(id) } }); 
  }
  async findAzitById(id: number) { 
    return prisma.azit.findUnique({ where: { id: BigInt(id) } }); 
  }
  async findPositionsByIds(ids: number[]) {
    return prisma.position.findMany({ where: { id: { in: ids.map(id => BigInt(id)) } } });
  }

  // 7. 아지트 관련 기능
  async createTempAzit(azitName: string, imageUrl: string | null, tx?: any) {
    const client = tx || prisma;
    return client.azit.create({ data: { azitName, imageUrl } });
  }
  async updateAzit(id: number, azitName?: string, imageUrl?: string, tx?: any) {
    const client = tx || prisma;
    return client.azit.update({ where: { id: BigInt(id) }, data: { azitName, imageUrl } });
  }
  async deleteAzit(id: number, tx?: any) {
    const client = tx || prisma;
    return client.azit.delete({ where: { id: BigInt(id) } });
  }
  async countPartiesByAzitId(azitId: number, tx?: any) {
    const client = tx || prisma;
    return client.partyPost.count({ where: { azitId: BigInt(azitId) } });
  }

  // 8. 목록 조회 및 유틸리티
  async countAll() { 
    return prisma.partyPost.count(); 
  }
  async findParties(page: number, size: number, sort: "latest" | "mostliked") {
    const skip = (page - 1) * size;
    const orderBy: any = sort === "latest" ? { createdAt: "desc" } : { postLikes: { _count: "desc" } };
    return prisma.partyPost.findMany({
      skip, take: size, orderBy,
      include: {
        user: { include: { userAvatars: { where: { isEquipped: true }, include: { avatar: true } } } },
        tier: true, azit: true,
        postCategories: { include: { category: true } },
        postPositions: { include: { position: true } },
        applications: { where: { isAccepted: true } },
      },
    });
  }
}