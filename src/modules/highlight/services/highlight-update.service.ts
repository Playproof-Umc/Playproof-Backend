// src/modules/highlight/services/highlight-update.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { CommunityMediaRepository } from "../repositories/community-media.repository";
import { AzitRepository } from "../../azit/repositories/azit.repository";
import { HighlightUpdateReqDto, HighlightVisibility } from "../dtos/highlight.req.dto";
import { GetHighlightDetailResDto, HighlightMediaResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  ok,
  notFound,
  forbidden,
  badRequest,
  internalServerError,
} from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { uploadFileToS3 } from "../../../common/utils/file-util";

@injectable()
export class HighlightUpdateService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(CommunityMediaRepository) private communityMediaRepository: CommunityMediaRepository,
    @inject(AzitRepository) private azitRepository: AzitRepository,
  ) {}

  async updateHighlight(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
    dto: HighlightUpdateReqDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<Result<GetHighlightDetailResDto>> {
    // 1. 아지트 존재 여부 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: "아지트를 찾을 수 없습니다.",
        errorCode: PartyErrorCode.NOT_FOUND_AZIT,
      });
    }

    // 2. 하이라이트 존재 여부 및 아지트 소속 확인
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

    // 3. 하이라이트가 해당 아지트에 속하는지 확인
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

    // 4. 업로더 권한 확인
    if (highlight.userId !== userId) {
      return forbidden({
        message: "권한이 없습니다.",
        errorCode: "HIGHLIGHT_FORBIDDEN_UPDATE",
        errors: [
          {
            field: "user_id",
            value: Number(userId),
            reason: "하이라이트 업로더만 수정할 수 있습니다.",
          },
        ],
      });
    }

    // 5. 기존 미디어 개수 확인
    const existingMedias = await this.communityMediaRepository.findMediasByHighlightId(highlightId);
    const existingMediaCount = existingMedias.length;

    // 6. 신규 미디어 파일 검증 (있는 경우)
    if (files && files.length > 0) {
      const totalMediaCount = existingMediaCount + files.length;
      if (totalMediaCount > 10) {
        return badRequest({
          message: "요청 파라미터가 잘못되었습니다.",
          errorCode: "COMMON_INVALID_PARAMETER",
          errors: [
            {
              field: "medias",
              value: null,
              reason: `기존 미디어와 신규 미디어를 합쳐서 최대 10개까지만 가능합니다. (현재: ${existingMediaCount}개 기존 + ${files.length}개 신규 = ${totalMediaCount}개)`,
            },
          ],
        });
      }

      // 6-2. 각 파일 크기 및 타입 검증
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      const errors = [];

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            field: "medias",
            value: file.originalname,
            reason: "파일 크기가 100MB를 초과합니다.",
          });
        }

        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        if (!isImage && !isVideo) {
          errors.push({
            field: "medias",
            value: file.originalname,
            reason: "지원하지 않는 파일 형식입니다. (이미지, 영상만 가능)",
          });
        }
      }

      if (errors.length > 0) {
        return badRequest({
          message: "요청 파라미터가 잘못되었습니다.",
          errorCode: "COMMON_INVALID_PARAMETER",
          errors,
        });
      }
    }

    try {
      // 7. 하이라이트 정보 수정
      const updateData: {
        content?: string | null;
        isPublic?: boolean;
      } = {};

      if (dto.content !== undefined) {
        updateData.content = dto.content || null;
      }

      if (dto.visibility !== undefined) {
        updateData.isPublic = dto.visibility === HighlightVisibility.PUBLIC;
      }

      if (Object.keys(updateData).length > 0) {
        await this.highlightRepository.updateHighlight(highlightId, updateData);
      }

      // 8. 신규 미디어 파일 업로드 및 저장 (있는 경우)
      if (files && files.length > 0) {
        const mediaUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const mediaUrl = await uploadFileToS3(file, 'highlights');
          mediaUrls.push(mediaUrl);
        }

        const maxOrder = existingMedias.length > 0
          ? Math.max(...existingMedias.map((m) => m.order))
          : -1;

        const mediaData = mediaUrls.map((url, index) => ({
          mediaUrl: url,
          order: maxOrder + 1 + index,
        }));

        await this.communityMediaRepository.createHighlightMediaBatch(highlightId, mediaData);
      }

      // 9. 수정된 하이라이트 조회
      const updatedHighlight = await this.highlightRepository.findHighlightById(highlightId);
      
      if (!updatedHighlight) {
        return internalServerError({
          message: "하이라이트 수정 후 조회에 실패했습니다.",
          errorCode: "HIGHLIGHT_UPDATE_FAILED",
        });
      }

      // 10. 사용자 좋아요 여부 확인
      const userLike = await this.highlightRepository.findUserLikeByHighlightId(userId, highlightId);
      const isLiked = !!userLike;

      // 11. 좋아요 수, 댓글 수 계산
      const likeCount = updatedHighlight.likes.length;
      const commentCount = updatedHighlight.comments.length;

      // 12. 미디어 DTO 변환
      const mediaDtos: HighlightMediaResDto[] = updatedHighlight.medias.map((media) => ({
        highlight_media_id: Number(media.id),
        media_url: media.mediaUrl,
        order: media.order,
        upload_at: media.uploadAt,
      }));

      // 13. 응답 DTO 변환
      const response: GetHighlightDetailResDto = {
        highlight_id: Number(updatedHighlight.id),
        azit_id: Number(azit.id),
        azit_name: azit.azitName,
        user_id: Number(updatedHighlight.userId),
        nickname: updatedHighlight.user.nickname,
        content: updatedHighlight.content,
        visibility: updatedHighlight.isPublic ? 'PUBLIC' : 'PRIVATE',
        media_count: updatedHighlight.medias.length,
        medias: mediaDtos,
        like_count: likeCount,
        comment_count: commentCount,
        is_liked: isLiked,
        created_at: updatedHighlight.createdAt,
        updated_at: updatedHighlight.updatedAt,
      };

      return ok(response);
    } catch (error) {
      console.error("Highlight update error:", error);
      return internalServerError({
        message: "하이라이트 수정 중 오류가 발생했습니다.",
        errorCode: "HIGHLIGHT_UPDATE_FAILED",
      });
    }
  }
}
