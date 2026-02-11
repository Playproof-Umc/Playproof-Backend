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
        _count: { select: { postLikes: true, postComments: true } },
      },
    });
  }

  async incrementViewCount(id: number) {
    try {
      return await prisma.partyPost.update({
        where: { id: BigInt(id) },
        data: { viewCount: { increment: 1 } },
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
          _count: { select: { postLikes: true, postComments: true } },
        },
      });
    } catch {
      return null;
    }
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
  /** 커서 기반 페이지네이션 - 마이페이지 내가 쓴 파티 목록 */
  async findPartiesByUserIdCursor(userId: number, cursor: bigint | null, limit: number) {
    const whereCondition: { userId: bigint; id?: { lt: bigint } } = {
      userId: BigInt(userId),
    };
    if (cursor) {
      whereCondition.id = { lt: cursor };
    }

    return prisma.partyPost.findMany({
      where: whereCondition,
      orderBy: { id: "desc" },
      take: limit + 1,
      include: {
        user: { include: { userAvatars: { where: { isEquipped: true }, include: { avatar: true } } } },
        tier: true,
        azit: true,
        postCategories: { include: { category: true } },
        postPositions: { include: { position: true } },
        applications: { where: { isAccepted: true } },
        _count: { select: { postLikes: true, postComments: true } },
      },
    });
  }
  async countByUserId(userId: number) {
    return prisma.partyPost.count({ where: { userId: BigInt(userId) } });
  }
  /** 커서 기반 파티 목록 조회 */
  async findPartiesByCursor(
    cursor: { id: bigint; likeCount?: number } | null,
    limit: number,
    sort: "latest" | "mostliked",
  ) {
    const takeLimit = limit + 1;
    const include = {
      user: { include: { userAvatars: { where: { isEquipped: true }, include: { avatar: true } } } },
      tier: true,
      azit: true,
      postCategories: { include: { category: true } },
      postPositions: { include: { position: true } },
      applications: { where: { isAccepted: true } },
      _count: { select: { postLikes: true, postComments: true } },
    };

    if (sort === "latest") {
      const where = cursor ? { id: { lt: cursor.id } } : {};
      return prisma.partyPost.findMany({
        where,
        orderBy: { id: "desc" },
        take: takeLimit,
        include,
      });
    }

    // mostliked: raw query로 (likeCount, id) 커서 패지네이션
    if (sort === "mostliked") {
      return this.findPartiesMostLikedWithCursor(
        cursor?.id ?? null,
        cursor?.likeCount ?? null,
        takeLimit,
        include,
      );
    }

    return [];
  }

  private async findPartiesMostLikedWithCursor(
    cursorId: bigint | null,
    cursorLikeCount: number | null,
    limit: number,
    include: any,
  ) {
    if (cursorId !== null && cursorLikeCount !== null) {
      const raw = await prisma.$queryRaw<{ post_id: bigint }[]>`
        SELECT p.post_id
        FROM party_posts p
        LEFT JOIN user_post_like l ON p.post_id = l.post_id
        GROUP BY p.post_id
        HAVING (COUNT(l.user_id) < ${cursorLikeCount})
          OR (COUNT(l.user_id) = ${cursorLikeCount} AND p.post_id < ${cursorId})
        ORDER BY COUNT(l.user_id) DESC, p.post_id DESC
        LIMIT ${limit}
      `;
      if (raw.length === 0) return [];
      const ids = raw.map((r) => r.post_id);
      const parties = await prisma.partyPost.findMany({
        where: { id: { in: ids } },
        include,
      });
      const orderMap = new Map(ids.map((id, i) => [id.toString(), i]));
      return parties.sort((a, b) => orderMap.get(a.id.toString())! - orderMap.get(b.id.toString())!);
    }

    const parties = await prisma.partyPost.findMany({
      orderBy: [
        { postLikes: { _count: "desc" } },
        { id: "desc" },
      ],
      take: limit,
      include,
    });
    return parties;
  }

  async findParties(page: number, size: number, sort: "latest" | "mostliked") {
    const skip = (page - 1) * size;
    const orderBy: any = sort === "latest" ? { id: "desc" } : [{ postLikes: { _count: "desc" } }, { id: "desc" }];
    return prisma.partyPost.findMany({
      skip,
      take: size,
      orderBy,
      include: {
        user: { include: { userAvatars: { where: { isEquipped: true }, include: { avatar: true } } } },
        tier: true,
        azit: true,
        postCategories: { include: { category: true } },
        postPositions: { include: { position: true } },
        applications: { where: { isAccepted: true } },
        _count: { select: { postLikes: true, postComments: true } },
      },
    });
  }
}