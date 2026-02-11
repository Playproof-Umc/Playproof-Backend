import { inject, injectable } from 'tsyringe';
import {
  FriendRepository,
  FriendWithUsers,
} from '../repositories/friend.repository';
import { FriendRequestReqDto } from '../dto/friend.req.dto';
import { created, ok, Result } from '../../../common/types/result.type';
import {
  FriendAcceptResDto,
  FriendItemResDto,
  FriendListResDto,
  FriendRequestResDto,
} from '../dto/friend.res.dto';
import {
  validateIsPendingRequest,
  validateIsReceivedRequest,
  validateNoExistingFriendRequest,
  validateRequest,
  validateUserExists,
} from '../utils/friend.validator';
import { UserRepository } from '../../user/user.repository';

@injectable()
export class FriendService {
  constructor(
    @inject(FriendRepository)
    private readonly friendRepository: FriendRepository,
    @inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  private mapFriendToItem(
    userId: number,
    friend: FriendWithUsers,
  ): FriendItemResDto {
    const isSender = Number(friend.fromUserId) === userId;
    const targetUser = isSender ? friend.toUser : friend.fromUser;
    const targetUserId = isSender ? friend.toUserId : friend.fromUserId;

    return {
      requestId: Number(friend.id),
      userId: Number(targetUserId),
      nickname: targetUser?.nickname ?? null,
      avatarUrl: targetUser?.userAvatars[0]?.avatar.avatarUrl ?? null,
      statusMessage: null,
      trustScore: targetUser?.trustScore,
      friendAt: friend.friendAt ?? null,
    };
  }

  async getFriendList(userId: number): Promise<Result<FriendItemResDto[]>> {
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }
    // 내가 보낸 것과 받은 것 중 accepted 모두 조회 후 서비스에서 분리
    const friends = await this.friendRepository.getFriendList(userId);
    return ok(friends.map((friend) => this.mapFriendToItem(userId, friend)));
  }

  async friendRequest(
    userId: number,
    dto: FriendRequestReqDto,
  ): Promise<Result<FriendRequestResDto>> {
    // 있는 사람인지 검증 => 없으면 404 반환
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }
    const toUserCheckResult = await validateUserExists(
      dto.toUserId,
      this.userRepository,
    );
    if (toUserCheckResult.error) {
      return toUserCheckResult;
    }
    const duplicateCheckResult = await validateNoExistingFriendRequest(
      userId,
      dto.toUserId,
      this.friendRepository,
    );
    if (duplicateCheckResult.error) {
      return duplicateCheckResult;
    }

    // 이미 요청/친구 관계인지 검증 => 중복이면 409 반환
    const result = await this.friendRepository.friendRequest(userId, dto);
    return created({
      toUserId: dto.toUserId,
      friendStatus: result.friendStatus,
      friendAt: result.friendAt,
      createdAt: result.createdAt,
    });
  }

  async getSentFriendList(userId: number): Promise<Result<FriendListResDto>> {
    // 있는 사람인지 검증 => 없으면 404 반환
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }

    const friends = await this.friendRepository.getSentRequestList(userId);
    const result = friends
      .filter((friend) => Number(friend.fromUserId) === userId)
      .map((friend) => this.mapFriendToItem(userId, friend));
    return ok({
      friends: result,
    });
  }

  async getReceivedFriendList(
    userId: number,
  ): Promise<Result<FriendListResDto>> {
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }

    const friends = await this.friendRepository.getReceivedRequestList(userId);
    const result = friends
      .filter((friend) => Number(friend.toUserId) === userId)
      .map((friend) => this.mapFriendToItem(userId, friend));
    return ok({
      friends: result,
    });
  }

  async acceptFriendRequest(
    userId: number,
    requestId: number,
  ): Promise<Result<FriendAcceptResDto>> {
    // userId가 있는지 검증
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }
    // requestId가 있는지 검증
    const requestCheckResult = await validateRequest(
      requestId,
      this.friendRepository,
    );
    if (requestCheckResult.error) {
      return requestCheckResult;
    }
    // requestId의 toUserId가 userId와 같은지 검증
    const isReceivedRequestResult = await validateIsReceivedRequest(
      requestCheckResult.data,
      userId,
    );
    if (isReceivedRequestResult.error) {
      return isReceivedRequestResult;
    }
    // requestId의 friendStatus가 PENDING인지 검증 - ACCEPTED된 요청이라면 중복 수락 방지
    const isPendingRequestResult = await validateIsPendingRequest(
      requestCheckResult.data,
    );
    if (isPendingRequestResult.error) {
      return isPendingRequestResult;
    }
    // 차단 상태인 경우 수락 금지 (차단 도메인 구현 이후 구현)

    const result = await this.friendRepository.acceptFriendRequest(
      userId,
      requestId,
    );
    return ok({
      requestId: result.requestId,
    });
  }

  async deleteFriend(
    userId: number,
    friendId: number,
  ): Promise<Result<number>> {
    // 본인이 존재하는지 검증
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }
    // 해당 관계가 존재하는지 검증
    const friendCheckResult = await validateRequest(
      friendId,
      this.friendRepository,
    );
    if (friendCheckResult.error) {
      return friendCheckResult;
    }
    const result = await this.friendRepository.deleteFriend(userId, friendId);
    return ok(result);
  }

  async searchFriendByNickname(
    userId: number,
    nickname: string,
  ): Promise<Result<FriendItemResDto[]>> {
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }
    // 닉네임으로 friend 리스트에서 검색
    const friendListResult = await this.friendRepository.searchFriendByNickname(
      userId,
      nickname,
    );

    return ok(friendListResult);
  }
}
