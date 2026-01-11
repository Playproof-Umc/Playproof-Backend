import { prisma } from "../../../common/config/database";
import { singleton } from "tsyringe";
import { Application, UserPostLike, PartyPost } from "@prisma/client";

@singleton()
export class PartyRepository {
  // 1. 파티 게시글 상세 조회 (인터랙션 및 권한 체크용)
  async findPartyPostById(postId: number): Promise<PartyPost | null> {
    return prisma.partyPost.findUnique({
      where: { id: BigInt(postId) },
    });
  }

  // 2. 파티 신청 상세 조회 (포스트 정보 포함)
  async findApplicationWithPost(applicationId: number): Promise<(Application & { post: PartyPost }) | null> {
    return (await prisma.application.findUnique({
      where: { id: BigInt(applicationId) },
      include: { post: true },
    })) as (Application & { post: PartyPost }) | null;
  }

  // 3. 특정 유저의 신청 내역 확인 (중복 방지용)
  async findApplication(userId: number, postId: number): Promise<Application | null> {
    return prisma.application.findFirst({
      where: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  // 4. 파티 신청 생성
  async createApplication(userId: number, postId: number): Promise<Application> {
    return prisma.application.create({
      data: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  // 5. 신청 상태 업데이트 (수락/거절)
  async updateApplicationStatus(applicationId: number, isAccepted: boolean): Promise<Application> {
    return prisma.application.update({
      where: { id: BigInt(applicationId) },
      data: { isAccepted },
    });
  }

  // 6. 신청 삭제 (취소)
  async deleteApplication(applicationId: number): Promise<Application> {
    return prisma.application.delete({
      where: { id: BigInt(applicationId) },
    });
  }

  // 7. 좋아요 관련 메소드들
  async findLike(userId: number, postId: number): Promise<UserPostLike | null> {
    return prisma.userPostLike.findUnique({
      where: {
        userId_postId: {
          userId: BigInt(userId),
          postId: BigInt(postId),
        },
      },
    });
  }

  async createLike(userId: number, postId: number): Promise<UserPostLike> {
    return prisma.userPostLike.create({
      data: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  async deleteLike(userId: number, postId: number): Promise<UserPostLike> {
    return prisma.userPostLike.delete({
      where: {
        userId_postId: {
          userId: BigInt(userId),
          postId: BigInt(postId),
        },
      },
    });
  }

  // 8. 기존 파티 CRUD 메소드 (dev 브랜치 내용 유지)
  async createParty(data: any, userId: number, azitId: number, tx?: any) {
    const client = tx || prisma;
    const { positionIds, gameId, tierId, ...rest } = data;
    return client.partyPost.create({
      data: {
        ...rest,
        postPositions: {
          create: positionIds.map((id: number) => ({ positionId: id })),
        },
        user: { connect: { id: userId } },
        game: { connect: { id: gameId } },
        tier: tierId ? { connect: { id: tierId } } : undefined,
        azit: { connect: { id: azitId } },
      },
    });
  }

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
        postPositions: { include: { position: true } },
        applications: { where: { isAccepted: true } },
      },
    });
  }

  async deleteParty(id: number, tx?: any) {
    const client = tx || prisma;
    const bigIntId = BigInt(id);
    
    await client.postPosition.deleteMany({ where: { postId: bigIntId } });
    await client.postCategory.deleteMany({ where: { postId: bigIntId } });
    await client.application.deleteMany({ where: { postId: bigIntId } });
    await client.userPostLike.deleteMany({ where: { postId: bigIntId } });

    return client.partyPost.delete({ where: { id: bigIntId } });
  }

  // 9. 기타 헬퍼 메소드들
  async countAll() {
    return prisma.partyPost.count();
  }

  async findParties(page: number, size: number, sort: "latest" | "mostliked") {
    const skip = (page - 1) * size;
    const orderBy: any = sort === "latest" ? { createdAt: "desc" } : { likes: { _count: "desc" } };

    return prisma.partyPost.findMany({
      skip,
      take: size,
      orderBy,
      include: {
        user: { include: { userAvatars: { where: { isEquipped: true }, include: { avatar: true } } } },
        tier: true,
        azit: true,
        postPositions: { include: { position: true } },
        applications: { where: { isAccepted: true } },
      },
    });
  }
}