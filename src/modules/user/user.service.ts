// src/modules/user/user.service.ts
import { injectable, inject } from "tsyringe";
import { UserRepository } from "./user.repository";
import { UserUpdateReqDto} from "./dtos/user.req.dto";
import { UserSignUpResDto, UserUpdateResDto, UserGetResDto, UserFeedbackListResDto } from "./dtos/user.res.dto"; 
import { Result, created, ok, conflict, notFound, success } from "../../common/types/result.type";
import { UserErrorCode } from "../../common/constants/error-code";
import { ResultChain } from "../../common/types/result.chain";
import { checkUserExists } from "./utills/user.validator";

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async getUserById(id: number): Promise<Result<UserGetResDto>> {
    return await ResultChain.of({ id })
      .flatThenAsync(checkUserExists(this.userRepository))
      .flatThenAsync((data) => this.fetchUserStep(data.id))
      .flatThenAsync((user) => this.fetchUserStatsStep(user))
      .flatThen((stats) => Promise.resolve(ok(this.toUserGetResDto(stats))))
      .getResult();
  }

  private async fetchUserStep(userId: number): Promise<Result<any>> {
    const user = await this.userRepository.findById(userId);
    return success(user);
  }

  private async fetchUserStatsStep(user: any): Promise<Result<any>> {
    const [
      tsRank,
      positivePercentage,
      preferredCategoryIds,
      feedbackTags,
      verifiedAccounts,
      favoriteGameIds
    ] = await Promise.all([
      this.userRepository.getUserTsRank(user.trustScore),
      this.userRepository.getPositiveFeedbackPercentage(Number(user.id)),
      this.userRepository.getUserCategoryIds(Number(user.id)),
      this.userRepository.getTop3FeedbackTags(Number(user.id)),
      this.userRepository.getVerifiedGameAccounts(Number(user.id)),
      this.userRepository.getUserPreferredGameIds(Number(user.id))
    ]);

    // 피드백이 없으면 디폴트 50% 설정
    if ( positivePercentage.percentage === 0) {
      positivePercentage.percentage = 50;
    }

    return success({
      user,
      tsRank,
      positivePercentage,
      preferredCategoryIds,
      feedbackTags,
      verifiedAccounts,
      favoriteGameIds
    });
  }

  private toUserGetResDto(stats: any): UserGetResDto {
    const equippedAvatar = stats.user.userAvatars?.[0]?.avatar?.avatarUrl || null;
    return {
      id: Number(stats.user.id),
      nickname: stats.user.nickname,
      statusMessage: stats.user.statusMessage,
      profileImageUrl: equippedAvatar,
      tsRank: stats.tsRank,
      trustScore: stats.user.trustScore,
      positivePercentage: stats.positivePercentage.percentage,
      playStyle: stats.user.playStyle,
      preferredCategoryIds: stats.preferredCategoryIds,
      feedbackTags: stats.feedbackTags,
      verifiedAccounts: stats.verifiedAccounts,
      favoriteGameIds: stats.favoriteGameIds
    };
  }

async getUserFeedbacks(
  id: number, 
  cursorId: number | null, 
  limit: number = 10
): Promise<Result<UserFeedbackListResDto>> {
  return await ResultChain.of({ id, cursorId, limit })
    .flatThenAsync(checkUserExists(this.userRepository))
    .flatThenAsync((data) => this.fetchFeedbacksStep(data))
    .then((feedbacks) => this.processFeedbacksStep(feedbacks, limit))
    .flatThen((processed) => Promise.resolve(ok(processed)))
    .getResult();
}

private async fetchFeedbacksStep(data: {
  id: number;
  cursorId: number | null;
  limit: number;
}): Promise<Result<any[]>> {
  const { id, cursorId, limit } = data;
  const feedbacksRaw = await this.userRepository.findReceivedFeedbacks(
    id, 
    cursorId, 
    limit
  );
  
  return success(feedbacksRaw);
}

private processFeedbacksStep(
  feedbacksRaw: any[], 
  limit: number
): UserFeedbackListResDto {
  let hasNext = false;
  if (feedbacksRaw.length > limit) {
    hasNext = true;
    feedbacksRaw.pop(); 
  }

  const nextCursor = feedbacksRaw.length > 0 
    ? Number(feedbacksRaw[feedbacksRaw.length - 1].id) 
    : null;

  const feedbacks = feedbacksRaw.map((f) => ({
    feedbackId: Number(f.id),
    content: f.content,
    tsScoreChange: f.tsScoreChange,
    createdAt: f.createdAt,
    writer: {
      id: Number(f.user.id),
      nickname: f.user.nickname,
      trustScore: f.user.trustScore,
      avatarUrl: f.user.userAvatars[0]?.avatar.avatarUrl ?? null,
    },
    tags: [
      ...f.positiveCategories.map((pc: any) => pc.positive.name),
      ...f.negativeCategories.map((nc: any) => nc.negative.name),
    ],
  }));

  return {
    feedbacks,
    nextCursor,
    hasNext,
  };
}
}