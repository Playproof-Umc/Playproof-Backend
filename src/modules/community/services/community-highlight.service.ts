import { singleton } from "tsyringe";
import { CommunityHighlightRepository } from "../repositories/community-highlight.repository";
import { 
  CommunityHighlightResDto, 
  CommunityHighlightListResDto, 
  CommunityHighlightUpdateResDto, 
  CommunityHighlightDeleteResDto 
} from "../dtos/community-highlight.res.dto";
import { CommunityHighlightCreateReqDto, CommunityHighlightUpdateReqDto } from "../dtos/community-highlight.req.dto";
import { CommunityHighlightValidator } from "../utils/community-highlight.validator";
import { Result, success } from "../../../common/types/result.type";
import { uploadFileToS3 } from "../../../common/utils/file-util";

@singleton()
export class CommunityHighlightService {
  constructor(private readonly highlightRepository: CommunityHighlightRepository) {}

  // 1. 하이라이트 생성 서비스
  async createHighlight(
    userId: bigint,
    dto: CommunityHighlightCreateReqDto,
    files?: Express.Multer.File[],
  ): Promise<Result<CommunityHighlightUpdateResDto>> {
    if (files && files.length > 0) {
      const mediaUrls: string[] = [];
      for (const file of files) {
        const uploadResult = await uploadFileToS3(file, "community-highlights");
        if (uploadResult.error) return uploadResult;
        mediaUrls.push(uploadResult.data);
      }

      dto.medias = mediaUrls.map((url, index) => ({
        media_url: url,
        order: index,
      }));
    } else {
      dto.medias = undefined;
    }

    const highlight = await this.highlightRepository.createHighlight(userId, dto);
    const result = await this.highlightRepository.findHighlightById(highlight.id, userId);
    
    return success({
      highlight_id: Number(result!.id),
      content: result!.content || "",
      medias: result!.medias.map(m => m.mediaUrl),
      is_public: result!.isPublic,
      updated_at: result!.updatedAt.toISOString()
    });
  }

  // 2. 커뮤니티 하이라이트 목록 조회 서비스
  async getHighlightList(userId: bigint | null, page: number, size: number): Promise<Result<CommunityHighlightListResDto>> {
    const highlights = await this.highlightRepository.findCommunityHighlights(page, size, userId);
    const totalCount = await this.highlightRepository.countHighlights();

    return success({
      highlights: highlights.map(h => ({
        highlight_id: Number(h.id),
        user_id: Number(h.userId),
        nickname: h.user.nickname || "",
        profileUrl: null, // 요청하신 대로 제외
        content: h.content || "",
        medias: h.medias.map(m => m.mediaUrl),
        comment_count: h._count.comments,
        like_count: h._count.likes,
        is_liked: userId ? h.likes.length > 0 : false,
        created_at: h.createdAt.toISOString(),
        updated_at: h.updatedAt.toISOString()
      })),
      meta: {
        total_count: totalCount,
        current_page: page,
        total_pages: Math.ceil(totalCount / size),
        has_next_page: page * size < totalCount
      }
    });
  }

  // 3. 하이라이트 상세 조회 서비스
  async getHighlightDetail(userId: bigint | null, highlightId: bigint): Promise<Result<CommunityHighlightResDto>> {
    const { highlight: h, error } = await CommunityHighlightValidator.checkHighlightAccess(
      this.highlightRepository,
      highlightId,
      userId
    );

    if (error) return error;

    return success({
      highlight_id: Number(h.id),
      user_id: Number(h.userId),
      nickname: h.user.nickname ?? "",
      profileUrl: null,
      content: h.content || "",
      medias: h.medias.map((m: { mediaUrl: string }) => m.mediaUrl),
      azit: h.azit ? {
        azit_id: Number(h.azit.id),
        name: h.azit.azitName // 변경된 azitName 반영
      } : null,
      comment_count: h._count.comments,
      like_count: h._count.likes,
      is_liked: userId ? h.likes.length > 0 : false,
      created_at: h.createdAt.toISOString(),
      updated_at: h.updatedAt.toISOString()
    });
  }

  // 4. 하이라이트 수정 서비스
  async updateHighlight(userId: bigint, highlightId: bigint, dto: CommunityHighlightUpdateReqDto): Promise<Result<CommunityHighlightUpdateResDto>> {
    const { error } = await CommunityHighlightValidator.checkHighlightOwnership(
      this.highlightRepository,
      highlightId,
      userId
    );

    if (error) return error;

    const updated = await this.highlightRepository.updateHighlight(highlightId, dto);
    
    return success({
      highlight_id: Number(updated!.id),
      content: updated!.content || "",
      medias: updated!.medias.map(m => m.mediaUrl),
      is_public: updated!.isPublic,
      updated_at: updated!.updatedAt.toISOString()
    });
  }

  // 5. 하이라이트 삭제 서비스
  async deleteHighlight(userId: bigint, highlightId: bigint): Promise<Result<CommunityHighlightDeleteResDto>> {
    const { error } = await CommunityHighlightValidator.checkHighlightOwnership(
      this.highlightRepository,
      highlightId,
      userId
    );

    if (error) return error;

    await this.highlightRepository.deleteHighlight(highlightId);
    
    return success({
      highlight_id: Number(highlightId),
      message: "성공적으로 삭제되었습니다.",
      deleted_at: new Date().toISOString()
    });
  }
}