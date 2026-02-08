import { UserRepository } from '../../user/user.repository';
import {
  FriendErrorCode,
  UserErrorCode,
} from '../../../common/constants/error-code';
import { conflict, notFound, ok, Result } from '../../../common/types/result.type';
import { Friend, User } from '@prisma/client/default';
import { FriendRepository } from '../repositories/friend.repository';

export async function validateUserExists(
  userId: number,
  userRepository: UserRepository,
): Promise<Result<User | null>> {
  const user = await userRepository.findById(userId);
  if (!user) {
    return notFound({
      message: '사용자를 찾을 수 없습니다.',
      errorCode: UserErrorCode.NOT_FOUND,
    });
  }
  return ok(user);
}

// userId가 있는지 검증
export function validateRequestIdExists(requestId: number): Result<number> {
  if (!requestId) {
    return notFound({
      message: '요청을 찾을 수 없습니다.',
      errorCode: FriendErrorCode.NOT_FOUND,
    });
  }
  return ok(requestId);
}

// requestId에 해당하는 request가 있는지 검증
export async function validateRequest(
  requestId: number,
  friendRepository: FriendRepository,
): Promise<Result<Friend>> {
  const request = await friendRepository.findById(requestId);
  if (!request) {
    return notFound({
      message: '요청을 찾을 수 없습니다.',
      errorCode: FriendErrorCode.NOT_FOUND,
    });
  }
  return ok(request);
}

// request의 toUserId가 userId와 같은지 검증
export async function validateIsReceivedRequest(
  request: Friend,
  userId: number,
): Promise<Result<Friend>> {
  if (Number(request.toUserId) !== userId) {
    return notFound({
      message: '받은 요청이 아닙니다.',
      errorCode: FriendErrorCode.NOT_FOUND,
    });
  }
  return ok(request);
}

// requestId의 friendStatus가 PENDING인지 검증 - ACCEPTED된 요청이라면 중복 수락 방지
export async function validateIsPendingRequest(
  request: Friend,
): Promise<Result<Friend>> {
  if (request.friendStatus !== 'PENDING') {
    return notFound({
      message: 'PENDING 상태가 아닙니다.',
      errorCode: FriendErrorCode.NOT_FOUND,
    });
  }
  return ok(request);
}

export async function validateNoExistingFriendRequest(
  userId: number,
  targetUserId: number,
  friendRepository: FriendRepository,
): Promise<Result<null>> {
  const existing = await friendRepository.findExistingRelation(
    userId,
    targetUserId,
  );

  if (!existing) {
    return ok(null);
  }

  if (existing.friendStatus === 'ACCEPTED') {
    return conflict({
      message: '이미 친구입니다.',
      errorCode: FriendErrorCode.ALREADY_FRIEND,
    });
  }

  const isSender = Number(existing.fromUserId) === userId;
  if (isSender) {
    return conflict({
      message: '이미 친구 요청을 보냈습니다.',
      errorCode: FriendErrorCode.ALREADY_REQUESTED,
    });
  }

  return conflict({
    message: '이미 받은 친구 요청이 있습니다.',
    errorCode: FriendErrorCode.ALREADY_RECEIVED,
  });
}

// 차단 상태인 경우 수락 금지 (아직 구현 X)
