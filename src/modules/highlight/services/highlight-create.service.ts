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
    azitId: bigint,
    dto: HighlightCreateReqDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<Result<HighlightCreateResDto>> {
    // 1. 아지트 존재 및 멤버 권한 확인
    const azitAccessError = await this.highlightValidator.validateAzitAccess<HighlightCreateResDto>(
      userId,
      azitId,
      "생성",
    );
    if (azitAccessError) {
      return azitAccessError;
    }

    // 2. 미디어 파일 검증
    const mediaValidationError = this.highlightValidator.validateMediaFiles(files);
    if (mediaValidationError) {
      return mediaValidationError;
    }

    // files는 위에서 검증되어 null이 아님을 보장
    const validatedFiles = files!;

    try {
      // 3. S3에 파일 업로드
      const mediaUrls: string[] = [];
      for (let i = 0; i < validatedFiles.length; i++) {
        const file = validatedFiles[i];
        const mediaUrl = await uploadFileToS3(file, 'highlights');
        mediaUrls.push(mediaUrl);
      }

      // 4. 미디어 데이터 준비
      const mediaData = mediaUrls.map((url, index) => ({
        mediaUrl: url,
        order: index,
      }));

      // 5. 트랜잭션 사용 - 하이라이트 생성 및 미디어 일괄 생성
      const isPublic = dto.visibility === HighlightVisibility.PUBLIC;
      const { highlight, medias } = await this.highlightRepository.createHighlightWithMedias(
        userId,
        azitId,
        dto.content,
        isPublic,
        mediaData,
      );

      // 6. 사용자 정보 조회
      const highlightWithDetails = await this.highlightRepository.findHighlightById(highlight.id);
      
      if (!highlightWithDetails || !highlightWithDetails.azit) {
        return internalServerError({
          message: "하이라이트 생성 후 조회에 실패했습니다.",
          errorCode: "HIGHLIGHT_CREATE_FAILED",
        });
      }

      // 7. 좋아요 수, 댓글 수 조회 
      const likeCount = 0;
      const commentCount = 0;

      // 8. 응답 DTO 변환
      const mediaDtos: HighlightMediaResDto[] = medias.map((media) => ({
        highlight_media_id: Number(media.id),
        media_url: media.mediaUrl,
        order: media.order,
        upload_at: media.uploadAt,
      }));

      const response: HighlightCreateResDto = {
        highlight_id: Number(highlight.id),
        user_id: Number(highlightWithDetails.userId),
        nickname: highlightWithDetails.user.nickname,
        azit_id: Number(highlightWithDetails.azit.id),
        azit_name: highlightWithDetails.azit.azitName,
        content: highlight.content,
        visibility: dto.visibility,
        media_count: medias.length,
        medias: mediaDtos,
        like_count: likeCount,
        comment_count: commentCount,
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
