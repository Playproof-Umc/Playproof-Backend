// src/modules/azit/services/azit-schedule.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitScheduleRole } from '@prisma/client';

import {
  AzitScheduleCreateReqDto,
  AzitScheduleUpdateReqDto,
} from '../dtos/azit-schedule.req.dto';
import {
  AzitScheduleCreateResDto,
  AzitScheduleItemResDto,
  AzitScheduleListResDto,
  AzitScheduleParticipantResDto,
} from '../dtos/azit-schedule.res.dto';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import {
  checkAzitAndMember,
  checkScheduleAndInAzit,
  checkScheduleAndInAzitAndCreator,
  validateScheduleTimes,
} from '../utils/azit.validator';
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

  /**
   * 날짜 포맷팅 유틸리티 (한국 시간으로 변환)
   * @param date - 포맷팅할 날짜
   * @returns "YYYY-MM-DDTHH:mm:ss" 형식의 문자열
   */
  private formatDate(date: Date): string {
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return kstDate.toISOString().substring(0, 19);
  }

  // ----------------------------------------------------------------------------------------------------

  async createSchedule(
    userId: bigint,
    azitId: bigint,
    dto: AzitScheduleCreateReqDto,
  ): Promise<Result<AzitScheduleCreateResDto>> {
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

    // 3. 일정 생성
    const schedule = await this.azitScheduleRepository.createSchedule(
      azitId,
      dto.title,
      dto.max_participants,
      gameStartAt,
      gameEndAt,
      recruitmentEndAt,
    );

    // 4. 생성자를 CREATOR로 참여 추가
    await this.azitScheduleParticipationRepository.createParticipation(
      memberCheckResult.data.id,
      schedule.id,
      AzitScheduleRole.CREATOR,
    );

    return created({
      schedule_id: Number(schedule.id),
      title: schedule.title,
      max_participants: schedule.maxParticipants,
      game_start_at: this.formatDate(schedule.gameStartAt),
      game_end_at: this.formatDate(schedule.gameEndAt),
      recruitment_end_at: this.formatDate(schedule.recruitmentEndAt),
    });
  }

  async getSchedules(
    userId: bigint,
    azitId: bigint,
    cursor: string | undefined,
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
        cursor,
        size,
      );

    // 3. 사용자의 AzitUser ID 조회 (참여 여부 확인용)
    const azitUserId = memberCheckResult.data.id;

    // 4. DTO 매핑
    const mappedSchedules: AzitScheduleItemResDto[] = schedules.map(
      (schedule: any) => {
        // 참여자 정보 매핑
        const participants: AzitScheduleParticipantResDto[] =
          schedule.participations.map((participation: any) => {
            const user = participation.member.user;
            const avatarUrl = user.userAvatars[0]?.avatar?.avatarUrl || null;

            return {
              user_id: Number(user.id),
              nickname: user.nickname,
              avatar_url: avatarUrl,
            };
          });

        // 사용자 참여 여부 확인
        const isParticipated = schedule.participations.some(
          (p: any) => p.member.id === azitUserId,
        );

        return {
          schedule_id: Number(schedule.id),
          title: schedule.title,
          max_participants: schedule.maxParticipants,
          game_start_at: this.formatDate(schedule.gameStartAt),
          game_end_at: this.formatDate(schedule.gameEndAt),
          recruitment_end_at: this.formatDate(schedule.recruitmentEndAt),
          current_participants: schedule.participations.length,
          is_participated: isParticipated,
          participants,
        };
      },
    );

    // 5. 다음 커서 생성
    let nextCursor: string | null = null;
    if (hasNext && mappedSchedules.length > 0) {
      const lastSchedule = schedules[mappedSchedules.length - 1];
      nextCursor = `${this.formatDate(lastSchedule.gameStartAt)}|${
        lastSchedule.id
      }`;
    }

    return ok({
      schedules: mappedSchedules,
      nextCursor,
      hasNext,
    });
  }

  async updateSchedule(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
    dto: AzitScheduleUpdateReqDto,
  ): Promise<Result<AzitScheduleCreateResDto>> {
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

    // 5. 업데이트할 데이터 (undefined, null이면 기존 값 유지)
    const updateData: {
      title?: string;
      maxParticipants?: number;
      gameStartAt?: Date;
      gameEndAt?: Date;
      recruitmentEndAt?: Date;
    } = {};

    if (dto.title !== undefined && dto.title !== null) {
      updateData.title = dto.title;
    }
    if (dto.max_participants !== undefined && dto.max_participants !== null) {
      updateData.maxParticipants = dto.max_participants;
    }
    if (dto.game_start_at !== undefined && dto.game_start_at !== null) {
      updateData.gameStartAt = new Date(dto.game_start_at);
    }
    if (dto.game_end_at !== undefined && dto.game_end_at !== null) {
      updateData.gameEndAt = new Date(dto.game_end_at);
    }
    if (
      dto.recruitment_end_at !== undefined &&
      dto.recruitment_end_at !== null
    ) {
      updateData.recruitmentEndAt = new Date(dto.recruitment_end_at);
    }

    // 6. 시간 유효성 검증 (하나라도 값이 있으면 검사)
    if (
      updateData.gameStartAt !== undefined ||
      updateData.gameEndAt !== undefined ||
      updateData.recruitmentEndAt !== undefined
    ) {
      const gameStartAt =
        updateData.gameStartAt !== undefined
          ? updateData.gameStartAt
          : schedule.gameStartAt;
      const gameEndAt =
        updateData.gameEndAt !== undefined
          ? updateData.gameEndAt
          : schedule.gameEndAt;
      const recruitmentEndAt =
        updateData.recruitmentEndAt !== undefined
          ? updateData.recruitmentEndAt
          : schedule.recruitmentEndAt;

      const timeError = validateScheduleTimes(
        gameStartAt,
        gameEndAt,
        recruitmentEndAt,
      );
      if (timeError) {
        return timeError;
      }
    }

    // 7. 일정 수정
    const updatedSchedule = await this.azitScheduleRepository.updateSchedule(
      scheduleId,
      updateData,
    );

    return ok({
      schedule_id: Number(updatedSchedule.id),
      title: updatedSchedule.title,
      max_participants: updatedSchedule.maxParticipants,
      game_start_at: this.formatDate(updatedSchedule.gameStartAt),
      game_end_at: this.formatDate(updatedSchedule.gameEndAt),
      recruitment_end_at: this.formatDate(updatedSchedule.recruitmentEndAt),
    });
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
