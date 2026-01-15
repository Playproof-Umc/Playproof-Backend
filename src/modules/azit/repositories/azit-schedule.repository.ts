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

  /**
   * 커서 기반 페이지네이션으로 일정 목록 조회
   * @param azitId - 아지트 ID
   * @param cursor - 커서 (game_start_at|schedule_id 형식)
   * @param size - 페이지 크기
   * @returns 일정 목록과 다음 커서 존재 여부
   */
  async findSchedulesByAzitId(
    azitId: bigint,
    cursor: string | undefined,
    size: number,
  ): Promise<{
    schedules: any[];
    hasNext: boolean;
  }> {
    // 커서 파싱
    let cursorGameStartAt: Date | undefined = undefined;
    let cursorScheduleId: bigint | undefined = undefined;

    if (cursor) {
      const [gameStartAtStr, scheduleIdStr] = cursor.split('|');
      if (gameStartAtStr && scheduleIdStr) {
        cursorGameStartAt = new Date(gameStartAtStr);
        cursorScheduleId = BigInt(scheduleIdStr);
      }
    }

    // WHERE 조건 구성
    const where: any = {
      azitId,
    };

    if (cursorGameStartAt && cursorScheduleId) {
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
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    userAvatars: {
                      where: {
                        isEquipped: true,
                      },
                      include: {
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
}
