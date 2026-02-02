// src/modules/highlight/services/highlight-create.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { HighlightValidator } from "../utils/highlight.validator";
import { HighlightCreateReqDto, HighlightVisibility } from "../dtos/highlight.req.dto";
import { HighlightCreateResDto, HighlightMediaResDto } from "../dtos/highlight.res.dto";
import { Result, ok, created, internalServerError } from "../../../common/types/result.type";
import { uploadFileToS3 } from "../../../common/utils/file-util";

@injectable()
export class HighlightCreateService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(HighlightValidator) private highlightValidator: HighlightValidator,
  ) {}

  async createHighlight(
    userId: bigint,
    azitId: bigint | null,
    dto: HighlightCreateReqDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<Result<HighlightCreateResDto>> {
    
    // 1. 아지트 유입인 경우에만 권한 확인
    if (azitId) {
      const azitAccessError = await this.highlightValidator.validateAzitAccess<HighlightCreateResDto>(
        userId, azitId, "생성",
      );
      if (azitAccessError) return azitAccessError;
    }

    // 2. 미디어 파일 검증 (기존 로직 유지)
    const mediaValidationError = this.highlightValidator.validateMediaFiles(files);
    if (mediaValidationError) return mediaValidationError;

    const validatedFiles = files!;

    try {
      // 3. S3 파일 업로드 (기존 로직 유지)
      const mediaUrls: string[] = [];
      for (const file of validatedFiles) {
        const uploadResult = await uploadFileToS3(file, 'highlights');
        if (uploadResult.error) return uploadResult;
        mediaUrls.push(uploadResult.data);
      }

      const mediaData = mediaUrls.map((url, index) => ({ mediaUrl: url, order: index }));

      // 4. 공개 범위 결정 
      const isPublic = azitId ? (dto.visibility === HighlightVisibility.PUBLIC) : true;

      // 5. DB 저장
      const { highlight, medias } = await this.highlightRepository.createHighlightWithMedias(
        userId, azitId, dto.content, isPublic, mediaData,
      );

      // 6. 생성 후 정보 조회 (Optional Chaining으로 아지트 미소속 대응)
      const highlightWithDetails = await this.highlightRepository.findHighlightById(highlight.id);
      
      if (!highlightWithDetails) {
        return internalServerError({
          message: "하이라이트 생성 후 조회에 실패했습니다.",
          errorCode: "HIGHLIGHT_CREATE_FAILED",
        });
      }

      // 7. 응답 DTO 변환 (Safe Navigation 활용)
      const response: HighlightCreateResDto = {
        highlight_id: Number(highlight.id),
        user_id: Number(highlightWithDetails.userId),
        nickname: highlightWithDetails.user.nickname,
        azit_id: highlightWithDetails.azit ? Number(highlightWithDetails.azit.id) : undefined,
        azit_name: highlightWithDetails.azit?.azitName,
        content: highlight.content,
        visibility: isPublic ? HighlightVisibility.PUBLIC : HighlightVisibility.PRIVATE,
        media_count: medias.length,
        medias: medias.map(m => ({
          highlight_media_id: Number(m.id),
          media_url: m.mediaUrl,
          order: m.order,
          upload_at: m.uploadAt,
        })),
        like_count: 0,
        comment_count: 0,
        created_at: highlight.createdAt,
        updated_at: highlight.updatedAt,
      };

      return created(response);
    } catch (error) {
      console.error("Highlight creation error:", error);
      return internalServerError({
        message: "하이라이트 생성 중 오류가 발생했습니다.",
        errorCode: "HIGHLIGHT_CREATE_FAILED",
      });
    }
  }
}
