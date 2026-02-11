// src/modules/azit/services/azit-schedule.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitScheduleRole } from '@prisma/client';
import { AzitScheduleParticipationStatus } from '../types/azit-schedule-participation-status';

import {
  AzitScheduleCreateReqDto,
  AzitScheduleUpdateReqDto,
} from '../dtos/azit-schedule.req.dto';
import {
  AzitScheduleResDto,
  AzitScheduleDetailResDto,
  AzitScheduleListResDto,
  AzitScheduleParticipantResDto,
} from '../dtos/azit-schedule.res.dto';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import {
  checkAzitAndMember,
  checkScheduleAndInAzitAndCreator,
  validateScheduleTimes,
} from '../utils/azit.validator';
import { formatDate } from '../utils/azit.util';
import { prisma } from '../../../common/config/database';
import {
  created,
  noContent,
  ok,
  Result,
} from '../../../common/types/result.type';

@injectable()
export class AzitScheduleService {
  constructor(
    @inject(AzitScheduleRepository)
    private azitScheduleRepository: AzitScheduleRepository,
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    @inject(AzitScheduleParticipationRepository)
    private azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  ) {}

  async createSchedule(
    userId: bigint,
    azitId: bigint,
    dto: AzitScheduleCreateReqDto,
  ): Promise<Result<AzitScheduleResDto>> {
    // 1. 아지트 존재, 멤버 존재 확인
    const memberCheckResult = await checkAzitAndMember(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
    );
    if (memberCheckResult.error) {
      return memberCheckResult;
    }

    // 2. 시간 유효성 검증
    const gameStartAt = new Date(dto.game_start_at);
    const gameEndAt = new Date(dto.game_end_at);
    const recruitmentEndAt = new Date(dto.recruitment_end_at);

    const timeError = validateScheduleTimes(
      gameStartAt,
      gameEndAt,
      recruitmentEndAt,
    );
    if (timeError) {
      return timeError;
    }

    // 3. 일정 생성 및 참여 추가 (트랜잭션)
    const schedule = await prisma.$transaction(async (tx) => {
      // 일정 생성
      const createdSchedule = await this.azitScheduleRepository.createSchedule(
        azitId,
        dto.title,
        dto.max_participants,
        gameStartAt,
        gameEndAt,
        recruitmentEndAt,
        tx,
      );

      // 생성자를 CREATOR로 참여 추가
      await this.azitScheduleParticipationRepository.createParticipation(
        memberCheckResult.data.id,
        createdSchedule.id,
        AzitScheduleRole.CREATOR,
        AzitScheduleParticipationStatus.JOIN,
        tx,
      );

      return createdSchedule;
    });

    return created(AzitScheduleResDto.from(schedule));
  }

  async getSchedules(
    userId: bigint,
    azitId: bigint,
    cursor?: string,
    size: number = 10,
  ): Promise<Result<AzitScheduleListResDto>> {
    // 1. 아지트 존재, 멤버 존재 확인
    const memberCheckResult = await checkAzitAndMember(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
    );
    if (memberCheckResult.error) {
      return memberCheckResult;
    }

    // 2. 일정 목록 조회
    const { schedules, hasNext } =
      await this.azitScheduleRepository.findSchedulesByAzitId(
        azitId,
        size,
        cursor,
      );

    // 3. 사용자의 AzitUser ID 조회 (참여 여부 확인용)
    const azitUserId = memberCheckResult.data.id;

    // 4. 각 스케줄의 작성자 여부 확인
    const creatorChecks = await Promise.all(
      schedules.map((schedule: any) =>
        this.azitScheduleParticipationRepository.isScheduleCreator(
          azitUserId,
          schedule.id,
        ),
      ),
    );

    // 5. DTO 매핑
    const mappedSchedules: AzitScheduleDetailResDto[] = schedules.map(
      (schedule: any, index: number) => {
        // 참여자 정보 매핑
        const participants: AzitScheduleParticipantResDto[] =
          schedule.participations.map((participation: any) =>
            AzitScheduleParticipantResDto.from(participation),
          );

        // 사용자 참여 여부 확인
        const isParticipated = schedule.participations.some(
          (p: any) => p.memberId === azitUserId,
        );

        // 사용자가 작성자인지 여부 확인
        const isCreator = creatorChecks[index];

        return AzitScheduleDetailResDto.fromDetail(
          schedule,
          isParticipated,
          isCreator,
          participants,
        );
      },
    );

    // 6. 다음 커서 생성
    let nextCursor: string | null = null;
    if (hasNext && mappedSchedules.length > 0) {
      const lastSchedule = schedules[mappedSchedules.length - 1];
      nextCursor = `${formatDate(lastSchedule.gameStartAt)}|${lastSchedule.id}`;
    }

    return ok(
      AzitScheduleListResDto.from(mappedSchedules, nextCursor, hasNext),
    );
  }

  async updateSchedule(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
    dto: AzitScheduleUpdateReqDto,
  ): Promise<Result<AzitScheduleResDto>> {
    // 1. 일정 존재, 해당 아지트의 일정, 생성자 권한 확인
    const scheduleCheckResult = await checkScheduleAndInAzitAndCreator(
      this.azitUserRepository,
      this.azitScheduleRepository,
      this.azitScheduleParticipationRepository,
      userId,
      azitId,
      scheduleId,
      'update',
    );
    if (scheduleCheckResult.error) {
      return scheduleCheckResult;
    }
    const schedule = scheduleCheckResult.data;

    // 2. 업데이트할 데이터 (undefined, null이면 기존 값 유지)
    const updateData = {
      ...(dto.title != null && { title: dto.title }),
      ...(dto.max_participants != null && {
        maxParticipants: dto.max_participants,
      }),
      ...(dto.game_start_at != null && {
        gameStartAt: new Date(dto.game_start_at),
      }),
      ...(dto.game_end_at != null && {
        gameEndAt: new Date(dto.game_end_at),
      }),
      ...(dto.recruitment_end_at != null && {
        recruitmentEndAt: new Date(dto.recruitment_end_at),
      }),
    };

    // 3. 시간 유효성 검증 (하나라도 값이 있으면 검사)
    if (
      updateData.gameStartAt !== undefined ||
      updateData.gameEndAt !== undefined ||
      updateData.recruitmentEndAt !== undefined
    ) {
      const gameStartAt = updateData.gameStartAt ?? schedule.gameStartAt;
      const gameEndAt = updateData.gameEndAt ?? schedule.gameEndAt;
      const recruitmentEndAt =
        updateData.recruitmentEndAt ?? schedule.recruitmentEndAt;

      const timeError = validateScheduleTimes(
        gameStartAt,
        gameEndAt,
        recruitmentEndAt,
      );
      if (timeError) {
        return timeError;
      }
    }

    // 4. 일정 수정
    const updatedSchedule = await this.azitScheduleRepository.updateSchedule(
      scheduleId,
      updateData,
    );

    return ok(AzitScheduleResDto.from(updatedSchedule));
  }

  async deleteSchedule(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
  ): Promise<Result<null>> {
    // 1. 일정 존재, 해당 아지트의 일정, 생성자 권한 확인
    const scheduleCheckResult = await checkScheduleAndInAzitAndCreator(
      this.azitUserRepository,
      this.azitScheduleRepository,
      this.azitScheduleParticipationRepository,
      userId,
      azitId,
      scheduleId,
      'delete',
    );
    if (scheduleCheckResult.error) {
      return scheduleCheckResult;
    }

    // 2. 일정 삭제
    await this.azitScheduleRepository.deleteSchedule(scheduleId);

    return noContent();
  }
}
