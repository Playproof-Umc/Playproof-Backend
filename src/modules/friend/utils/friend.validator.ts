import { UserErrorCode } from '../../../common/constants/error-code';
import { notFound, ok, Result } from '../../../common/types/result.type';

export function validateUserExists(userId: number): Result<number> {
  if (!userId) {
    return notFound({
      message: '사용자를 찾을 수 없습니다.',
      errorCode: UserErrorCode.NOT_FOUND,
    });
  }
  return ok(userId);
}
