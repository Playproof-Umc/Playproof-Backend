// src/modules/ban/repositories/ban.repository.ts

import { singleton } from 'tsyringe';
import { prisma } from '../../../common/config/database';
import { CreateBanReqDto } from '../dtos/ban.req.dto';
import { Prisma } from '@prisma/client/default';

@singleton()
export class BanRepository {
  async createBan(createBanDto: CreateBanReqDto, tx?: any) {
    const client = tx || prisma;
    const result = await client.ban.create({
      data: {
        userId: BigInt(createBanDto.userId),
        targetId: BigInt(createBanDto.targetId),
      },
    });
    return {
      id: Number(result.id),
      userId: Number(result.userId),
      targetId: Number(result.targetId),
      banAt: result.banAt,
    };
  }

  async existsByUserIdAndTargetId(
    userId: bigint,
    targetId: bigint,
  ): Promise<boolean> {
    const ban = await prisma.ban.findFirst({
      where: { userId, targetId },
    });
    return ban != null;
  }

  async getBanList(userId: number): Promise<BanWithTarget[]> {
    return await prisma.ban.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { banAt: 'desc' },
      select: {
        id: true,
        userId: true,
        targetId: true,
        banAt: true,
        target: {
          select: {
            id: true,
            nickname: true,
            statusMessage: true,
            userAvatars: {
              where: { isEquipped: true },
              select: {
                avatar: {
                  select: { avatarUrl: true },
                },
              },
              take: 1,
            },
          },
        },
      },
    });
  }

  async deleteBan(userId: number, targetId: number): Promise<void> {
    await prisma.ban.deleteMany({
      where: {
        userId: BigInt(userId),
        targetId: BigInt(targetId),
      },
    });
  }

  async searchBanByNickname(
    userId: number,
    nickname: string,
  ): Promise<BanWithTarget[]> {
    return await prisma.ban.findMany({
      where: {
        userId: BigInt(userId),
        target: { 
          nickname: { contains: nickname },
        },
      },
      orderBy: { banAt: 'desc' },
      select: {
        id: true,
        userId: true,
        targetId: true,
        banAt: true,
        target: {
          select: {
            id: true,
            nickname: true,
            statusMessage: true,
            userAvatars: {
              where: { isEquipped: true },
              select: {
                avatar: {
                  select: { avatarUrl: true },
                },
              },
              take: 1,
            },
          },
        },
      },
    });
  }
}

export type BanWithTarget = Prisma.BanGetPayload<{
  select: {
    id: true;
    userId: true;
    targetId: true;
    banAt: true;
    target: {
      select: {
        id: true;
        nickname: true;
        statusMessage: true;
        userAvatars: {
          select: {
            avatar: {
              select: { avatarUrl: true };
            };
          };
        };
      };
    };
  };
}>;