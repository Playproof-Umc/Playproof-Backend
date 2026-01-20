// src/modules/feedback/repositories/feedback.repository.ts
import { singleton } from 'tsyringe';
import { Feedback } from '@prisma/client';

import { prisma } from '../../../common/config/database';

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
}
