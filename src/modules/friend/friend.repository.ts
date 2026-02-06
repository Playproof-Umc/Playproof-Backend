import { singleton } from 'tsyringe';
import { FriendRequestReqDto } from './dto/friend.req.dto';
import { prisma } from '../../common/config/database';
import { created, Result } from '../../common/types/result.type';
import {
  FriendItemResDto,
  FriendListResDto,
  FriendRequestResDto,
} from './dto/friend.res.dto';

@singleton()
export class FriendRepository {
  async friendRequest(
    userId: number,
    dto: FriendRequestReqDto,
  ): Promise<FriendRequestResDto> {
    const result = await prisma.friend.create({
      data: {
        fromUserId: BigInt(userId),
        toUserId: BigInt(dto.toUserId),
        friendStatus: 'PENDING',
      },
    });
    return {
      toUserId: dto.toUserId,
      friendStatus: result.friendStatus,
      friendAt: result.friendAt,
      createdAt: result.createdAt,
    };
  }

  // 내가 신청했던 것을 조회하거나, 내가 받은 것을 조회
  async getFriendList(
    userId: number,
    isSent: boolean,
  ): Promise<FriendItemResDto[]> {
    const results = await prisma.friend.findMany({
      where: isSent
        ? { fromUserId: BigInt(userId) }
        : { toUserId: BigInt(userId) },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            trustScore: true,
          },
          include: {
            userAvatars: {
              where: {
                isEquipped: true,
              },
              select: {
                avatar: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        friendAt: 'desc',
      },
    });

    return results.map((result) => ({
      userId: Number(result.fromUser.id),
      nickname: result.fromUser.nickname,
      avatarUrl: result.fromUser.userAvatars[0].avatar.avatarUrl,
      statusMessage: null,
      trustScore: result.fromUser.trustScore,
      friendAt: result.friendAt,
    }));
  }
}
