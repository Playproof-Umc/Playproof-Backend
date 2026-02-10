// src/modules/azit/repositories/azit-schedule-participation.repository.ts
import { singleton } from 'tsyringe';
import { AzitScheduleParticipation, AzitScheduleRole } from '@prisma/client';
import { AzitScheduleParticipationStatus } from '../types/azit-schedule-participation-status';

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
    status: AzitScheduleParticipationStatus =
      AzitScheduleParticipationStatus.JOIN,
    tx?: any,
  ): Promise<AzitScheduleParticipation> {
    const client = tx || prisma;
    return client.azitScheduleParticipation.create({
      data: {
        memberId,
        scheduleId,
        role,
        isParticipation: status,
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
        isParticipation: AzitScheduleParticipationStatus.JOIN,
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
        isParticipation: true,
      },
    });
    return (
      participation?.memberId != null &&
      participation.isParticipation === AzitScheduleParticipationStatus.JOIN
    );
  }

  async existsParticipationWithStatus(
    memberId: bigint,
    scheduleId: bigint,
    status: AzitScheduleParticipationStatus,
  ): Promise<boolean> {
    const participation = await prisma.azitScheduleParticipation.findFirst({
      where: {
        memberId,
        scheduleId,
        isParticipation: status,
      },
      select: {
        memberId: true,
      },
    });
    return participation !== null;
  }

  async existsParticipationByUserId(
    userId: bigint,
    scheduleId: bigint,
  ): Promise<boolean> {
    const participation = await prisma.azitScheduleParticipation.findFirst({
      where: {
        scheduleId,
        member: {
          userId,
        },
      },
      select: {
        memberId: true,
      },
    });
    return participation !== null;
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

  async updateParticipationStatus(
    memberId: bigint,
    scheduleId: bigint,
    status: AzitScheduleParticipationStatus,
  ): Promise<AzitScheduleParticipation> {
    return prisma.azitScheduleParticipation.update({
      where: {
        memberId_scheduleId: {
          memberId,
          scheduleId,
        },
      },
      data: {
        isParticipation: status,
      },
    });
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
