// src/modules/highlight/repositories/community-media.repository.ts
import { singleton } from "tsyringe";
import { CommunityMedia } from "@prisma/client";
import { prisma } from "../../../common/config/database";

@singleton()
export class CommunityMediaRepository {
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
}
