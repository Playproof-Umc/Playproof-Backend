// src/modules/azit/utils/azit.validator.ts
import { Azit, AzitUser, AzitSchedule } from '@prisma/client';

import { AzitRepository } from '../repositories/azit.repository';
import { AzitScheduleRepository } from '../repositories/azit-schedule.repository';
import { AzitScheduleParticipationRepository } from '../repositories/azit-schedule-participation.repository';
import { AzitUserRepository } from '../repositories/azit-user.repository';
import { AzitErrorCode } from '../../../common/constants/error-code';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  ok,
  Result,
} from '../../../common/types/result.type';

const ERROR_CODE_MAP: Record<string, string> = {
  update: AzitErrorCode.DENIED.UPDATE_DENIED,
  delete: AzitErrorCode.DENIED.DELETE_DENIED,
} as const;

const SCHEDULE_ERROR_CODE_MAP: Record<string, string> = {
  update: AzitErrorCode.DENIED.SCHEDULE_UPDATE_DENIED,
  delete: AzitErrorCode.DENIED.SCHEDULE_DELETE_DENIED,
} as const;

/**
 * 아지트 존재 여부 확인 (private)
 * @returns 성공 시 Result<Azit>, 실패 시 Result<never>
 */
async function checkAzitExists(
  azitRepository: AzitRepository,
  azitId: bigint,
): Promise<Result<Azit>> {
  const azit = await azitRepository.findAzitById(azitId);
  if (!azit) {
    return notFound({
      message: '아지트를 찾을 수 없습니다.',
      errorCode: AzitErrorCode.NOT_FOUND.AZIT_NOT_FOUND,
    });
  }
  return ok(azit);
}

/**
 * 사용자가 해당 아지트에 소속되어 있는지 확인 (private)
 * @returns 성공 시 Result<AzitUser>, 실패 시 Result<never>
 */
async function checkAzitMemberExists(
  azitUserRepository: AzitUserRepository,
  userId: bigint,
  azitId: bigint,
): Promise<Result<AzitUser>> {
  const member = await azitUserRepository.findAzitUserByUserIdAndAzitId(
    userId,
    azitId,
  );
  if (!member) {
    return forbidden({
      message: '아지트 멤버만 접근할 수 있습니다.',
      errorCode: AzitErrorCode.FORBIDDEN.ACCESS_FORBIDDEN,
    });
  }
  return ok(member);
}

/**
 * 일정 존재 여부 확인 (private)
 * @returns 성공 시 Result<AzitSchedule>, 실패 시 Result<never>
 */
async function checkScheduleExists(
  azitScheduleRepository: AzitScheduleRepository,
  scheduleId: bigint,
): Promise<Result<AzitSchedule>> {
  const schedule = await azitScheduleRepository.findScheduleById(scheduleId);
  if (!schedule) {
    return notFound({
      message: '일정을 찾을 수 없습니다.',
      errorCode: AzitErrorCode.NOT_FOUND.SCHEDULE_NOT_FOUND,
    });
  }
  return ok(schedule);
}

/**
 * 사용자가 해당 아지트의 멤버장(HOST)인지 확인 (private)
 */
async function checkHost(
  azitUserRepository: AzitUserRepository,
  memberId: bigint,
  action: string,
): Promise<Result<never> | null> {
  const isHost = await azitUserRepository.isHost(memberId);

  if (!isHost) {
    return forbidden({
      message: `아지트 ${action}은(는) 멤버장만 가능합니다.`,
      errorCode: ERROR_CODE_MAP[action],
    });
  }

  return null;
}

/**
 * 사용자가 일정 생성자(CREATOR)인지 확인 (private)
 */
async function checkScheduleCreator(
  azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  memberId: bigint,
  scheduleId: bigint,
  action: string,
): Promise<Result<never> | null> {
  const isCreator = await azitScheduleParticipationRepository.isScheduleCreator(
    memberId,
    scheduleId,
  );
  if (!isCreator) {
    return forbidden({
      message: '일정 생성자만 접근할 수 있습니다.',
      errorCode:
        SCHEDULE_ERROR_CODE_MAP[action] ||
        AzitErrorCode.DENIED.SCHEDULE_UPDATE_DENIED,
    });
  }

  return null;
}

/**
 * 일정이 해당 아지트의 일정인지 확인 (private)
 */
function checkScheduleInAzit(
  schedule: AzitSchedule,
  azitId: bigint,
): Result<never> | null {
  if (schedule.azitId !== azitId) {
    return forbidden({
      message: '해당 아지트의 일정이 아닙니다.',
      errorCode: AzitErrorCode.FORBIDDEN.SCHEDULE_ACCESS_FORBIDDEN,
    });
  }
  return null;
}

