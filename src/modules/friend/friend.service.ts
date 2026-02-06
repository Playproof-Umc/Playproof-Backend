import { inject, injectable } from 'tsyringe';
import { FriendRepository } from './friend.repository';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { created, ok, Result } from '../../common/types/result.type';
import { FriendListResDto, FriendRequestResDto } from './dto/friend.res.dto';
import { validateUserExists } from './utils/friend.validator';

@injectable()
export class FriendService {
  constructor(
    @inject(FriendRepository)
    private readonly friendRepository: FriendRepository,
  ) {}

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
    const userCheckResult = validateUserExists(userId);
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
    const userCheckResult = validateUserExists(userId);
    if (userCheckResult.error) {
      return userCheckResult;
    }

    const result = await this.friendRepository.getFriendList(userId, false);
    return ok({
      friends: result,
    });
  }
}
