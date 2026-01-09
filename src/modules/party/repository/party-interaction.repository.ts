import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";
import { Application, UserPostLike, PartyPost } from "@prisma/client";

@singleton()
export class PartyInteractionRepository {
  // 1. 파티 신청 관련
  async findApplication(userId: number, postId: number) {
    return prisma.application.findFirst({
      where: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  async findApplicationWithPost(applicationId: number) {
    return prisma.application.findUnique({
      where: { id: BigInt(applicationId) },
      include: { post: true }
    });
  }

  async createApplication(userId: number, postId: number) {
    return prisma.application.create({
      data: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  async updateApplicationStatus(applicationId: number, isAccepted: boolean) {
    return prisma.application.update({
      where: { id: BigInt(applicationId) },
      data: { isAccepted }
    });
  }

  async deleteApplication(applicationId: number) {
    return prisma.application.delete({
      where: { id: BigInt(applicationId) }
    });
  }

  // 2. 파티 좋아요 관련
  async findLike(userId: number, postId: number) {
    return prisma.userPostLike.findUnique({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } }
    });
  }

  async createLike(userId: number, postId: number) {
    return prisma.userPostLike.create({
      data: { userId: BigInt(userId), postId: BigInt(postId) }
    });
  }

  async deleteLike(userId: number, postId: number) {
    return prisma.userPostLike.delete({
      where: { userId_postId: { userId: BigInt(userId), postId: BigInt(postId) } }
    });
  }
}