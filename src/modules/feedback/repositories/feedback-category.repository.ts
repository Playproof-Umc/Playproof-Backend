// src/modules/feedback/repositories/feedback-category.repository.ts
import { singleton } from 'tsyringe';
import {
  FeedbackPositiveCategory,
  FeedbackNegativeCategory,
} from '@prisma/client';

import { prisma } from '../../../common/config/database';

@singleton()
export class FeedbackCategoryRepository {
  // ----------------------------------------------------------------------------------------------------
  // 생성
  // ----------------------------------------------------------------------------------------------------

  async createPositiveCategories(
    feedbackId: bigint,
    positiveCategoryIds: bigint[],
    tx?: any,
  ): Promise<FeedbackPositiveCategory[]> {
    const client = tx || prisma;

    return Promise.all(
      positiveCategoryIds.map((positiveId) =>
        client.feedbackPositiveCategory.create({
          data: {
            feedbackId,
            positiveId,
          },
        }),
      ),
    );
  }

  async createNegativeCategories(
    feedbackId: bigint,
    negativeCategoryIds: bigint[],
    tx?: any,
  ): Promise<FeedbackNegativeCategory[]> {
    const client = tx || prisma;

    return Promise.all(
      negativeCategoryIds.map((negativeId) =>
        client.feedbackNegativeCategory.create({
          data: {
            feedbackId,
            negativeId,
          },
        }),
      ),
    );
  }
}
