import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";

@singleton()
export class PartyInteractionRepository {
  // 1. 특정 유저가 특정 파티에 신청했는지 조회
  async findApplication(userId: number, postId: number) {
    return prisma.application.findFirst({
      where: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  // 2. 신청 상세 정보 조회 (권한 확인을 위한 파티 정보 포함)
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

  // 4. 신청 상태 업데이트 (수락/거절)
  async updateApplicationStatus(applicationId: number, isAccepted: boolean) {
    return prisma.application.update({
      where: { id: BigInt(applicationId) },
      data: { isAccepted }
    });
  }

  // 5. 신청 데이터 삭제 (취소)
  async deleteApplication(applicationId: number) {
    return prisma.application.delete({
      where: { id: BigInt(applicationId) }
    });
  }

  // 6. 좋아요 기록 확인 (복합 키 사용)
  async findLike(userId: number, postId: number) {
    return prisma.userPostLike.findUnique({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } }
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