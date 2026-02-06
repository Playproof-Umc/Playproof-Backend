import { singleton } from 'tsyringe';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { prisma } from '../../common/config/database';
import { created, Result } from '../../common/types/result.type';
import { FriendRequestResDto } from './dto/friend.res.dto';

@singleton()
export class FriendRepository {
  async friendRequest(
    userId: number,
    dto: FriendRequestReqDto,
  ): Promise<Result<FriendRequestResDto>> {
    const result = await prisma.friend.create({
      data: {
        fromUserId: BigInt(userId),
        toUserId: BigInt(dto.toUserId),
        friendStatus: 'PENDING',
      },
    });
    return created({
      toUserId: dto.toUserId,
      friendStatus: result.friendStatus,
      friendAt: result.friendAt,
      createdAt: result.createdAt,
    });
  }
}
