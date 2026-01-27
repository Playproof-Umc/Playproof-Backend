// src/modules/highlight/services/highlight-like.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { HighlightValidator } from "../utils/highlight.validator";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository";
import { HighlightLikeResDto, HighlightUnlikeResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  ok,
  created,
  conflict,
  notFound,
  internalServerError,
} from "../../../common/types/result.type";
import { HighlightErrorCode, CommonErrorCode } from "../../../common/constants/error-code";

@injectable()
export class HighlightLikeService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(HighlightValidator) private highlightValidator: HighlightValidator,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  async addLike(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<HighlightLikeResDto>> {
    // 1. 아지트 존재 및 멤버 권한 확인
    const azitAccessError = await this.highlightValidator.validateAzitAccess<HighlightLikeResDto>(
      userId,
      azitId,
      "좋아요",
    );
    if (azitAccessError) {
      return azitAccessError;
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

    // 4. 이미 좋아요를 눌렀는지 확인
    const existingLike = await this.highlightRepository.findUserLikeByHighlightId(userId, highlightId);
    if (existingLike) {
      return conflict({
        message: "이미 존재하는 좋아요입니다.",
        errorCode: HighlightErrorCode.LIKE_ALREADY_EXISTS,
        errors: [
          {
            field: "highlight_id",
            value: Number(highlightId),
            reason: "이미 이 하이라이트에 좋아요를 추가했습니다.",
          },
        ],
      });
    }

    // 5. 멤버 정보 조회 
    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(userId, azitId);
    if (!azitUser) {
      return internalServerError({
        message: "멤버 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    // 6. 좋아요 생성
    const like = await this.highlightRepository.createHighlightLike(userId, highlightId);

    // 7. 업데이트된 좋아요 수 조회
    const likeCount = await this.highlightRepository.countLikesByHighlightId(highlightId);

    // 8. 사용자 정보 조회 
    const highlightWithUser = await this.highlightRepository.findHighlightById(highlightId);
    if (!highlightWithUser || !highlightWithUser.user) {
      return internalServerError({
        message: "사용자 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    // 9. 응답 DTO 생성
    const response: HighlightLikeResDto = {
      highlight_id: Number(highlightId),
      azit_id: Number(azitId),
      member_id: Number(azitUser.id),
      user_id: Number(userId),
      nickname: highlightWithUser.user.nickname,
      liked_at: like.likedAt,
      like_count: likeCount,
      is_liked: true,
    };

    return created(response);
  }

  async removeLike(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<HighlightUnlikeResDto>> {
    // 1. 아지트 존재 및 멤버 권한 확인
    const azitAccessError = await this.highlightValidator.validateAzitAccess<HighlightUnlikeResDto>(
      userId,
      azitId,
      "좋아요",
    );
    if (azitAccessError) {
      return azitAccessError;
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

    // 4. 좋아요가 존재하는지 확인
    const existingLike = await this.highlightRepository.findUserLikeByHighlightId(userId, highlightId);
    if (!existingLike) {
      return notFound({
        message: "요청한 리소스를 찾을 수 없습니다.",
        errorCode: HighlightErrorCode.LIKE_NOT_FOUND,
        errors: [
          {
            field: "highlight_id",
            value: Number(highlightId),
            reason: "이 하이라이트에 좋아요를 추가하지 않았습니다.",
          },
        ],
      });
    }

    // 5. 멤버 정보 조회
    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(userId, azitId);
    if (!azitUser) {
      return internalServerError({
        message: "멤버 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    // 6. 좋아요 삭제
    await this.highlightRepository.deleteHighlightLike(userId, highlightId);

    // 7. 업데이트된 좋아요 수 조회
    const likeCount = await this.highlightRepository.countLikesByHighlightId(highlightId);

    // 8. 사용자 정보 조회
    const highlightWithUser = await this.highlightRepository.findHighlightById(highlightId);
    if (!highlightWithUser || !highlightWithUser.user) {
      return internalServerError({
        message: "사용자 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    // 9. 응답 DTO 생성
    const response: HighlightUnlikeResDto = {
      highlight_id: Number(highlightId),
      azit_id: Number(azitId),
      member_id: Number(azitUser.id),
      user_id: Number(userId),
      nickname: highlightWithUser.user.nickname,
      unliked_at: new Date(),
      like_count: likeCount,
      is_liked: false,
    };

    return ok(response);
  }
}
