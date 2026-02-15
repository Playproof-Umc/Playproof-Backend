import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";

@singleton()
export class PartyInteractionRepository {
  // 1. 특정 유저의 신청 내역 조회
  async findApplication(userId: number, postId: number) {
    return prisma.application.findFirst({
      where: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  // 2. 신청 상세 정보 조회 (파티 정보 포함)
  async findApplicationWithPost(applicationId: number) {
    return prisma.application.findUnique({
      where: { id: BigInt(applicationId) },
      include: { post: true }
    });
  }

  // 3. 파티 참가 신청 생성
  async createApplication(userId: number, postId: number) {
    return prisma.application.create({
      data: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  // 4. 신청 상태 업데이트
  async updateApplicationStatus(applicationId: number, isAccepted: boolean) {
    return prisma.application.update({
      where: { id: BigInt(applicationId) },
      data: { isAccepted }
    });
  }

  // 5. 신청 데이터 삭제
  async deleteApplication(applicationId: number) {
    return prisma.application.delete({
      where: { id: BigInt(applicationId) }
    });
  }

  // 9. 내가 작성한 모든 파티의 신청 목록 조회 (대기 중인 신청만)
  async findApplicationsByLeaderId(leaderId: number) {
    return prisma.application.findMany({
      where: {
        isAccepted: false,
        post: { userId: BigInt(leaderId) },
      },
      orderBy: { applicationAt: "desc" },
      include: {
        user: {
          include: {
            userAvatars: {
              where: { isEquipped: true },
              include: { avatar: true },
            },
          },
        },
        post: {
          include: {
            game: true,
            tier: true,
            postCategories: { include: { category: true } },
            applications: { where: { isAccepted: true } },
          },
        },
      },
    });
  }

  // 10. 특정 파티의 신청 목록 조회 (대기 중인 신청만)
  async findApplicationsByPostId(postId: number) {
    return prisma.application.findMany({
      where: { postId: BigInt(postId), isAccepted: false },
      orderBy: { applicationAt: "asc" },
      include: {
        user: {
          include: {
            userAvatars: {
              where: { isEquipped: true },
              include: { avatar: true },
            },
          },
        },
        post: {
          include: {
            game: true,
            tier: true,
            postCategories: { include: { category: true } },
            applications: { where: { isAccepted: true } },
          },
        },
      },
    });
  }

  // 6. 좋아요 기록 확인
  async findLike(userId: number, postId: number) {
    return prisma.userPostLike.findUnique({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } }
    });
  }

  // 6-1. 여러 파티에 대한 사용자 좋아요 여부 일괄 조회
  async findLikesByUserAndPostIds(userId: number, postIds: bigint[]) {
    if (postIds.length === 0) return [];
    return prisma.userPostLike.findMany({
      where: { userId: BigInt(userId), postId: { in: postIds } },
      select: { postId: true },
    });
  }

  // 1-1. 여러 파티에 대한 사용자 신청 상태 일괄 조회
  async findApplicationsByUserAndPostIds(userId: number, postIds: bigint[]) {
    if (postIds.length === 0) return [];
    return prisma.application.findMany({
      where: { userId: BigInt(userId), postId: { in: postIds } },
      select: { id: true, postId: true, isAccepted: true },
    });
  }

  // 7. 좋아요 등록
  async createLike(userId: number, postId: number) {
    return prisma.userPostLike.create({
      data: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  // 8. 좋아요 취소
  async deleteLike(userId: number, postId: number) {
    return prisma.userPostLike.delete({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } }
    });
  }
}