// ----------------------------------------------------------------------------------------------------

/**
 * 사용자가 소속된 아지트 중 같은 이름이 있는지 확인
 * @param azitUserRepository - AzitUserRepository 인스턴스
 * @param userId - 사용자 ID
 * @param azitName - 확인할 아지트 이름
 * @param excludeName - 제외할 아지트 이름 (업데이트 시 현재 이름 제외용)
 * @returns 없으면 null, 있으면 Result<never>
 */
export async function checkAzitNameDuplicate(
  azitUserRepository: AzitUserRepository,
  userId: bigint,
  azitName: string,
  excludeName?: string,
): Promise<Result<never> | null> {
  const existingAzitNames = await azitUserRepository.findAzitNamesByUserId(
    userId,
  );

  const filteredAzitNames = excludeName
    ? existingAzitNames.filter((name) => name !== excludeName)
    : existingAzitNames;

  if (filteredAzitNames.includes(azitName)) {
    return conflict({
      message: '이미 소속된 아지트 중 같은 이름의 아지트가 있습니다.',
      errorCode: AzitErrorCode.CONFLICT.NAME_DUPLICATE,
    });
  }

  return null;
}

/**
 * 아지트 존재 확인 및 멤버 확인
 * @param azitRepository - AzitRepository 인스턴스
 * @param azitUserRepository - AzitUserRepository 인스턴스
 * @param userId - 사용자 ID
 * @param azitId - 아지트 ID
 * @returns 성공 시 Result<AzitUser>, 실패 시 Result<never>
 */
export async function checkAzitAndMember(
  azitRepository: AzitRepository,
  azitUserRepository: AzitUserRepository,
  userId: bigint,
  azitId: bigint,
): Promise<Result<AzitUser>> {
  const azitCheckResult = await checkAzitExists(azitRepository, azitId);
  if (azitCheckResult.error) {
    return azitCheckResult;
  }

  const memberCheckResult = await checkAzitMemberExists(
    azitUserRepository,
    userId,
    azitId,
  );
  if (memberCheckResult.error) {
    return memberCheckResult;
  }

  return memberCheckResult;
}

/**
 * 아지트 존재 확인 및 멤버 존재 확인 및 멤버장 권한 확인
 * @param azitRepository - AzitRepository 인스턴스
 * @param azitUserRepository - AzitUserRepository 인스턴스
 * @param userId - 사용자 ID
 * @param azitId - 아지트 ID
 * @param action - 수행하려는 액션 (update, delete)
 * @returns 성공 시 Result<Azit>, 실패 시 Result<never>
 */
export async function checkAzitAndMemberAndHost(
  azitRepository: AzitRepository,
  azitUserRepository: AzitUserRepository,
  userId: bigint,
  azitId: bigint,
  action: string,
): Promise<Result<Azit>> {
  // 아지트 존재 확인 (결과 재사용을 위해 먼저 호출)
  const azitCheckResult = await checkAzitExists(azitRepository, azitId);
  if (azitCheckResult.error) {
    return azitCheckResult;
  }

  const memberCheckResult = await checkAzitMemberExists(
    azitUserRepository,
    userId,
    azitId,
  );
  if (memberCheckResult.error) {
    return memberCheckResult;
  }

  const hostCheckResult = await checkHost(
    azitUserRepository,
    memberCheckResult.data.id,
    action,
  );
  if (hostCheckResult) {
    return hostCheckResult;
  }

  return azitCheckResult;
}

/**
 * 일정 시간 유효성 검증
 * @param gameStartAt - 게임 시작 시간
 * @param gameEndAt - 게임 종료 시간
 * @param recruitmentEndAt - 모집 마감 시간
 * @returns 성공 시 null, 실패 시 Result<never>
 */
export function validateScheduleTimes(
  gameStartAt: Date,
  gameEndAt: Date,
  recruitmentEndAt: Date,
): Result<never> | null {
  if (gameStartAt >= gameEndAt) {
    return badRequest({
      message: '게임 시작 시간은 종료 시간보다 이전이어야 합니다.',
      errorCode: AzitErrorCode.BAD_REQUEST.SCHEDULE_INVALID_TIME,
    });
  }

  if (recruitmentEndAt >= gameStartAt) {
    return badRequest({
      message: '모집 마감 시간은 게임 시작 시간보다 이전이어야 합니다.',
      errorCode: AzitErrorCode.BAD_REQUEST.SCHEDULE_INVALID_RECRUITMENT_TIME,
    });
  }

  return null;
}

/**
 * 일정 존재 확인 및 해당 아지트 일정 확인
 * @param azitScheduleRepository - AzitScheduleRepository 인스턴스
 * @param scheduleId - 일정 ID
 * @param azitId - 아지트 ID
 * @returns 성공 시 Result<AzitSchedule>, 실패 시 Result<never>
 */
