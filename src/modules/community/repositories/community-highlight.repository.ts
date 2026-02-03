import { singleton } from "tsyringe";
import { prisma } from "../../../common/config/database";
import { CommunityHighlightCreateReqDto, CommunityHighlightUpdateReqDto } from "../dtos/community-highlight.req.dto";

@singleton()
export class CommunityHighlightRepository {
  // 1. 하이라이트 생성 및 미디어 일괄 저장 트랜잭션
  async createHighlight(userId: bigint, dto: CommunityHighlightCreateReqDto) {
    return await prisma.$transaction(async (tx) => {
      const highlight = await tx.highlight.create({
        data: {
          userId,
          azitId: dto.azit_id ? BigInt(dto.azit_id) : null,
          content: dto.content,
          isPublic: dto.is_public,
        },
      });

      if (dto.medias && dto.medias.length > 0) {
        await tx.communityMedia.createMany({
          data: dto.medias.map((m) => ({
            highlightId: highlight.id,
            mediaUrl: m.media_url,
            order: m.order,
          })),
        });
      }
      return highlight;
    });
  }

  // 2. 커뮤니티 공개 목록 조회 (프로필 제외, 좋아요 상태 포함)
  async findCommunityHighlights(page: number, size: number, userId: bigint | null) {
    return await prisma.highlight.findMany({
      where: { isPublic: true },
      skip: (page - 1) * size,
      take: size,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, nickname: true } },
        medias: { orderBy: { order: "asc" } },
        _count: { select: { comments: true, likes: true } },
        likes: userId ? { where: { userId }, select: { userId: true } } : false,
      },
    });
  }

  // 3. 하이라이트 상세 조회 (작성자 및 아지트 정보 포함)
  async findHighlightById(highlightId: bigint, userId: bigint | null) {
    return await prisma.highlight.findUnique({
      where: { id: highlightId },
      include: {
        user: { select: { id: true, nickname: true } },
        azit: { select: { id: true, azitName: true } },
        medias: { orderBy: { order: "asc" } },
        _count: { select: { comments: true, likes: true } },
        likes: userId ? { where: { userId }, select: { userId: true } } : false,
      },
    });
  }

  // 4. 하이라이트 수정 및 미디어 교체 트랜잭션
async updateHighlight(highlightId: bigint, dto: CommunityHighlightUpdateReqDto) {
  return await prisma.$transaction(async (tx) => {
    await tx.highlight.update({
      where: { id: highlightId },
      data: {
        content: dto.content,
        isPublic: dto.is_public,
      },
    });

    if (dto.medias) {
      await tx.communityMedia.deleteMany({ where: { highlightId } });
      if (dto.medias.length > 0) {
        await tx.communityMedia.createMany({
          data: dto.medias.map((m) => ({
            highlightId,
            mediaUrl: m.media_url,
            order: m.order,
          })),
        });
      }
    }

    return await tx.highlight.findUnique({
      where: { id: highlightId },
      include: { medias: { orderBy: { order: "asc" } } }
    });
  });
}

  // 5. 하이라이트 및 관련 미디어 삭제 트랜잭션
  async deleteHighlight(highlightId: bigint) {
    return await prisma.$transaction(async (tx) => {
      await tx.communityMedia.deleteMany({ where: { highlightId } });
      return await tx.highlight.delete({ where: { id: highlightId } });
    });
  }

  // 6. 페이지네이션용 전체 공개 게시글 개수 조회
  async countHighlights() {
    return await prisma.highlight.count({ where: { isPublic: true } });
  }
}