// src/modules/highlight/services/highlight-like.service.ts
import { injectable, inject } from "tsyringe";
import { HighlightRepository } from "../repositories/highlight.repository";
import { HighlightLikeValidator } from "../utils/highlight-like.validator";
import { AzitUserRepository } from "../../azit/repositories/azit-user.repository";
import { HighlightLikeResDto, HighlightUnlikeResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  ok,
  created,
  internalServerError,
} from "../../../common/types/result.type";

@injectable()
export class HighlightLikeService {
  constructor(
    @inject(HighlightRepository) private highlightRepository: HighlightRepository,
    @inject(HighlightLikeValidator) private highlightLikeValidator: HighlightLikeValidator,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
  ) {}

  async addLike(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<HighlightLikeResDto>> {
    const validationError = await this.highlightLikeValidator.validateForAddLike<HighlightLikeResDto>(
      userId,
      azitId,
      highlightId,
    );
    if (validationError) return validationError;

    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(userId, azitId);
    if (!azitUser) {
      return internalServerError({
        message: "멤버 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    const like = await this.highlightRepository.createHighlightLike(userId, highlightId);
    const likeCount = await this.highlightRepository.countLikesByHighlightId(highlightId);
    const highlightWithUser = await this.highlightRepository.findHighlightById(highlightId);
    if (!highlightWithUser?.user) {
      return internalServerError({
        message: "사용자 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    return created({
      highlight_id: Number(highlightId),
      azit_id: Number(azitId),
      member_id: Number(azitUser.id),
      user_id: Number(userId),
      nickname: highlightWithUser.user.nickname,
      liked_at: like.likedAt,
      like_count: likeCount,
      is_liked: true,
    } as HighlightLikeResDto);
  }

  async removeLike(
    userId: bigint,
    azitId: bigint,
    highlightId: bigint,
  ): Promise<Result<HighlightUnlikeResDto>> {
    const validationError = await this.highlightLikeValidator.validateForRemoveLike<HighlightUnlikeResDto>(
      userId,
      azitId,
      highlightId,
    );
    if (validationError) return validationError;

    const azitUser = await this.azitUserRepository.findAzitUserByUserIdAndAzitId(userId, azitId);
    if (!azitUser) {
      return internalServerError({
        message: "멤버 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    await this.highlightRepository.deleteHighlightLike(userId, highlightId);
    const likeCount = await this.highlightRepository.countLikesByHighlightId(highlightId);
    const highlightWithUser = await this.highlightRepository.findHighlightById(highlightId);
    if (!highlightWithUser?.user) {
      return internalServerError({
        message: "사용자 정보를 찾을 수 없습니다.",
        errorCode: "INTERNAL_SERVER_ERROR",
      });
    }

    return ok({
      highlight_id: Number(highlightId),
      azit_id: Number(azitId),
      member_id: Number(azitUser.id),
      user_id: Number(userId),
      nickname: highlightWithUser.user.nickname,
      unliked_at: new Date(),
      like_count: likeCount,
      is_liked: false,
    } as HighlightUnlikeResDto);
  }
}
