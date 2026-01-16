// src/modules/azit/utils/azit.validator.ts
import { AzitUserRepository } from '../repositories/azit-user.repository';
import { AzitRepository } from '../repositories/azit.repository';
import { AzitUserRole, Azit } from '@prisma/client';
import {
  Result,
  conflict,
  forbidden,
  notFound,
  ok,
} from '../../../common/types/result.type';
import { AzitErrorCode } from '../../../common/constants/error-code';

const ERROR_CODE_MAP: Record<string, string> = {
  update: AzitErrorCode.DENIED.UPDATE_DENIED,
  delete: AzitErrorCode.DENIED.DELETE_DENIED,
} as const;

/**
 * 아지트 존재 여부 확인 (private)
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
 * 사용자가 해당 아지트의 멤버장(HOST)인지 확인 (private)
 */
async function checkHost(
  azitUserRepository: AzitUserRepository,
  userId: bigint,
  azitId: bigint,
  action: string,
): Promise<Result<never> | null> {
  const userRole = await azitUserRepository.findAzitUserRoleByUserIdAndAzitId(
    userId,
    azitId,
  );

  if (userRole !== AzitUserRole.HOST) {
    return forbidden({
      message: `아지트 ${action}은(는) 멤버장만 가능합니다.`,
      errorCode: ERROR_CODE_MAP[action],
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
 * @returns 중복이면 conflict Result, 없으면 null
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
 * 아지트 존재 확인 및 멤버장 권한 확인
 * @param azitRepository - AzitRepository 인스턴스
 * @param azitUserRepository - AzitUserRepository 인스턴스
 * @param userId - 사용자 ID
 * @param azitId - 아지트 ID
 * @param action - 수행하려는 액션 (update, delete)
 * @returns 성공 시 Result<Azit>, 실패 시 Result<never>
 */
export async function checkAzitExistsAndHost(
  azitRepository: AzitRepository,
  azitUserRepository: AzitUserRepository,
  userId: bigint,
  azitId: bigint,
  action: string,
): Promise<Result<Azit>> {
  const azitCheckResult = await checkAzitExists(azitRepository, azitId);
  if (azitCheckResult.error) {
    return azitCheckResult;
  }

  const hostCheckResult = await checkHost(
    azitUserRepository,
    userId,
    azitId,
    action,
  );
  if (hostCheckResult) {
    return hostCheckResult;
  }

  return azitCheckResult;
}
