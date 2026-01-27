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
      const { createdAt: cursorCreatedAt, feedbackId: cursorId } = parseFeedbackCursor(cursor);

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
}
