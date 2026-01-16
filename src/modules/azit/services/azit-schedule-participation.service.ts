// src/modules/azit/services/azit-schedule-participation.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitScheduleRole } from '@prisma/client';

import { AzitScheduleParticipationResDto } from '../dtos/azit-schedule-participation.res.dto';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import {
  badRequest,
  conflict,
  created,
  forbidden,
  noContent,
  notFound,
  Result,
} from '../../../common/types/result.type';

@injectable()
export class AzitScheduleParticipationService {
  constructor(
    @inject(AzitScheduleRepository)
    private azitScheduleRepository: AzitScheduleRepository,
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    @inject(AzitScheduleParticipationRepository)
    private azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  ) {}

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

  /**
   * 일정 존재 여부와 해당 아지트의 일정인지 확인합니다.
   * @param scheduleId - 확인할 일정 ID
   * @param azitId - 확인할 아지트 ID
   * @returns 일정이 없거나 해당 아지트의 일정이 아니면 Result<never>, 모두 통과하면 null
   */
  private async validateScheduleExistsAndBelongsToAzit(
    scheduleId: bigint,
    azitId: bigint,
  ): Promise<Result<never> | null> {
    // 1. 일정 존재 확인
    const schedule = await this.azitScheduleRepository.findScheduleById(
      scheduleId,
    );
    if (!schedule) {
      return notFound({
        message: '일정을 찾을 수 없습니다.',
        errorCode: 'SCHEDULE_NOT_FOUND',
      });
    }

    // 2. 일정이 해당 아지트의 일정인지 확인
    if (schedule.azitId !== azitId) {
      return forbidden({
        message: '해당 아지트의 일정이 아닙니다.',
        errorCode: 'SCHEDULE_ACCESS_FORBIDDEN',
      });
    }

    return null;
  }

  // ----------------------------------------------------------------------------------------------------

  async participateSchedule(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
  ): Promise<Result<AzitScheduleParticipationResDto>> {
    // 1. 아지트 존재 확인 및 멤버 확인
    const azitError = await this.validateAzitExistsAndMember(userId, azitId);
    if (azitError) {
      return azitError;
    }

    // 2. 일정 존재 확인 및 해당 아지트의 일정인지 확인
    const scheduleError = await this.validateScheduleExistsAndBelongsToAzit(
      scheduleId,
      azitId,
    );
    if (scheduleError) {
      return scheduleError;
    }

    // 3. 일정 상세 정보 조회 (검증용)
    const schedule = await this.azitScheduleRepository.findScheduleById(
      scheduleId,
    );

    // 4. 모집 마감 시간 확인
    const now = new Date();
    if (schedule.recruitmentEndAt < now) {
      return badRequest({
        message: '모집 마감 시간이 지났습니다.',
        errorCode: 'RECRUITMENT_ENDED',
      });
    }

    // 5. 최대 인원 확인
    const currentParticipants =
      await this.azitScheduleParticipationRepository.countParticipations(
        scheduleId,
      );
    if (currentParticipants >= schedule.maxParticipants) {
      return conflict({
        message: '최대 참여 인원을 초과했습니다.',
        errorCode: 'MAX_PARTICIPANTS_EXCEEDED',
      });
    }

    // 6. 사용자의 AzitUser ID 조회
    const azitUser =
      await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
        userId,
        azitId,
      );
    if (!azitUser) {
      return forbidden({
        message: '아지트 멤버 정보를 찾을 수 없습니다.',
        errorCode: 'AZIT_USER_NOT_FOUND',
      });
    }

    // 7. 이미 참여했는지 확인
    const existingParticipation =
      await this.azitScheduleParticipationRepository.findParticipation(
        azitUser.id,
        scheduleId,
      );
    if (existingParticipation) {
      return conflict({
        message: '이미 참여한 일정입니다.',
        errorCode: 'ALREADY_PARTICIPATED',
      });
    }

    // 8. 참여 생성
    const participation =
      await this.azitScheduleParticipationRepository.createParticipation(
        azitUser.id,
        scheduleId,
        AzitScheduleRole.PARTICIPANT,
      );

    return created({
      success: true,
    });
  }

  /**
   * 아지트 일정 참여를 취소합니다.
   * @param userId - 참여 취소할 사용자 ID
   * @param azitId - 아지트 ID
   * @param scheduleId - 일정 ID
   * @returns 참여 취소 결과
   */
  async cancelParticipation(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
  ): Promise<Result<null>> {
    // 1. 아지트 존재 확인 및 멤버 확인
    const azitError = await this.validateAzitExistsAndMember(userId, azitId);
    if (azitError) {
      return azitError;
    }

    // 2. 일정 존재 확인 및 해당 아지트의 일정인지 확인
    const scheduleError = await this.validateScheduleExistsAndBelongsToAzit(
      scheduleId,
      azitId,
    );
    if (scheduleError) {
      return scheduleError;
    }

    // 3. 사용자의 AzitUser ID 조회
    const azitUser =
      await this.azitUserRepository.findAzitUserByUserIdAndAzitId(
        userId,
        azitId,
      );
    if (!azitUser) {
      return forbidden({
        message: '아지트 멤버 정보를 찾을 수 없습니다.',
        errorCode: 'AZIT_USER_NOT_FOUND',
      });
    }

    // 4. 참여 여부 확인
    const participation =
      await this.azitScheduleParticipationRepository.findParticipation(
        azitUser.id,
        scheduleId,
      );
    if (!participation) {
      return notFound({
        message: '참여하지 않은 일정입니다.',
        errorCode: 'PARTICIPATION_NOT_FOUND',
      });
    }

    // 5. 참여 취소 (삭제)
    await this.azitScheduleParticipationRepository.deleteParticipation(
      azitUser.id,
      scheduleId,
    );

    return noContent();
  }
}
