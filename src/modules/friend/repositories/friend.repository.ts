import { singleton } from 'tsyringe';
import { FriendRequestReqDto } from '../dto/friend.req.dto';
import { prisma } from '../../../common/config/database';
import { created, Result } from '../../../common/types/result.type';
import {
  FriendAcceptResDto,
  FriendItemResDto,
  FriendListResDto,
  FriendRequestResDto,
} from '../dto/friend.res.dto';
import { Friend, Prisma } from '@prisma/client/default';

@singleton()
export class FriendRepository {
  async findById(id: number): Promise<Friend | null> {
    return await prisma.friend.findUnique({
      where: { id: BigInt(id) },
    });
  }
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

  // 내가 신청했던 것과 내가 받은 것 중 accepted인 것을 모두 조회
  async getFriendList(userId: number): Promise<FriendWithUsers[]> {
    return await prisma.friend.findMany({
      where: {
        friendStatus: 'ACCEPTED',
        OR: [{ fromUserId: BigInt(userId) }, { toUserId: BigInt(userId) }],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            trustScore: true,
          },
          include: {
            userAvatars: {
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
        toUser: {
          select: {
            id: true,
            nickname: true,
            trustScore: true,
          },
          include: {
            userAvatars: {
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
    });
  }

  async acceptFriendRequest(
    userId: number,
    requestId: number,
  ): Promise<FriendAcceptResDto> {
    const result = await prisma.friend.update({
      where: { id: requestId },
      data: { friendStatus: 'ACCEPTED' },
    });
    return {
      requestId: Number(result.id),
    };
  }

  async deleteFriend(userId: number, friendId: number): Promise<number> {
    const result = await prisma.friend.delete({
      where: { id: BigInt(friendId) },
    });
    return Number(result.id);
  }

  async searchFriendByNickname(
    userId: number,
    nickname: string,
  ): Promise<FriendItemResDto[]> {
    const result = await prisma.friend.findMany({
      where: {
        friendStatus: 'ACCEPTED',
        AND: [
          {
            OR: [{ fromUserId: BigInt(userId) }, { toUserId: BigInt(userId) }],
          },
          {
            OR: [
              { fromUser: { nickname: { contains: nickname } } },
              { toUser: { nickname: { contains: nickname } } },
            ],
          },
        ],
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            trustScore: true,
          },
          include: {
            userAvatars: {
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
        toUser: {
          select: {
            id: true,
            nickname: true,
            trustScore: true,
          },
          include: {
            userAvatars: {
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
    });
    return result.map((result) => ({
      userId:
        Number(result.fromUserId) === userId
          ? Number(result.toUserId)
          : Number(result.fromUserId),
      nickname:
        Number(result.fromUserId) === userId
          ? result.toUser?.nickname
          : result.fromUser?.nickname,
      avatarUrl:
        Number(result.fromUserId) === userId
          ? (result.toUser?.userAvatars[0]?.avatar.avatarUrl ?? null)
          : (result.fromUser?.userAvatars[0]?.avatar.avatarUrl ?? null),
      statusMessage: null,
      trustScore:
        Number(result.fromUserId) === userId
          ? result.toUser?.trustScore
          : result.fromUser?.trustScore,
      friendAt: result.friendAt ?? null,
    }));
  }
}

export type FriendWithUsers = Prisma.FriendGetPayload<{
  include: {
    fromUser: {
      select: {
        id: true;
        nickname: true;
        trustScore: true;
      };
      include: {
        userAvatars: {
          select: {
            avatar: {
              select: {
                avatarUrl: true;
              };
            };
          };
        };
      };
    };
    toUser: {
      select: {
        id: true;
        nickname: true;
        trustScore: true;
      };
      include: {
        userAvatars: {
          select: {
            avatar: {
              select: {
                avatarUrl: true;
              };
            };
          };
        };
      };
    };
  };
}>;
