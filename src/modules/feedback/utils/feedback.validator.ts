// src/modules/feedback/utils/feedback.validator.ts
import { User, AzitSchedule } from '@prisma/client';

import { AzitScheduleParticipationRepository } from '../../azit/repositories/azit-schedule-participation.repository';
import { AzitScheduleRepository } from '../../azit/repositories/azit-schedule.repository';
import { UserRepository } from '../../user/user.repository';
import { FeedbackRepository } from '../repositories/feedback.repository';
import { FeedbackErrorCode } from '../../../common/constants/error-code';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  ok,
  Result,
} from '../../../common/types/result.type';

/**
 * 자기 자신에게 피드백을 주는지 확인 (private)
 * @returns 자기 자신이면 Result<never>, 아니면 null
 */
function checkSelfFeedback(
  userId: bigint,
  targetId: bigint,
): Result<never> | null {
  if (userId === targetId) {
    return badRequest({
      message: '자기 자신에게 피드백을 줄 수 없습니다.',
      errorCode: FeedbackErrorCode.BAD_REQUEST.SELF_FEEDBACK_NOT_ALLOWED,
    });
  }
  return null;
}

/**
 * 유효한 작성자 사용자인지 확인 (private)
 * @returns 성공 시 Result<User>, 실패 시 Result<never>
 */
async function checkUserExists(
  userRepository: UserRepository,
  userId: bigint,
): Promise<Result<User>> {
  const user = await userRepository.findById(Number(userId));
  if (!user) {
    return notFound({
      message: '피드백 작성자를 찾을 수 없습니다.',
      errorCode: FeedbackErrorCode.NOT_FOUND.WRITER_USER_NOT_FOUND,
    });
  }
  return ok(user);
}

/**
 * 유효한 대상 사용자인지 확인 (private)
 * @returns 성공 시 Result<User>, 실패 시 Result<never>
 */
async function checkTargetUserExists(
  userRepository: UserRepository,
  targetId: bigint,
): Promise<Result<User>> {
  const user = await userRepository.findById(Number(targetId));
  if (!user) {
    return notFound({
      message: '피드백 대상 사용자를 찾을 수 없습니다.',
      errorCode: FeedbackErrorCode.NOT_FOUND.TARGET_USER_NOT_FOUND,
    });
  }
  return ok(user);
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
      errorCode: FeedbackErrorCode.NOT_FOUND.SCHEDULE_NOT_FOUND,
    });
  }
  return ok(schedule);
}

/**
 * 일정이 종료되었는지 확인 (private)
 * 현재 시간이 gameEndAt보다 크면 일정이 끝난 것으로 간주
 * @returns 일정이 끝나지 않았으면 Result<never>, 끝났으면 null
 */
function checkScheduleCompleted(schedule: AzitSchedule): Result<never> | null {
  const now = new Date();
  if (schedule.gameEndAt > now) {
    return badRequest({
      message: '아직 종료되지 않은 일정입니다.',
      errorCode: FeedbackErrorCode.BAD_REQUEST.SCHEDULE_NOT_COMPLETED,
    });
  }
  return null;
}

/**
 * 두 사용자가 같은 일정에 참여했는지 확인 (private)
 * @returns 둘 다 참여했으면 null, 아니면 Result<never>
 */
async function checkBothUsersParticipated(
  azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  scheduleId: bigint,
  userId: bigint,
  targetId: bigint,
): Promise<Result<never> | null> {
  // 두 사용자가 모두 해당 일정에 참여했는지 확인
  const [userParticipated, targetParticipated] = await Promise.all([
    azitScheduleParticipationRepository.existsParticipationByUserId(
      userId,
      scheduleId,
    ),
    azitScheduleParticipationRepository.existsParticipationByUserId(
      targetId,
      scheduleId,
    ),
  ]);

  if (!userParticipated || !targetParticipated) {
    return forbidden({
      message: '같은 일정에 참여한 사용자에게만 피드백을 줄 수 있습니다.',
      errorCode: FeedbackErrorCode.FORBIDDEN.NOT_PARTICIPATED_TOGETHER,
    });
  }

  return null;
}

/**
 * 중복 피드백 확인 (private)
 * 같은 userId, targetId, scheduleId로 이미 피드백이 있는지 확인
 * @returns 중복이면 Result<never>, 아니면 null
 */
async function checkDuplicateFeedback(
  feedbackRepository: FeedbackRepository,
  userId: bigint,
  targetId: bigint,
  scheduleId: bigint,
): Promise<Result<never> | null> {
  const existingFeedback =
    await feedbackRepository.existsFeedbackByUserIdAndTargetIdAndScheduleId(
      userId,
      targetId,
      scheduleId,
    );
  if (existingFeedback) {
    return conflict({
      message: '이미 해당 일정에 대한 피드백을 작성했습니다.',
      errorCode: FeedbackErrorCode.CONFLICT.FEEDBACK_ALREADY_EXISTS,
    });
  }
  return null;
}

// ----------------------------------------------------------------------------------------------------

/**
 * 피드백 생성 가능 여부 검증
 * @param userRepository - UserRepository 인스턴스
 * @param azitScheduleRepository - AzitScheduleRepository 인스턴스
 * @param azitScheduleParticipationRepository - AzitScheduleParticipationRepository 인스턴스
 * @param feedbackRepository - FeedbackRepository 인스턴스
 * @param userId - 피드백 작성자 ID
 * @param targetId - 피드백 대상 ID
 * @param scheduleId - 일정 ID
 * @returns 성공 시 Result<AzitSchedule>, 실패 시 Result<never>
 */
export async function validateFeedbackCreation(
  userRepository: UserRepository,
  azitScheduleRepository: AzitScheduleRepository,
  azitScheduleParticipationRepository: AzitScheduleParticipationRepository,
  feedbackRepository: FeedbackRepository,
  userId: bigint,
  targetId: bigint,
  scheduleId: bigint,
): Promise<Result<AzitSchedule>> {
  // 1. 자기 자신에게 피드백을 주는지 확인
  const selfCheckResult = checkSelfFeedback(userId, targetId);
  if (selfCheckResult) {
    return selfCheckResult;
  }

  // 2. 유효한 작성자 사용자인지 확인
  const userCheckResult = await checkUserExists(userRepository, userId);
  if (userCheckResult.error) {
    return userCheckResult;
  }

  // 3. 유효한 대상 사용자인지 확인
  const targetCheckResult = await checkTargetUserExists(
    userRepository,
    targetId,
  );
  if (targetCheckResult.error) {
    return targetCheckResult;
  }

  // 4. 일정 존재 확인
  const scheduleCheckResult = await checkScheduleExists(
    azitScheduleRepository,
    scheduleId,
  );
  if (scheduleCheckResult.error) {
    return scheduleCheckResult;
  }

  const schedule = scheduleCheckResult.data;

  // 5. 두 사용자가 같은 일정에 참여했는지 확인
  const participationCheckResult = await checkBothUsersParticipated(
    azitScheduleParticipationRepository,
    scheduleId,
    userId,
    targetId,
  );
  if (participationCheckResult) {
    return participationCheckResult;
  }
  
  // 6. 일정이 종료되었는지 확인
  const completedCheckResult = checkScheduleCompleted(schedule);
  if (completedCheckResult) {
    return completedCheckResult;
  }

  // 7. 중복 피드백 확인
  const duplicateCheckResult = await checkDuplicateFeedback(
    feedbackRepository,
    userId,
    targetId,
    scheduleId,
  );
  if (duplicateCheckResult) {
    return duplicateCheckResult;
  }

  return scheduleCheckResult;
}
