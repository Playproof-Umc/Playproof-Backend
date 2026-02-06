// src/modules/user/user.service.ts
import { injectable, inject } from "tsyringe";
import { UserRepository } from "./user.repository";
import { UserUpdateReqDto} from "./dtos/user.req.dto";
import { UserSignUpResDto, UserUpdateResDto, UserGetResDto } from "./dtos/user.res.dto"; 
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
}