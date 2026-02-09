import { injectable, inject } from 'tsyringe';

import { AzitScheduleParticipationRepository } from '../../azit/repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../../azit/repositories/azit-schedule.repository';
import { UserRepository } from '../../user/user.repository';
import {
  computeNewTemperScoreAfterFeedback,
  computePraiseScoreWithWeights,
  getMaxNegativePenalty,
} from '../../../common/utils/temper-score.util';
import { FeedbackCreateReqDto } from '../dtos/feedback.req.dto';
import {
  FeedbackCreateResDto,
  FeedbackListResDto,
  FeedbackResDto,
  FeedbackPendingListResDto,
  FeedbackPendingResDto,
} from '../dtos/feedback.res.dto';
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

    // DB에 저장할 순수 점수 (가중치 미적용)
    let tsScoreChange = 0;
    if (positiveCategoryIds.length > 0) {
      tsScoreChange = 5; // 칭찬 기본 점수
    }
    if (negativeCategoryIds.length > 0) {
      tsScoreChange -= getMaxNegativePenalty(negativeCategoryIds);
    }

    // TS 계산 시 가중치 적용을 위한 정보 수집 (칭찬인 경우만)
    let wRelationData: {
      sameGiverCount: number;
      minutesSinceGameEnd: number;
      uniqueGiverCount: number;
    } | null = null;
    if (positiveCategoryIds.length > 0) {
      const schedule = await this.azitScheduleRepository.findScheduleById(
        scheduleIdBigInt,
      );
      const now = new Date();
      const minutesSinceGameEnd = schedule?.gameEndAt
        ? Math.floor((now.getTime() - schedule.gameEndAt.getTime()) / 60_000)
        : 24 * 60 + 1;
      const prevPraiseCount = await this.feedbackRepository.countWRelation(
        userId,
        targetIdBigInt,
      );
      const sameGiverCount = prevPraiseCount + 1;
      const prevUniqueGiverCount =
        await this.feedbackRepository.countWDiversity(targetIdBigInt);
      const hasGivenBefore = prevPraiseCount > 0;
      const uniqueGiverCount = hasGivenBefore
        ? prevUniqueGiverCount
        : prevUniqueGiverCount + 1;
      wRelationData = {
        sameGiverCount,
        minutesSinceGameEnd,
        uniqueGiverCount,
      };
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
        tsScoreChange,
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

      // target 유저 TS 갱신 (가중치 적용)
      const currentTs = await this.userRepository.findTrustScoreById(
        targetIdBigInt,
        tx,
      );
      if (currentTs != null) {
        // 칭찬인 경우 가중치 적용, 부정인 경우 순수 점수 그대로 사용
        let effectiveTsChange = tsScoreChange;
        if (positiveCategoryIds.length > 0 && wRelationData) {
          effectiveTsChange = computePraiseScoreWithWeights(
            tsScoreChange, // basePoints (5)
            wRelationData.sameGiverCount,
            wRelationData.minutesSinceGameEnd,
            wRelationData.uniqueGiverCount,
          );
        }
        const newTs = computeNewTemperScoreAfterFeedback(
          currentTs,
          effectiveTsChange,
        );
        await this.userRepository.updateTrustScore(targetIdBigInt, newTs, tx);
      }

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
      await this.feedbackRepository.findFeedbacksByTargetIdWithCursor(
        userId,
        size,
        cursor,
      );

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

  async getPendingTargets(
    userId: bigint,
  ): Promise<Result<FeedbackPendingListResDto>> {
    // 피드백 미완료 대상자 조회 (사용자가 참여한 모든 종료된 일정)
    const participations =
      await this.feedbackRepository.findParticipantsWithoutFeedback(userId);

    // 응답 DTO 변환
    const targets: FeedbackPendingResDto[] = participations.map(
      (participation) => FeedbackPendingResDto.from(participation),
    );

    return ok({
      targets,
    });
  }
}
