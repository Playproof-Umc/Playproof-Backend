import { inject, injectable } from 'tsyringe';
import { FriendRepository } from './friend.repository';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { Result } from '../../common/types/result.type';
import { FriendRequestResDto } from './dto/friend.res.dto';

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
    const result = await this.friendRepository.friendRequest(userId, dto);
    return result;
  }
}
