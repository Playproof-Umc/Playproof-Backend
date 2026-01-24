// src/modules/highlight/services/highlight-update.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { HighlightValidator } from "../utils/highlight.validator";
import { HighlightUpdateReqDto, HighlightVisibility } from "../dtos/highlight.req.dto";
import { GetHighlightDetailResDto, HighlightMediaResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  ok,
  notFound,
  forbidden,
  internalServerError,
} from "../../../common/types/result.type";
import { uploadFileToS3 } from "../../../common/utils/file-util";

@injectable()
export class HighlightUpdateService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(HighlightValidator) private highlightValidator: HighlightValidator,
  ) {}

  async updateHighlight(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
    dto: HighlightUpdateReqDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<Result<GetHighlightDetailResDto>> {
    // 1. 아지트 존재 및 멤버 권한 확인
    const azitAccessError = await this.highlightValidator.validateAzitAccess<GetHighlightDetailResDto>(
      userId,
      azitId,
      "수정",
    );
    if (azitAccessError) {
      return azitAccessError;
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
    const existingMedias = await this.highlightRepository.findMediasByHighlightId(highlightId);
    const existingMediaCount = existingMedias.length;

    // 6. 신규 미디어 파일 검증 (있는 경우)
    if (files && files.length > 0) {
      const mediaCountError = this.highlightValidator.validateMediaCountForUpdate(
        existingMediaCount,
        files.length,
      );
      if (mediaCountError) {
        return mediaCountError;
      }

      const mediaValidationError = this.highlightValidator.validateNewMediaFiles(files);
      if (mediaValidationError) {
        return mediaValidationError;
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
          const uploadResult = await uploadFileToS3(file, 'highlights');
          if (uploadResult.error) {
            return uploadResult;
          }
          mediaUrls.push(uploadResult.data);
        }

        const maxOrder = existingMedias.length > 0
          ? Math.max(...existingMedias.map((m) => m.order))
          : -1;

        const mediaData = mediaUrls.map((url, index) => ({
          mediaUrl: url,
          order: maxOrder + 1 + index,
        }));

        await this.highlightRepository.createHighlightMediaBatch(highlightId, mediaData);
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
        azit_id: Number(updatedHighlight.azitId),
        azit_name: updatedHighlight.azit?.azitName || "",
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
