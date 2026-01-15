// src/modules/azit/repositories/azit-schedule-participation.repository.ts
import { singleton } from 'tsyringe';

import { AzitScheduleParticipation, AzitScheduleRole } from '@prisma/client';
import { prisma } from '../../../common/config/database';

@singleton()
export class AzitScheduleParticipationRepository {
  async createParticipation(
    memberId: bigint,
    scheduleId: bigint,
    role: AzitScheduleRole = AzitScheduleRole.PARTICIPANT,
  ): Promise<AzitScheduleParticipation> {
    return prisma.azitScheduleParticipation.create({
      data: {
        memberId,
        scheduleId,
        role,
      },
    });
  }

  async findParticipation(
    memberId: bigint,
    scheduleId: bigint,
  ): Promise<AzitScheduleParticipation | null> {
    return prisma.azitScheduleParticipation.findUnique({
      where: {
        memberId_scheduleId: {
          memberId,
          scheduleId,
        },
      },
    });
  }

  async countParticipations(scheduleId: bigint): Promise<number> {
    return prisma.azitScheduleParticipation.count({
      where: {
        scheduleId,
      },
    });
  }

  async deleteParticipation(
    memberId: bigint,
    scheduleId: bigint,
  ): Promise<AzitScheduleParticipation> {
    return prisma.azitScheduleParticipation.delete({
      where: {
        memberId_scheduleId: {
          memberId,
          scheduleId,
        },
      },
    });
  }
}
