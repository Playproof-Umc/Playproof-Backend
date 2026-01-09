import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";

@singleton()
export class PartyRepository {
  // 파티 상세 정보 조회 (본인 파티 여부 확인용)
  async findPartyPostById(postId: number) {
    return prisma.partyPost.findUnique({
      where: { id: BigInt(postId) },
    });
  }

  // 파티 신청 관련
  async findApplicationWithPost(applicationId: number) {
    return prisma.application.findUnique({
      where: { id: BigInt(applicationId) },
      include: { post: true },
    });
  }

  // 파티 중복 신청 확인
  async findApplicationByUserAndPost(userId: number, postId: number) {
    return prisma.application.findFirst({
      where: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  // 파티 신청 시
  async createApplication(userId: number, postId: number) {
    return prisma.application.create({
      data: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  // 파티 신청자 승낙 및 거부 시
  async updateApplicationStatus(applicationId: number, isAccepted: boolean) {
    return prisma.application.update({
      where: { id: BigInt(applicationId) },
      data: { isAccepted },
    });
  }

  // 신청 삭제 (취소)
  async deleteApplication(applicationId: number) {
  return prisma.application.delete({
    where: { id: BigInt(applicationId) },
  });
}

  // 파티 좋아요 확인
  async findLike(userId: number, postId: number) {
    return prisma.userPostLike.findUnique({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } },
    });
  }

  // 좋아요
  async createLike(userId: number, postId: number) {
    return prisma.userPostLike.create({
      data: { userId: BigInt(userId), postId: BigInt(postId) },
    });
  }

  // 좋아요 취소
  async deleteLike(userId: number, postId: number) {
    return prisma.userPostLike.delete({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } },
    });
  }
}