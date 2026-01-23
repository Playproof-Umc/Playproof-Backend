// src/modules/highlight/repositories/highlight.repository.ts
import { singleton } from "tsyringe";
import { Highlight, CommunityMedia } from "@prisma/client";
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
   * 하이라이트 생성 및 미디어 일괄 생성 (트랜잭션)
   */
  async createHighlightWithMedias(
    userId: bigint,
    azitId: bigint,
    content: string | undefined,
    isPublic: boolean,
    mediaData: Array<{ mediaUrl: string; order: number }>,
  ): Promise<{ highlight: Highlight; medias: CommunityMedia[] }> {
    return prisma.$transaction(async (tx) => {
      // 1. 하이라이트 생성
      const highlight = await tx.highlight.create({
        data: {
          userId,
          azitId,
          content: content || null,
          isPublic,
        },
      });

      // 2. 미디어 일괄 생성
      if (mediaData.length > 0) {
        await tx.communityMedia.createMany({
          data: mediaData.map((media) => ({
            highlightId: highlight.id,
            mediaUrl: media.mediaUrl,
            order: media.order,
          })),
        });
      }

      // 3. 생성된 미디어 조회
      const medias = await tx.communityMedia.findMany({
        where: {
          highlightId: highlight.id,
        },
        orderBy: {
          order: 'asc',
        },
      });

      return { highlight, medias };
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
   * 하이라이트 수정
   */
  async updateHighlight(
    highlightId: bigint,
    data: {
      content?: string | null;
      isPublic?: boolean;
    },
  ): Promise<Highlight> {
    return prisma.highlight.update({
      where: {
        id: highlightId,
      },
      data: {
        ...(data.content !== undefined && { content: data.content || null }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
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

  /**
   * 아지트의 하이라이트 목록 조회 (커서 기반 페이지네이션)
   */
  async findHighlightsByAzitId(
    azitId: bigint,
    cursor: bigint | null,
    limit: number,
    sortField: 'createdAt' | 'updatedAt' | 'likeCount',
    sortOrder: 'asc' | 'desc',
  ) {
    const whereCondition: any = {
      azitId,
    };

    // 커서 기반 페이지네이션 (like_count 정렬의 경우도 highlight_id를 커서로 사용)
    if (cursor) {
      if (sortOrder === 'desc') {
        whereCondition.id = {
          lt: cursor, // DESC 정렬 시 cursor보다 작은 ID만 조회
        };
      } else {
        whereCondition.id = {
          gt: cursor, // ASC 정렬 시 cursor보다 큰 ID만 조회
        };
      }
    }

    if (sortField === 'likeCount') {
      const allHighlights = await prisma.highlight.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
          medias: {
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // 메모리에서 좋아요 수로 정렬
      const sortedHighlights = allHighlights.sort((a, b) => {
        const aCount = a._count.likes;
        const bCount = b._count.likes;
        return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      });

      // 커서 기준으로 필터링 (정렬 후)
      let filteredHighlights = sortedHighlights;
      if (cursor) {
        const cursorIndex = sortedHighlights.findIndex((h) => h.id === cursor);
        if (cursorIndex !== -1) {
          filteredHighlights = sortOrder === 'desc'
            ? sortedHighlights.slice(cursorIndex + 1)
            : sortedHighlights.slice(0, cursorIndex);
        }
      }

      return filteredHighlights.slice(0, limit + 1);
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const highlights = await prisma.highlight.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
        medias: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy,
      take: limit + 1, // 하나 더 가져와서 has_next 판단
    });

    return highlights;
  }

  /**
   * 특정 사용자가 특정 하이라이트에 좋아요를 눌렀는지 확인
   */
  async findUserLikeByHighlightId(userId: bigint, highlightId: bigint) {
    return prisma.communityLike.findFirst({
      where: {
        userId,
        highlightId,
      },
    });
  }

  /**
   * 여러 하이라이트에 대한 사용자 좋아요 여부 일괄 조회
   */
  async findUserLikesByHighlightIds(userId: bigint, highlightIds: bigint[]) {
    if (highlightIds.length === 0) {
      return [];
    }

    return prisma.communityLike.findMany({
      where: {
        userId,
        highlightId: {
          in: highlightIds,
        },
      },
      select: {
        highlightId: true,
      },
    });
  }

  /**
   * 하이라이트 삭제
   */
  async deleteHighlight(highlightId: bigint): Promise<Highlight> {
    return prisma.highlight.delete({
      where: {
        id: highlightId,
      },
    });
  }

  /**
   * 하이라이트 미디어 생성
   */
  async createHighlightMedia(
    highlightId: bigint,
    mediaUrl: string,
    order: number,
  ): Promise<CommunityMedia> {
    return prisma.communityMedia.create({
      data: {
        highlightId,
        mediaUrl,
        order,
      },
    });
  }

  /**
   * 여러 하이라이트 미디어 일괄 생성
   */
  async createHighlightMediaBatch(
    highlightId: bigint,
    mediaData: Array<{ mediaUrl: string; order: number }>,
  ): Promise<number> {
    const result = await prisma.communityMedia.createMany({
      data: mediaData.map((media) => ({
        highlightId,
        mediaUrl: media.mediaUrl,
        order: media.order,
      })),
    });

    return result.count;
  }

  /**
   * 하이라이트 ID로 미디어 목록 조회
   */
  async findMediasByHighlightId(highlightId: bigint): Promise<CommunityMedia[]> {
    return prisma.communityMedia.findMany({
      where: {
        highlightId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /**
   * 하이라이트 ID로 미디어 일괄 삭제
   */
  async deleteMediasByHighlightId(highlightId: bigint): Promise<number> {
    const result = await prisma.communityMedia.deleteMany({
      where: {
        highlightId,
      },
    });

    return result.count;
  }

  /**
   * 특정 미디어 ID들로 미디어 삭제
   */
  async deleteMediaByIds(mediaIds: bigint[]): Promise<number> {
    if (mediaIds.length === 0) {
      return 0;
    }

    const result = await prisma.communityMedia.deleteMany({
      where: {
        id: {
          in: mediaIds,
        },
      },
    });

    return result.count;
  }
}
