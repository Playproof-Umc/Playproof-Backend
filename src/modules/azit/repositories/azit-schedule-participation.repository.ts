// src/modules/azit/repositories/azit-schedule-participation.repository.ts
import { singleton } from 'tsyringe';
import { AzitScheduleParticipation, AzitScheduleRole } from '@prisma/client';

import { prisma } from '../../../common/config/database';

@singleton()
export class AzitScheduleParticipationRepository {
  // ----------------------------------------------------------------------------------------------------
  // 생성
  // ----------------------------------------------------------------------------------------------------

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

  // ----------------------------------------------------------------------------------------------------
  // 조회: scheduleId
  // ----------------------------------------------------------------------------------------------------

  async countParticipations(scheduleId: bigint): Promise<number> {
    return prisma.azitScheduleParticipation.count({
      where: {
        scheduleId,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 존재 여부 확인
  // ----------------------------------------------------------------------------------------------------

  async existsParticipation(
    memberId: bigint,
    scheduleId: bigint,
  ): Promise<boolean> {
    const participation = await prisma.azitScheduleParticipation.findUnique({
      where: {
        memberId_scheduleId: {
          memberId,
          scheduleId,
        },
      },
      select: {
        memberId: true,
      },
    });
    return participation !== null;
  }

  // ----------------------------------------------------------------------------------------------------
  // 삭제
  // ----------------------------------------------------------------------------------------------------

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

  // ----------------------------------------------------------------------------------------------------
  // 역할 확인
  // ----------------------------------------------------------------------------------------------------

  async isScheduleCreator(
    memberId: bigint,
    scheduleId: bigint,
  ): Promise<boolean> {
    const participation = await prisma.azitScheduleParticipation.findFirst({
      where: {
        memberId,
        scheduleId,
        role: AzitScheduleRole.CREATOR,
      },
    });
    return participation !== null;
  }
}
