import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";
import { CommunityTargetType } from "../types/community-type";

@singleton()
export class CommunityLikeRepository {
  /**
   * 특정 리소스에 대한 사용자의 좋아요 조회
   */
  async findLike(userId: bigint, targetType: CommunityTargetType, targetId: bigint) {
    return prisma.communityLike.findFirst({
      where: {
        userId,
        ...(targetType === CommunityTargetType.HIGHLIGHT ? { highlightId: targetId } : { postId: targetId }),
      },
    });
  }

  /**
   * 좋아요 생성
   */
  async createLike(userId: bigint, targetType: CommunityTargetType, targetId: bigint) {
    return prisma.communityLike.create({
      data: {
        userId,
        ...(targetType === CommunityTargetType.HIGHLIGHT ? { highlightId: targetId } : { postId: targetId }),
      },
    });
  }

  /**
   * 좋아요 삭제 (취소)
   */
  async deleteLike(likeId: bigint) {
    return prisma.communityLike.delete({
      where: { id: likeId },
    });
  }

  /**
   * 특정 리소스의 전체 좋아요 개수 조회
   */
  async countLikes(targetType: CommunityTargetType, targetId: bigint) {
    return prisma.communityLike.count({
      where: {
        ...(targetType === CommunityTargetType.HIGHLIGHT ? { highlightId: targetId } : { postId: targetId }),
      },
    });
  }
}