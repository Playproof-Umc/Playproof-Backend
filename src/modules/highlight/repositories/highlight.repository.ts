// src/modules/highlight/repositories/highlight.repository.ts
import { singleton } from "tsyringe";
import { Highlight } from "@prisma/client";
import { prisma } from "../../../common/config/database";

@singleton()
export class HighlightRepository {
  /**
   * 하이라이트 생성
   */
  async createHighlight(
    userId: bigint,
    azitId: bigint,
    content: string | undefined,
    isPublic: boolean,
  ): Promise<Highlight> {
    return prisma.highlight.create({
      data: {
        userId,
        azitId,
        content: content || null,
        isPublic,
      },
    });
  }

  /**
   * 하이라이트 ID로 조회 (상세 정보 포함)
   */
  async findHighlightById(highlightId: bigint) {
    return prisma.highlight.findUnique({
      where: {
        id: highlightId,
      },
      include: {
        user: true,
        azit: true,
        medias: {
          orderBy: {
            order: 'asc',
          },
        },
        likes: true,
        comments: true,
      },
    });
  }

  /**
   * 하이라이트의 좋아요 수 조회
   */
  async countLikesByHighlightId(highlightId: bigint): Promise<number> {
    return prisma.communityLike.count({
      where: {
        highlightId,
      },
    });
  }

  /**
   * 하이라이트의 댓글 수 조회
   */
  async countCommentsByHighlightId(highlightId: bigint): Promise<number> {
    return prisma.communityComment.count({
      where: {
        highlightId,
      },
    });
  }
}
