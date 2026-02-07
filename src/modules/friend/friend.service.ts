import { inject, injectable } from 'tsyringe';
import { FriendRepository } from './friend.repository';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { created, ok, Result } from '../../common/types/result.type';
import {
  FriendAcceptResDto,
  FriendItemResDto,
  FriendListResDto,
  FriendRequestResDto,
} from './dto/friend.res.dto';
import {
  validateIsPendingRequest,
  validateIsReceivedRequest,
  validateRequest,
  validateUserExists,
} from './utils/friend.validator';
import { UserRepository } from '../user/user.repository';

@injectable()
export class FriendService {
  constructor(
    @inject(FriendRepository)
    private readonly friendRepository: FriendRepository,
    @inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async getFriendList(userId: number): Promise<Result<FriendItemResDto[]>> {
    const userCheckResult = await validateUserExists(
      userId,
      this.userRepository,
    );
    if (userCheckResult.error) {
      return userCheckResult;
    }
    // 내가 받은것 중 accept랑 내가 보낸것중 accept 둘다 조회
    const receivedResult = await this.friendRepository.getFriendList(
      userId,
      false,
    );
    const sentResult = await this.friendRepository.getFriendList(userId, true);
    const result = [...receivedResult, ...sentResult];
    return ok(result);
  }

  async friendRequest(
    userId: number,
    dto: FriendRequestReqDto,
  ): Promise<Result<FriendRequestResDto>> {
    // 있는 사람인지 검증 => 없으면 404 반환
    // 이미 친구 추가 눌렀는지 검증 => 이미 추가했으면 400 반환
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

    const result = await this.friendRepository.getFriendList(userId, true);
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

    const result = await this.friendRepository.getFriendList(userId, false);
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

  async deleteFriend(userId: number, friendId: number): Promise<Result<number>> {
    // 본인이 존재하는지 검증
    const userCheckResult = await validateUserExists(userId, this.userRepository);
    if (userCheckResult.error) {
      return userCheckResult;
    }
    // 해당 관계가 존재하는지 검증
    const friendCheckResult = await validateRequest(friendId, this.friendRepository);
    if (friendCheckResult.error) {
      return friendCheckResult;
    }
    const result = await this.friendRepository.deleteFriend(userId, friendId);
    return ok(result);
  }
}
