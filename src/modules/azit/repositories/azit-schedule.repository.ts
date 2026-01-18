// src/modules/azit/repositories/azit-schedule.repository.ts
import { singleton } from 'tsyringe';
import { AzitSchedule } from '@prisma/client';

import { prisma } from '../../../common/config/database';
import { parseScheduleCursor } from '../utils/azit.util';

@singleton()
export class AzitScheduleRepository {
  // ----------------------------------------------------------------------------------------------------
  // 생성
  // ----------------------------------------------------------------------------------------------------

  async createSchedule(
    azitId: bigint,
    title: string,
    maxParticipants: number,
    gameStartAt: Date,
    gameEndAt: Date,
    recruitmentEndAt: Date,
    tx?: any,
  ): Promise<AzitSchedule> {
    const client = tx || prisma;
    return client.azitSchedule.create({
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

  // ----------------------------------------------------------------------------------------------------
  // 조회: azitId
  // ----------------------------------------------------------------------------------------------------

  /**
   * 커서 기반 페이지네이션으로 일정 목록 조회
   * @param azitId - 아지트 ID
   * @param cursor - 커서 (game_start_at|schedule_id 형식)
   * @param size - 페이지 크기
   * @returns 일정 목록과 다음 커서 존재 여부
   */
  async findSchedulesByAzitId(
    azitId: bigint,
    size: number,
    cursor?: string,
  ): Promise<{
    schedules: any[];
    hasNext: boolean;
  }> {
    // WHERE 조건 구성
    const where: any = {
      azitId,
    };

    // 커서 존재할 때
    if (cursor) {
      const { gameStartAt: cursorGameStartAt, scheduleId: cursorScheduleId } =
        parseScheduleCursor(cursor);
      where.OR = [
        {
          gameStartAt: {
            gt: cursorGameStartAt,
          },
        },
        {
          AND: [
            {
              gameStartAt: cursorGameStartAt,
            },
            {
              id: {
                gt: cursorScheduleId,
              },
            },
          ],
        },
      ];
    }

    // 일정 조회 (참여자 정보 포함)
    const schedules = await prisma.azitSchedule.findMany({
      where,
      take: size + 1, // 다음 페이지 존재 여부 확인을 위해 +1
      orderBy: [
        {
          gameStartAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      include: {
        participations: {
          select: {
            memberId: true,
            member: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    userAvatars: {
                      where: {
                        isEquipped: true,
                      },
                      take: 1,
                      select: {
                        avatar: {
                          select: {
                            avatarUrl: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 다음 페이지 존재 여부 확인
    const hasNext = schedules.length > size;
    const resultSchedules = hasNext ? schedules.slice(0, size) : schedules;

    return {
      schedules: resultSchedules as any,
      hasNext,
    };
  }

  // ----------------------------------------------------------------------------------------------------
  // 조회: scheduleId
  // ----------------------------------------------------------------------------------------------------

  async findScheduleById(scheduleId: bigint): Promise<AzitSchedule | null> {
    return prisma.azitSchedule.findUnique({
      where: {
        id: scheduleId,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 수정
  // ----------------------------------------------------------------------------------------------------

  async updateSchedule(
    scheduleId: bigint,
    data: {
      title?: string;
      maxParticipants?: number;
      gameStartAt?: Date;
      gameEndAt?: Date;
      recruitmentEndAt?: Date;
    },
  ): Promise<AzitSchedule> {
    return prisma.azitSchedule.update({
      where: {
        id: scheduleId,
      },
      data: {
        ...data,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 삭제
  // ----------------------------------------------------------------------------------------------------

  async deleteSchedule(scheduleId: bigint): Promise<AzitSchedule> {
    return prisma.azitSchedule.delete({
      where: {
        id: scheduleId,
      },
    });
  }
}
