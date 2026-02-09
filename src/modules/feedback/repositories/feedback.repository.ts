// src/modules/feedback/repositories/feedback.repository.ts
import { singleton } from 'tsyringe';
import { Feedback } from '@prisma/client';

import { prisma } from '../../../common/config/database';
import { parseFeedbackCursor } from '../utils/feedback.util';

@singleton()
export class FeedbackRepository {
  // ----------------------------------------------------------------------------------------------------
  // 생성
  // ----------------------------------------------------------------------------------------------------

  async createFeedback(
    userId: bigint,
    targetId: bigint,
    scheduleId: bigint,
    content: string | null,
    isBan: boolean,
    tsScoreChange: number,
    tx?: any,
  ): Promise<Feedback> {
    const client = tx || prisma;
    return client.feedback.create({
      data: {
        userId,
        targetId,
        scheduleId,
        content,
        isBan,
        tsScoreChange,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 조회
  // ----------------------------------------------------------------------------------------------------

  async existsFeedbackByUserIdAndTargetIdAndScheduleId(
    userId: bigint,
    targetId: bigint,
    scheduleId: bigint,
  ): Promise<boolean> {
    const feedback = await prisma.feedback.findFirst({
      where: {
        userId,
        targetId,
        scheduleId,
      },
      select: {
        id: true,
      },
    });
    return feedback !== null;
  }

  /**
   * 커서 기반 페이지네이션으로 받은 피드백 목록 조회
   * @param targetId - 피드백을 받은 사용자 ID
   * @param size - 페이지 크기
   * @param cursor - 커서 (created_at|feedback_id 형식)
   * @returns 피드백 목록과 다음 커서 존재 여부
   */
  async findFeedbacksByTargetIdWithCursor(
    targetId: bigint,
    size: number,
    cursor?: string,
  ): Promise<{
    feedbacks: any[];
    hasNext: boolean;
  }> {
    const where: any = {
      targetId,
    };

    // 커서 존재할 때
    if (cursor) {
      const { createdAt: cursorCreatedAt, feedbackId: cursorId } =
        parseFeedbackCursor(cursor);

      where.OR = [
        {
          createdAt: {
            lt: cursorCreatedAt,
          },
        },
        {
          AND: [
            {
              createdAt: cursorCreatedAt,
            },
            {
              id: {
                lt: cursorId,
              },
            },
          ],
        },
      ];
    }

    // 피드백 조회
    const feedbacks = await prisma.feedback.findMany({
      where,
      take: size + 1, // 다음 페이지 존재 여부 확인을 위해 +1
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      include: {
        user: {
          include: {
            userAvatars: {
              where: {
                isEquipped: true,
              },
              include: {
                avatar: true,
              },
              take: 1,
            },
          },
        },
        positiveCategories: {
          include: {
            positive: true,
          },
        },
        negativeCategories: {
          include: {
            negative: true,
          },
        },
      },
    });

    // 다음 페이지 존재 여부 확인
    const hasNext = feedbacks.length > size;
    const resultFeedbacks = hasNext ? feedbacks.slice(0, size) : feedbacks;

    return {
      feedbacks: resultFeedbacks as any,
      hasNext,
    };
  }

  /**
   * 피드백을 작성하지 않은 참여자 목록 조회 (사용자가 참여한 모든 종료된 일정)
   * @param userId - 피드백을 작성할 사용자 ID
   * @returns 피드백 미완료 참여자 목록 (각 참여자마다 schedule_id 포함)
   */
  async findParticipantsWithoutFeedback(
    userId: bigint, // 피드백을 작성할 사용자
  ): Promise<any[]> {
    const now = new Date();

    // 사용자가 참여한 종료된 일정들의 참여자 조회
    const participants = await prisma.azitScheduleParticipation.findMany({
      where: {
        schedule: {
          gameEndAt: {
            lte: now, // 종료된 일정만
          },
          participations: {
            some: {
              member: {
                userId, // 현재 사용자가 참여한 일정
              },
            },
          },
        },
        member: {
          userId: {
            not: userId, // 자기 자신 제외
          },
        },
      },
      select: {
        scheduleId: true,
        member: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                nickname: true,
                userAvatars: {
                  where: {
                    isEquipped: true,
                  },
                  select: {
                    avatar: {
                      select: {
                        avatarUrl: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // 피드백이 이미 작성된 참여자-일정 쌍 조회
    if (participants.length === 0) {
      return [];
    }

    const scheduleIds = [...new Set(participants.map((p) => p.scheduleId))];
    const targetIds = [...new Set(participants.map((p) => p.member.userId))];

    const existingFeedbacks = await prisma.feedback.findMany({
      where: {
        userId,
        scheduleId: {
          in: scheduleIds,
        },
        targetId: {
          in: targetIds,
        },
      },
      select: {
        scheduleId: true,
        targetId: true,
      },
    });

    // 피드백이 작성된 쌍을 Set으로 만들어서 빠른 조회
    const feedbackSet = new Set(
      existingFeedbacks.map((f) => `${f.scheduleId}-${f.targetId}`),
    );

    // 피드백이 없는 참여자만 필터링
    const filteredParticipants = participants.filter(
      (p) => !feedbackSet.has(`${p.scheduleId}-${p.member.userId}`),
    );

    return filteredParticipants;
  }

  /** 동일 유저가 target에게 남긴 긍정 피드백 건수 (W_relation용) */
  async countWRelation(userId: bigint, targetId: bigint): Promise<number> {
    return prisma.feedback.count({
      where: {
        userId,
        targetId,
        positiveCategories: { some: {} },
      },
    });
  }

  /** target에게 긍정 피드백을 남긴 고유 유저 수 (W_diversity용) */
  async countWDiversity(targetId: bigint): Promise<number> {
    const result = await prisma.feedback.groupBy({
      by: ['userId'],
      where: {
        targetId,
        positiveCategories: { some: {} },
      },
    });
    return result.length;
  }
}
