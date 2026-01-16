// src/modules/highlight/services/highlight-create.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { CommunityMediaRepository } from "../repositories/community-media.repository";
import { AzitRepository } from "../../azit/repositories/azit.repository";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository";
import { HighlightCreateReqDto, HighlightVisibility } from "../dtos/highlight.req.dto";
import { HighlightCreateResDto, HighlightMediaResDto } from "../dtos/highlight.res.dto";
import { Result, ok, created, notFound, forbidden, badRequest, internalServerError } from "../../../common/types/result.type";
import { PartyErrorCode } from "../../../common/constants/error-code";
import { uploadFileToS3 } from "../../../common/utils/file-util";

@injectable()
export class HighlightCreateService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(CommunityMediaRepository) private communityMediaRepository: CommunityMediaRepository,
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  async createHighlight(
    userId: bigint,
    azitId: bigint,
    dto: HighlightCreateReqDto,
    files: Express.Multer.File[] | undefined,
  ): Promise<Result<HighlightCreateResDto>> {
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
        message: "아지트 멤버만 하이라이트를 생성할 수 있습니다.",
        errorCode: "HIGHLIGHT_CREATE_FORBIDDEN",
      });
    }

    // 3. 미디어 파일 검증
    if (!files || files.length === 0) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "medias",
            value: null,
            reason: "최소 1개 이상의 미디어 파일이 필요합니다.",
          },
        ],
      });
    }

    if (files.length > 10) {
      return badRequest({
        message: "요청 파라미터가 잘못되었습니다.",
        errorCode: "COMMON_INVALID_PARAMETER",
        errors: [
          {
            field: "medias",
            value: null,
            reason: "최대 10개의 미디어 파일까지만 업로드할 수 있습니다.",
          },
        ],
      });
    }

    // 4. 각 파일 크기 및 타입 검증
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

    try {
      // 5. Highlight 생성
      const isPublic = dto.visibility === HighlightVisibility.PUBLIC;
      const highlight = await this.highlightRepository.createHighlight(
        userId,
        azitId,
        dto.content,
        isPublic,
      );

      // 6. S3에 파일 업로드 및 CommunityMedia 생성
      const mediaUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mediaUrl = await uploadFileToS3(file, 'highlights');
        mediaUrls.push(mediaUrl);
      }

      // 7. CommunityMedia 일괄 생성
      const mediaData = mediaUrls.map((url, index) => ({
        mediaUrl: url,
        order: index,
      }));

      await this.communityMediaRepository.createHighlightMediaBatch(highlight.id, mediaData);

      // 8. 생성된 미디어 조회
      const medias = await this.communityMediaRepository.findMediasByHighlightId(highlight.id);

      // 9. 좋아요 수, 댓글 수 조회 (생성 직후이므로 0)
      const likeCount = 0;
      const commentCount = 0;

      // 10. 사용자 정보 조회 (닉네임)
      const highlightWithDetails = await this.highlightRepository.findHighlightById(highlight.id);
      
      if (!highlightWithDetails) {
        return internalServerError({
          message: "하이라이트 생성 후 조회에 실패했습니다.",
          errorCode: "HIGHLIGHT_CREATE_FAILED",
        });
      }

      // 11. 응답 DTO 변환
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
        azit_id: Number(azit.id),
        azit_name: azit.azitName,
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
