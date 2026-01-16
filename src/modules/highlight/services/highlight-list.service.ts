// src/modules/highlight/services/highlight-list.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { AzitRepository } from "../../azit/repositories/azit.repository";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository";
import { GetHighlightListReqDto, HighlightSortField, SortOrder } from "../dtos/highlight.req.dto";
import {
  GetHighlightListResDto,
  HighlightListItemResDto,
  HighlightMediaResDto,
  HighlightListPaginationResDto,
} from "../dtos/highlight.res.dto";
import {
  Result,
  ok,
  notFound,
  forbidden,
  badRequest,
  internalServerError,
} from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";

@injectable()
export class HighlightListService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  async getHighlightList(
    userId: bigint,
    azitId: bigint,
    dto: GetHighlightListReqDto,
  ): Promise<Result<GetHighlightListResDto>> {
    // 1. 아지트 존재 여부 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: "아지트를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_AZIT,
      });
    }

    // 2. 사용자가 아지트 멤버인지 확인
    const azitUserRole = await this.azitUserRepository.findAzitUserRoleByUserIdAndAzitId(userId, azitId);
    if (!azitUserRole) {
      return forbidden({
        message: "아지트 멤버만 하이라이트를 조회할 수 있습니다.",
        errorCode: "HIGHLIGHT_LIST_FORBIDDEN",
      });
    }

    // 3. 정렬 필드 변환
    let sortField: 'createdAt' | 'updatedAt' | 'likeCount';
    switch (dto.sort) {
      case HighlightSortField.CREATED_AT:
        sortField = 'createdAt';
        break;
      case HighlightSortField.UPDATED_AT:
        sortField = 'updatedAt';
        break;
      case HighlightSortField.LIKE_COUNT:
        sortField = 'likeCount';
        break;
      default:
        sortField = 'createdAt';
    }

    // 4. 정렬 방향 변환
    const sortOrder: 'asc' | 'desc' = dto.order === SortOrder.ASC ? 'asc' : 'desc';

    // 5. 커서 변환
    const cursor = dto.cursor ? BigInt(dto.cursor) : null;

    // 6. 하이라이트 목록 조회 (limit + 1개)
    const limit = dto.limit || 20;
    const highlightsData = await this.highlightRepository.findHighlightsByAzitId(
      azitId,
      cursor,
      limit,
      sortField,
      sortOrder,
    );

    // 7. has_next 판단 및 실제 반환할 데이터 분리
    const hasNext = highlightsData.length > limit;
    const actualHighlights = hasNext ? highlightsData.slice(0, limit) : highlightsData;

    // 8. 사용자 좋아요 여부 일괄 조회
    const highlightIds = actualHighlights.map((h) => h.id);
    const userLikes = await this.highlightRepository.findUserLikesByHighlightIds(userId, highlightIds);
    const likedHighlightIds = new Set(userLikes.map((like) => like.highlightId));

    // 9. 응답 DTO 변환
    const highlights: HighlightListItemResDto[] = actualHighlights.map((highlight) => {
      const mediaDtos: HighlightMediaResDto[] = highlight.medias.map((media) => ({
        highlight_media_id: Number(media.id),
        media_url: media.mediaUrl,
        order: media.order,
        upload_at: media.uploadAt,
      }));

      return {
        highlight_id: Number(highlight.id),
        user_id: Number(highlight.userId),
        nickname: highlight.user.nickname,
        content: highlight.content,
        visibility: highlight.isPublic ? 'PUBLIC' : 'PRIVATE',
        media_count: highlight.medias.length,
        medias: mediaDtos,
        like_count: highlight._count.likes,
        comment_count: highlight._count.comments,
        is_liked: likedHighlightIds.has(highlight.id),
        created_at: highlight.createdAt,
        updated_at: highlight.updatedAt,
      };
    });

    // 10. next_cursor 계산 (마지막 항목의 highlight_id)
    const lastHighlight = actualHighlights[actualHighlights.length - 1];
    const nextCursor = hasNext && lastHighlight ? Number(lastHighlight.id) : null;

    // 11. 페이지네이션 정보 구성
    const pagination: HighlightListPaginationResDto = {
      has_next: hasNext,
      next_cursor: nextCursor,
      limit,
    };

    // 12. 최종 응답 구성
    const response: GetHighlightListResDto = {
      azit_id: Number(azit.id),
      azit_name: azit.azitName,
      highlights,
      pagination,
    };

    return ok(response);
  }
}
