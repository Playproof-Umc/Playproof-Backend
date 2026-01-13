// src/modules/azit/repositories/azit-schedule.repository.ts
import { singleton } from 'tsyringe';

import { AzitSchedule } from '@prisma/client';
import { prisma } from '../../../common/config/database';

@singleton()
export class AzitScheduleRepository {
  async createSchedule(
    azitId: bigint,
    title: string,
    maxParticipants: number,
    gameStartAt: Date,
    gameEndAt: Date,
    recruitmentEndAt: Date,
  ): Promise<AzitSchedule> {
    return prisma.azitSchedule.create({
      data: {
        azitId,
        title,
        maxParticipants,
        gameStartAt,
        gameEndAt,
        recruitmentEndAt,
      },
    });
  }
}
