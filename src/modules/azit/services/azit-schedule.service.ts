// src/modules/azit/services/azit-schedule.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitScheduleCreateReqDto } from '../dtos/azit-schedule.req.dto';
import {
  AzitScheduleCreateResDto,
  AzitScheduleListResDto,
  AzitScheduleItemResDto,
  AzitScheduleParticipantResDto,
} from '../dtos/azit-schedule.res.dto';
import {
  Result,
  created,
  ok,
  notFound,
  forbidden,
  internalServerError,
} from '../../../common/types/result.type';
import { AzitScheduleRole } from '@prisma/client';

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

  /**
   * 아지트 존재 여부와 사용자의 멤버 여부를 확인합니다.
   * @param userId - 확인할 사용자 ID
   * @param azitId - 확인할 아지트 ID
   * @returns 아지트가 없거나 멤버가 아니면 Result<never>, 모두 통과하면 null
   */
  private async validateAzitExistsAndMember(
    userId: bigint,
    azitId: bigint,
  ): Promise<Result<never> | null> {
    // 1. 아지트 존재 확인
    const azit = await this.azitRepository.findAzitById(azitId);
    if (!azit) {
      return notFound({
        message: '아지트를 찾을 수 없습니다.',
        errorCode: 'AZIT_NOT_FOUND',
      });
    }

    // 2. 사용자가 해당 아지트의 멤버인지 확인
    const isMember =
      await this.azitUserRepository.existsAzitUserByUserIdAndAzitId(
        userId,
        azitId,
      );
    if (!isMember) {
      return forbidden({
        message: '아지트 멤버만 접근할 수 있습니다.',
        errorCode: 'AZIT_ACCESS_FORBIDDEN',
      });
    }

    return null;
  }

  // ----------------------------------------------------------------------------------------------------

  async createSchedule(
    userId: bigint,
    azitId: bigint,
    dto: AzitScheduleCreateReqDto,
  ): Promise<Result<AzitScheduleCreateResDto>> {
    // 1. 아지트 존재 확인 및 멤버 확인
    const error = await this.validateAzitExistsAndMember(userId, azitId);
    if (error) {
      return error;
    }

    // 2. 시간 유효성 검증
    const gameStartAt = new Date(dto.game_start_at);
    const gameEndAt = new Date(dto.game_end_at);
    const recruitmentEndAt = new Date(dto.recruitment_end_at);

    if (gameStartAt >= gameEndAt) {
      return internalServerError({
        message: '게임 시작 시간은 종료 시간보다 이전이어야 합니다.',
        errorCode: 'INVALID_SCHEDULE_TIME',
      });
    }

    if (recruitmentEndAt >= gameStartAt) {
      return internalServerError({
        message: '모집 마감 시간은 게임 시작 시간보다 이전이어야 합니다.',
        errorCode: 'INVALID_RECRUITMENT_TIME',
      });
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
    const azitUser =
      (await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
        userId,
        azitId,
      ))!;

    await this.azitScheduleParticipationRepository.createParticipation(
      azitUser.id,
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
    // 1. 아지트 존재 확인 및 멤버 확인
    const error = await this.validateAzitExistsAndMember(userId, azitId);
    if (error) {
      return error;
    }

    // 2. 일정 목록 조회
    const { schedules, hasNext } =
      await this.azitScheduleRepository.findSchedulesByAzitId(
        azitId,
        cursor,
        size,
      );

    // 3. 사용자의 AzitUser ID 조회 (참여 여부 확인용)
    const azitUser =
      await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
        userId,
        azitId,
      );
    const azitUserId = azitUser!.id;

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
}