export async function checkScheduleAndInAzit(
  azitScheduleRepository: AzitScheduleRepository,
  scheduleId: bigint,
  azitId: bigint,
): Promise<Result<AzitSchedule>> {
  const scheduleCheckResult = await checkScheduleExists(
    azitScheduleRepository,
    scheduleId,
  );
  if (scheduleCheckResult.error) {
    return scheduleCheckResult;
  }

  const inAzitCheckResult = checkScheduleInAzit(
    scheduleCheckResult.data,
    azitId,
  );
  if (inAzitCheckResult) {
    return inAzitCheckResult;
  }

  return scheduleCheckResult;
}

/**
 * 일정 존재 확인 및 해당 아지트 일정 확인 및 생성자 권한 확인
 * @param azitUserRepository - AzitUserRepository 인스턴스
 * @param azitScheduleRepository - AzitScheduleRepository 인스턴스
 * @param azitScheduleParticipationRepository - AzitScheduleParticipationRepository 인스턴스
 * @param userId - 사용자 ID
 * @param azitId - 아지트 ID
 * @param scheduleId - 일정 ID
 * @param action - 수행하려는 액션 (update, delete)
 * @returns 성공 시 Result<AzitSchedule>, 실패 시 Result<never>
 */
export async function checkScheduleAndInAzitAndCreator(
  azitUserRepository: AzitUserRepository,
  azitScheduleRepository: AzitScheduleRepository,
  azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  userId: bigint,
  azitId: bigint,
  scheduleId: bigint,
  action: string,
): Promise<Result<AzitSchedule>> {
  const scheduleCheckResult = await checkScheduleAndInAzit(
    azitScheduleRepository,
    scheduleId,
    azitId,
  );
  if (scheduleCheckResult.error) {
    return scheduleCheckResult;
  }

  const memberCheckResult = await checkAzitMemberExists(
    azitUserRepository,
    userId,
    azitId,
  );
  if (memberCheckResult.error) {
    return memberCheckResult;
  }

  const creatorCheckResult = await checkScheduleCreator(
    azitScheduleParticipationRepository,
    memberCheckResult.data.id,
    scheduleId,
    action,
  );
  if (creatorCheckResult) {
    return creatorCheckResult;
  }

  return scheduleCheckResult;
}

/**
 * 참여 존재 여부 확인
 * @param memberId - 멤버 ID
 * @param scheduleId - 일정 ID
 * @param azitScheduleParticipationRepository - AzitScheduleParticipationRepository 인스턴스
 * @returns 참여가 있으면 null, 없으면 Result<never>
 */
export async function checkParticipationExists(
  memberId: bigint,
  scheduleId: bigint,
  azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
): Promise<Result<never> | null> {
  const isParticipated =
    await azitScheduleParticipationRepository.existsParticipation(
      memberId,
      scheduleId,
    );
  if (!isParticipated) {
    return notFound({
      message: '참여하지 않은 일정입니다.',
      errorCode: AzitErrorCode.NOT_FOUND.PARTICIPATION_NOT_FOUND,
    });
  }

  return null;
}

/**
 * 일정 참여 가능 여부 검증
 * @param memberId - 멤버 ID
 * @param schedule - 일정 정보
 * @param azitScheduleParticipationRepository - AzitScheduleParticipationRepository 인스턴스
 * @returns 성공 시 null, 실패 시 Result<never>
 */
export async function validateParticipation(
  memberId: bigint,
  schedule: AzitSchedule,
  azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
): Promise<Result<never> | null> {
  // 모집 마감 시간 확인
  const now = new Date();
  if (schedule.recruitmentEndAt < now) {
    return badRequest({
      message: '모집 마감 시간이 지났습니다.',
      errorCode: AzitErrorCode.BAD_REQUEST.PARTICIPATION_RECRUITMENT_ENDED,
    });
  }

  // 최대 인원 확인
  const currentParticipants =
    await azitScheduleParticipationRepository.countParticipations(schedule.id);
  if (currentParticipants >= schedule.maxParticipants) {
    return conflict({
      message: '최대 참여 인원을 초과했습니다.',
      errorCode: AzitErrorCode.CONFLICT.PARTICIPATION_MAX_PARTICIPANTS_EXCEEDED,
    });
  }

  // 이미 참여했는지 확인
  const participationCheckResult = await checkParticipationExists(
    memberId,
    schedule.id,
    azitScheduleParticipationRepository,
  );
  if (participationCheckResult === null) {
    return conflict({
      message: '이미 참여한 일정입니다.',
      errorCode: AzitErrorCode.CONFLICT.PARTICIPATION_ALREADY_PARTICIPATED,
    });
  }

  return null;
}
