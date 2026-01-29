// src/modules/highlight/utils/highlight-like.validator.ts
import { injectable, inject } from "tsyringe";
import { AzitRepository } from "../../azit/repositories/azit.repository";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository";
import { HighlightRepository } from "../repositories/highlight.repository";
import {
  Result,
  notFound,
  forbidden,
  conflict,
} from "../../../common/types/result.type";
import { HighlightErrorCode, CommonErrorCode } from "../../../common/constants/error-code";

@injectable()
export class HighlightLikeValidator {
  constructor(
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
  ) {}

  /**
   * 좋아요 추가 전 검증 (아지트 권한, 하이라이트 존재/소속, 중복 좋아요)
   */
  async validateForAddLike<T>(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<T> | null> {
    const azitError = await this.validateAzitAccessForLike<T>(
      userId,
      azitId,
      "추가",
    );
    if (azitError) return azitError;

    const highlightError = await this.validateHighlightExistsAndBelongsToAzit<T>(
      highlightId,
      azitId,
    );
    if (highlightError) return highlightError;

    const alreadyLikedError = await this.validateNotAlreadyLiked<T>(
      userId,
      highlightId,
    );
    if (alreadyLikedError) return alreadyLikedError;

    return null;
  }

  /**
   * 좋아요 취소 전 검증 (아지트 권한, 하이라이트 존재/소속, 좋아요 존재)
   */
  async validateForRemoveLike<T>(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<T> | null> {
    const azitError = await this.validateAzitAccessForLike<T>(
      userId,
      azitId,
      "삭제",
    );
    if (azitError) return azitError;

    const highlightError = await this.validateHighlightExistsAndBelongsToAzit<T>(
      highlightId,
      azitId,
    );
    if (highlightError) return highlightError;

    const notLikedError = await this.validateAlreadyLiked<T>(userId, highlightId);
    if (notLikedError) return notLikedError;

    return null;
  }

  /**
   * 좋아요 API 전용 아지트 접근 검증 (에러 메시지/코드 스펙 맞춤)
   */
  private async validateAzitAccessForLike<T>(
    userId: bigint,
    azitId: bigint,
    action: "추가" | "삭제",
  ): Promise<Result<T> | null> {
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: "요청한 리소스를 찾을 수 없습니다.",
        errorCode: CommonErrorCode.RESOURCE_NOT_FOUND,
        errors: [
          { field: "azit_id", value: Number(azitId), reason: "존재하지 않는 아지트입니다." },
        ],
      }) as Result<T>;
    }

    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
      userId,
      azitId,
    );
    if (!azitUser) {
      return forbidden({
        message: "권한이 없습니다.",
        errorCode: "AZIT_NOT_MEMBER",
        errors: [
          {
            field: "azit_id",
            value: Number(azitId),
            reason: `해당 아지트의 멤버만 좋아요를 ${action === "추가" ? "추가" : "삭제"}할 수 있습니다.`,
          },
        ],
      }) as Result<T>;
    }

    return null;
  }

  /**
   * 하이라이트 존재 및 해당 아지트 소속 검증
   */
  private async validateHighlightExistsAndBelongsToAzit<T>(
    highlightId: bigint,
    azitId: bigint,
  ): Promise<Result<T> | null> {
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
      }) as Result<T>;
    }

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
      }) as Result<T>;
    }

    return null;
  }

  /**
   * 이미 좋아요를 누르지 않았는지 검증
   */
  private async validateNotAlreadyLiked<T>(
    userId: bigint,
    highlightId: bigint,
  ): Promise<Result<T> | null> {
    const existing = await this.highlightRepository.findUserLikeByHighlightId(
      userId,
      highlightId,
    );
    if (existing) {
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
      }) as Result<T>;
    }
    return null;
  }

  /**
   * 좋아요를 누른 상태인지 검증
   */
  private async validateAlreadyLiked<T>(
    userId: bigint,
    highlightId: bigint,
  ): Promise<Result<T> | null> {
    const existing = await this.highlightRepository.findUserLikeByHighlightId(
      userId,
      highlightId,
    );
    if (!existing) {
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
      }) as Result<T>;
    }
    return null;
  }
}
