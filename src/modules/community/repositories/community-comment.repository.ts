import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";
import { CommunityTargetType } from "../types/community-type";

@singleton()
export class CommunityCommentRepository {
  /**
   * 댓글 단건 조회
   */
  async findCommentById(commentId: bigint) {
    return prisma.communityComment.findUnique({
      where: { id: commentId },
    });
  }

  /**
   * 댓글 생성 (답글 포함)
   */
  async createComment(
    userId: bigint,
    targetType: CommunityTargetType,
    targetId: bigint,
    content: string,
    parentId?: bigint
  ) {
    return prisma.communityComment.create({
      data: {
        userId,
        content,
        parentId: parentId || null,
        isPublic: true,
        ...(targetType === CommunityTargetType.HIGHLIGHT ? { highlightId: targetId } : { postId: targetId }),
      },
      include: {
        user: { select: { nickname: true } }
      }
    });
  }

  /**
   * 특정 리소스의 댓글 목록 조회
   */
  async findCommentsByTarget(targetType: CommunityTargetType, targetId: bigint) {
    return prisma.communityComment.findMany({
      where: {
        ...(targetType === CommunityTargetType.HIGHLIGHT ? { highlightId: targetId } : { postId: targetId }),
      },
      include: {
        user: { select: { nickname: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * 댓글 수정
   */
  async updateComment(commentId: bigint, content: string) {
    return prisma.communityComment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  /**
   * 댓글 삭제
   */
  async deleteComment(commentId: bigint) {
    return prisma.communityComment.delete({
      where: { id: commentId },
    });
  }
}