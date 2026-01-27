import { injectable, inject } from 'tsyringe';

import { AzitScheduleParticipationRepository } from '../../azit/repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../../azit/repositories/azit-schedule.repository';
import { UserRepository } from '../../user/user.repository';
import { FeedbackCreateReqDto } from '../dtos/feedback.req.dto';
import { FeedbackCreateResDto, FeedbackListResDto, FeedbackResDto, FeedbackCategoryResDto } from '../dtos/feedback.res.dto';
import { FeedbackCategoryRepository } from '../repositories/feedback-category.repository';
import { FeedbackRepository } from '../repositories/feedback.repository';
import { validateFeedbackCreation } from '../utils/feedback.validator';
import { formatDate } from '../utils/feedback.util';
import { prisma } from '../../../common/config/database';
import { Result, created, ok } from '../../../common/types/result.type';

@injectable()
export class FeedbackService {
  constructor(
    @inject(FeedbackRepository) private feedbackRepository: FeedbackRepository,
    @inject(FeedbackCategoryRepository)
    private feedbackCategoryRepository: FeedbackCategoryRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(AzitScheduleRepository)
    private azitScheduleRepository: AzitScheduleRepository,
    @inject(AzitScheduleParticipationRepository)
    private azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  ) {}

  async createFeedback(
    userId: bigint,
    dto: FeedbackCreateReqDto,
  ): Promise<Result<FeedbackCreateResDto>> {
    const {
      targetId,
      scheduleId,
      positiveCategoryIds = [],
      negativeCategoryIds = [],
      content,
      isBan = false,
    } = dto;

    const targetIdBigInt = BigInt(targetId);
    const scheduleIdBigInt = BigInt(scheduleId);

    // 피드백 생성 가능 여부 검증 (중복 검사 포함)
    const validationResult = await validateFeedbackCreation(
      this.userRepository,
      this.azitScheduleRepository,
      this.azitScheduleParticipationRepository,
      this.feedbackRepository,
      userId,
      targetIdBigInt,
      scheduleIdBigInt,
    );
    if (validationResult.error) {
      return validationResult;
    }

    // 트랜잭션으로 묶어서 처리
    const result = await prisma.$transaction(async (tx) => {
      // 피드백 생성
      const feedback = await this.feedbackRepository.createFeedback(
        userId,
        targetIdBigInt,
        scheduleIdBigInt,
        content || null,
        isBan,
        tx,
      );

      // 긍정 카테고리 생성
      if (positiveCategoryIds.length > 0) {
        await this.feedbackCategoryRepository.createPositiveCategories(
          feedback.id,
          positiveCategoryIds.map((id) => BigInt(id)),
          tx,
        );
      }

      // 부정 카테고리 생성
      if (negativeCategoryIds.length > 0) {
        await this.feedbackCategoryRepository.createNegativeCategories(
          feedback.id,
          negativeCategoryIds.map((id) => BigInt(id)),
          tx,
        );
      }

      // isBan이 true일 때 차단 테이블에 추가

      return feedback;
    });

    return created({
      id: Number(result.id),
    });
  }

  async getFeedbacksMyPage(
    userId: bigint,
    cursor?: string,
    size: number = 15,
  ): Promise<Result<FeedbackListResDto>> {

    // 피드백 목록 조회
    const { feedbacks: feedbacksData, hasNext } =
      await this.feedbackRepository.findFeedbacksByTargetIdWithCursor(userId, size, cursor);

    // 응답 DTO 변환
    const feedbacks: FeedbackResDto[] = feedbacksData.map((feedback) =>
      FeedbackResDto.from(feedback),
    );

    // 다음 커서 생성
    let nextCursor: string | null = null;
    if (hasNext && feedbacks.length > 0) {
      const lastFeedback = feedbacksData[feedbacks.length - 1];
      nextCursor = `${formatDate(lastFeedback.createdAt)}|${lastFeedback.id}`;
    }

    return ok(FeedbackListResDto.from(feedbacks, nextCursor, hasNext));
  }
}
