// src/modules/highlight/services/highlight-delete.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { AzitRepository } from "../../azit/repositories/azit.repository";
import { HighlightDeleteResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  ok,
  notFound,
  forbidden,
  internalServerError,
} from "../../../common/types/result.type";
import { PartyErrorCode, HighlightErrorCode, CommonErrorCode } from "../../../common/constants/error-code";
import { deleteFileFromS3 } from "../../../common/utils/file-util";

@injectable()
export class HighlightDeleteService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(AzitRepository) private azitRepository: AzitRepository,
  ) {}

  async deleteHighlight(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<HighlightDeleteResDto>> {
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
        errorCode: CommonErrorCode.RESOURCE_NOT_FOUND,
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
        errorCode: CommonErrorCode.RESOURCE_NOT_FOUND,
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
        errorCode: HighlightErrorCode.DELETE_FORBIDDEN,
        errors: [
          {
            field: "user_id",
            value: Number(userId),
            reason: "하이라이트 업로더만 삭제할 수 있습니다.",
          },
        ],
      });
    }

    try {
      // 5. 삭제 전 정보 저장 (응답용)
      const mediaCount = highlight.medias.length;
      const deletedAt = new Date();

      // 6. S3에서 미디어 파일들 삭제
      for (const media of highlight.medias) {
        try {
          await deleteFileFromS3(media.mediaUrl);
        } catch (error) {
          // S3 파일 삭제 실패해도 계속 진행 (로깅만)
          console.error(`Failed to delete S3 file: ${media.mediaUrl}`, error);
        }
      }

      // 7. 하이라이트 삭제 (Cascade로 미디어, 좋아요, 댓글도 자동 삭제)
      await this.highlightRepository.deleteHighlight(highlightId);

      // 8. 응답 DTO 생성
      const response: HighlightDeleteResDto = {
        highlight_id: Number(highlight.id),
        azit_id: Number(azit.id),
        user_id: Number(highlight.userId),
        nickname: highlight.user.nickname,
        content: highlight.content,
        deleted_at: deletedAt,
        media_count: mediaCount,
      };

      return ok(response);
    } catch (error) {
      console.error("Highlight delete error:", error);
      return internalServerError({
        message: "하이라이트 삭제 중 오류가 발생했습니다.",
        errorCode: HighlightErrorCode.DELETE_FAILED,
      });
    }
  }
}
