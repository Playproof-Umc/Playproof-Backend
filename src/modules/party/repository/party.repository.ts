import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";
import { Application, UserPostLike, PartyPost } from "@prisma/client";

@singleton()
export class PartyRepository {
  /**
   * 파티 상세 정보 조회 (본인 파티 여부 확인용)
   */
  async findPartyPostById(postId: number): Promise<PartyPost | null> {
    return prisma.partyPost.findUnique({
      where: { id: BigInt(postId) },
    });
  }

  /**
   * 파티 신청 상세 조회 (포스트 정보 포함)
   * 승낙/거절 시 방장 권한 체크를 위해 'post' 관계를 포함합니다.
   */
  async findApplicationWithPost(applicationId: number): Promise<(Application & { post: PartyPost }) | null> {
    return prisma.application.findUnique({
      where: { id: BigInt(applicationId) },
      include: { post: true },
    }) as Promise<(Application & { post: PartyPost }) | null>;
  }

  /**
   * 특정 유저가 특정 파티에 신청했는지 확인 (중복 신청 방지)
   */
  async findApplicationByUserAndPost(userId: number, postId: number): Promise<Application | null> {
    return prisma.application.findFirst({
      where: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  /**
   * 파티 신청 데이터 생성
   */
  async createApplication(userId: number, postId: number): Promise<Application> {
    return prisma.application.create({
      data: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  /**
   * 신청 상태 업데이트 (승낙/거절)
   */
  async updateApplicationStatus(applicationId: number, isAccepted: boolean): Promise<Application> {
    return prisma.application.update({
      where: { id: BigInt(applicationId) },
      data: { isAccepted },
    });
  }

  /**
   * 신청 데이터 삭제 (취소)
   */
  async deleteApplication(applicationId: number): Promise<Application> {
    return prisma.application.delete({
      where: { id: BigInt(applicationId) },
    });
  }

  /**
   * 좋아요 기록 확인
   */
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

  /**
   * 좋아요 등록
   */
  async createLike(userId: number, postId: number): Promise<UserPostLike> {
    return prisma.userPostLike.create({
      data: {
        userId: BigInt(userId),
        postId: BigInt(postId),
      },
    });
  }

  /**
   * 좋아요 취소
   */
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
}