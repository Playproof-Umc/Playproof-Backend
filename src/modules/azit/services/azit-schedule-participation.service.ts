// src/modules/azit/services/azit-schedule-participation.service.ts
import { injectable, inject } from 'tsyringe';
import { AzitScheduleRole } from '@prisma/client';
import { AzitScheduleParticipationStatus } from '../types/azit-schedule-participation-status';

import { AzitRepository } from '../repositories/azit.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import {
  checkAzitAndMember,
  checkScheduleAndInAzit,
  checkParticipationExists,
  validateParticipation,
} from '../utils/azit.validator';
import { noContent, Result } from '../../../common/types/result.type';

@injectable()
export class AzitScheduleParticipationService {
  constructor(
    @inject(AzitRepository) private azitRepository: AzitRepository,
    @inject(AzitScheduleRepository)
    private azitScheduleRepository: AzitScheduleRepository,
    @inject(AzitUserRepository) private azitUserRepository: AzitUserRepository,
    @inject(AzitScheduleParticipationRepository)
    private azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  ) {}

  async participateSchedule(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
  ): Promise<Result<null>> {
    // 1. 아지트 존재 확인 및 멤버 확인
    const memberCheckResult = await checkAzitAndMember(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
    );
    if (memberCheckResult.error) {
      return memberCheckResult;
    }

    // 2. 일정 존재 확인 및 해당 아지트의 일정인지 확인
    const scheduleCheckResult = await checkScheduleAndInAzit(
      this.azitScheduleRepository,
      scheduleId,
      azitId,
    );
    if (scheduleCheckResult.error) {
      return scheduleCheckResult;
    }

    const azitUser = memberCheckResult.data;
    const schedule = scheduleCheckResult.data;

    // 3. 참여 가능 여부 검증 (모집 마감 시간, 최대 인원, 중복 참여 확인)
    const validationResult = await validateParticipation(
      azitUser.id,
      schedule,
      this.azitScheduleParticipationRepository,
    );
    if (validationResult) {
      return validationResult;
    }

    // 4. 참여 생성 또는 상태 갱신
    const existingParticipation =
      await this.azitScheduleParticipationRepository.findParticipation(
        azitUser.id,
        scheduleId,
      );

    if (existingParticipation) {
      await this.azitScheduleParticipationRepository.updateParticipationStatus(
        azitUser.id,
        scheduleId,
        AzitScheduleParticipationStatus.JOIN,
      );
    } else {
      await this.azitScheduleParticipationRepository.createParticipation(
        azitUser.id,
        scheduleId,
        AzitScheduleRole.PARTICIPANT,
        AzitScheduleParticipationStatus.JOIN,
      );
    }

    return noContent();
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
    const memberCheckResult = await checkAzitAndMember(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
    );
    if (memberCheckResult.error) {
      return memberCheckResult;
    }

    // 2. 일정 존재 확인 및 해당 아지트의 일정인지 확인
    const scheduleCheckResult = await checkScheduleAndInAzit(
      this.azitScheduleRepository,
      scheduleId,
      azitId,
    );
    if (scheduleCheckResult.error) {
      return scheduleCheckResult;
    }

    const azitUser = memberCheckResult.data;

    // 3. 참여 여부 확인
    const participationCheckResult = await checkParticipationExists(
      azitUser.id,
      scheduleId,
      this.azitScheduleParticipationRepository,
    );
    if (participationCheckResult) {
      return participationCheckResult;
    }

    // 4. 참여 상태 변경 (취소)
    await this.azitScheduleParticipationRepository.updateParticipationStatus(
      azitUser.id,
      scheduleId,
      AzitScheduleParticipationStatus.CANCELLED,
    );

    return noContent();
  }

  /**
   * 아지트 일정 참여 상태를 변경합니다.
   */
  async updateParticipationStatus(
    userId: bigint,
    azitId: bigint,
    scheduleId: bigint,
    status: AzitScheduleParticipationStatus,
  ): Promise<Result<null>> {
    const memberCheckResult = await checkAzitAndMember(
      this.azitRepository,
      this.azitUserRepository,
      userId,
      azitId,
    );
    if (memberCheckResult.error) {
      return memberCheckResult;
    }

    const scheduleCheckResult = await checkScheduleAndInAzit(
      this.azitScheduleRepository,
      scheduleId,
      azitId,
    );
    if (scheduleCheckResult.error) {
      return scheduleCheckResult;
    }

    const azitUser = memberCheckResult.data;
    const schedule = scheduleCheckResult.data;

    if (status === AzitScheduleParticipationStatus.JOIN) {
      const validationResult = await validateParticipation(
        azitUser.id,
        schedule,
        this.azitScheduleParticipationRepository,
      );
      if (validationResult) {
        return validationResult;
      }
    }

    const existingParticipation =
      await this.azitScheduleParticipationRepository.findParticipation(
        azitUser.id,
        scheduleId,
      );

    if (existingParticipation) {
      await this.azitScheduleParticipationRepository.updateParticipationStatus(
        azitUser.id,
        scheduleId,
        status,
      );
    } else {
      await this.azitScheduleParticipationRepository.createParticipation(
        azitUser.id,
        scheduleId,
        AzitScheduleRole.PARTICIPANT,
        status,
      );
    }

    return noContent();
  }
}
