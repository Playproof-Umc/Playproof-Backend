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
  GetHighlightDetailResDto,
  GetMyHighlightListResDto,
  MyHighlightListItemResDto,
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
    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(userId, azitId);
    if (!azitUser) {
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

  async getHighlightDetail(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<GetHighlightDetailResDto>> {
    // 1. 아지트 존재 여부 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: "아지트를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_AZIT,
      });
    }

    // 2. 사용자가 아지트 멤버인지 확인
    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(userId, azitId);
    if (!azitUser) {
      return forbidden({
        message: "권한이 없습니다.",
        errorCode: "AZIT_NOT_MEMBER",
        errors: [
          {
            field: "azit_id",
            value: Number(azitId),
            reason: "해당 아지트의 멤버만 하이라이트를 조회할 수 있습니다.",
          },
        ],
      });
    }

    // 3. 하이라이트 존재 여부 및 아지트 소속 확인
    const highlight = await this.highlightRepository.findHighlightById(highlightId);
    if (!highlight) {
      return notFound({
        message: "요청한 리소스를 찾을 수 없습니다.",
        errorCode: "COMMON_RESOURCE_NOT_FOUND",
        errors: [
          {
            field: "highlight_id",
            value: Number(highlightId),
            reason: "존재하지 않는 하이라이트입니다.",
          },
        ],
      });
    }

    // 4. 하이라이트가 해당 아지트에 속하는지 확인
    if (highlight.azitId !== azitId) {
      return notFound({
        message: "요청한 리소스를 찾을 수 없습니다.",
        errorCode: "COMMON_RESOURCE_NOT_FOUND",
        errors: [
          {
            field: "highlight_id",
            value: Number(highlightId),
            reason: "해당 아지트에 속하지 않는 하이라이트입니다.",
          },
        ],
      });
    }

    // 5. 사용자 좋아요 여부 확인
    const userLike = await this.highlightRepository.findUserLikeByHighlightId(userId, highlightId);
    const isLiked = !!userLike;

    // 6. 좋아요 수, 댓글 수 계산
    const likeCount = highlight.likes.length;
    const commentCount = highlight.comments.length;

    // 7. 미디어 DTO 변환
    const mediaDtos: HighlightMediaResDto[] = highlight.medias.map((media) => ({
      highlight_media_id: Number(media.id),
      media_url: media.mediaUrl,
      order: media.order,
      upload_at: media.uploadAt,
    }));

    // 8. 응답 DTO 변환
    const response: GetHighlightDetailResDto = {
      highlight_id: Number(highlight.id),
      azit_id: Number(azit.id),
      azit_name: azit.azitName,
      user_id: Number(highlight.userId),
      nickname: highlight.user.nickname,
      content: highlight.content,
      visibility: highlight.isPublic ? 'PUBLIC' : 'PRIVATE',
      media_count: highlight.medias.length,
      medias: mediaDtos,
      like_count: likeCount,
      comment_count: commentCount,
      is_liked: isLiked,
      created_at: highlight.createdAt,
      updated_at: highlight.updatedAt,
    };

    return ok(response);
  }

  /**
   * 마이페이지 - 내가 쓴 하이라이트 목록 조회
   */
  async getMyHighlightList(
    userId: bigint,
    cursor: bigint | null,
    limit: number,
  ): Promise<Result<GetMyHighlightListResDto>> {
    const limitNum = limit || 20;
    const highlightsData = await this.highlightRepository.findHighlightsByUserId(
      userId,
      cursor,
      limitNum,
    );

    const hasNext = highlightsData.length > limitNum;
    const actualHighlights = hasNext ? highlightsData.slice(0, limitNum) : highlightsData;

    const highlightIds = actualHighlights.map((h) => h.id);
    const userLikes = await this.highlightRepository.findUserLikesByHighlightIds(userId, highlightIds);
    const likedHighlightIds = new Set(userLikes.map((l) => l.highlightId));

    const highlights: MyHighlightListItemResDto[] = actualHighlights.map((highlight) => {
      const mediaDtos = highlight.medias.map((media) => ({
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
        visibility: highlight.isPublic ? "PUBLIC" : "PRIVATE",
        media_count: highlight.medias.length,
        medias: mediaDtos,
        like_count: highlight._count.likes,
        comment_count: highlight._count.comments,
        is_liked: likedHighlightIds.has(highlight.id),
        created_at: highlight.createdAt,
        updated_at: highlight.updatedAt,
        azit_id: highlight.azit ? Number(highlight.azit.id) : null,
        azit_name: highlight.azit?.azitName ?? null,
      };
    });

    const lastHighlight = actualHighlights[actualHighlights.length - 1];
    const nextCursor = hasNext && lastHighlight ? Number(lastHighlight.id) : null;

    return ok({
      highlights,
      pagination: {
        has_next: hasNext,
        next_cursor: nextCursor,
        limit: limitNum,
      },
    });
  }

  /**
   * 커뮤니티용 통합 하이라이트 목록 조회
   */
  async getCommunityHighlightList(
    cursor: bigint | null,
    limit: number,
    userId: bigint | null // 좋아요 여부 확인용
  ): Promise<Result<any>> { // 리턴 타입은 프로젝트의 ListResDto 형식에 맞게 조정
    
    // 1. 레포지토리에서 데이터 조회
    const highlights = await this.highlightRepository.findCommunityHighlights(cursor, limit);
    
    // 2. 다음 페이지 존재 여부 확인
    const hasNext = highlights.length > limit;
    const items = hasNext ? highlights.slice(0, limit) : highlights;
    const nextCursor = hasNext ? items[items.length - 1].id : null;

    // 3. 현재 유저의 좋아요 여부 일괄 조회 (로그인 시에만)
    const highlightIds = items.map(h => h.id);
    const likedHighlightIds = userId 
      ? await this.highlightRepository.findUserLikesByHighlightIds(userId, highlightIds)
      : [];
    const likedSet = new Set(likedHighlightIds.map(l => l.highlightId));

    // 4. 응답 데이터 매핑
    const result = items.map(h => ({
      highlight_id: Number(h.id),
      user_id: Number(h.userId),
      nickname: h.user.nickname,
      content: h.content,
      medias: h.medias.map(m => ({
        media_url: m.mediaUrl,
        order: m.order
      })),
      like_count: h._count.likes,
      comment_count: h._count.comments,
      is_liked: likedSet.has(h.id),
      created_at: h.createdAt
    }));

    return ok({
      items: result,
      next_cursor: nextCursor ? Number(nextCursor) : null,
      has_next: hasNext
    });
  }
}
