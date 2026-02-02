// src/modules/azit/repositories/azit-user.repository.ts
import { singleton } from 'tsyringe';
import { Azit, AzitUser, AzitUserRole } from '@prisma/client';

import { prisma } from '../../../common/config/database';

@singleton()
export class AzitUserRepository {
  // ----------------------------------------------------------------------------------------------------
  // 생성
  // ----------------------------------------------------------------------------------------------------

  async createAzitUser(
    userId: bigint,
    azitId: bigint,
    role: AzitUserRole = AzitUserRole.MEMBER,
    tx?: any,
  ): Promise<AzitUser> {
    const client = tx || prisma;
    return client.azitUser.create({
      data: {
        userId,
        azitId,
        role,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 조회: userId
  // ----------------------------------------------------------------------------------------------------

  async findAzitsByUserId(userId: bigint): Promise<Azit[]> {
    const azitUsers = await prisma.azitUser.findMany({
      where: {
        userId,
      },
      include: {
        azit: true,
      },
    });

    return azitUsers.map((azitUser) => azitUser.azit);
  }

  async findAzitNamesByUserId(userId: bigint): Promise<string[]> {
    const azitUsers = await prisma.azitUser.findMany({
      where: {
        userId,
      },
      select: {
        azit: {
          select: {
            azitName: true,
          },
        },
      },
    });

    return azitUsers.map((azitUser) => azitUser.azit.azitName);
  }

  // ----------------------------------------------------------------------------------------------------
  // 조회: userId와 azitId
  // ----------------------------------------------------------------------------------------------------

  async findAzitUserByUserIdAndAzitId(
    userId: bigint,
    azitId: bigint,
  ): Promise<AzitUser | null> {
    return prisma.azitUser.findFirst({
      where: {
        userId,
        azitId,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 존재 여부 확인
  // ----------------------------------------------------------------------------------------------------

  async existsAzitUserByMemberId(memberId: bigint): Promise<boolean> {
    const azitUser = await prisma.azitUser.findFirst({
      where: {
        id: memberId,
      },
      select: {
        id: true,
      },
    });

    return azitUser !== null;
  }

  // ----------------------------------------------------------------------------------------------------
  // 역할 확인
  // ----------------------------------------------------------------------------------------------------

  async isHost(memberId: bigint): Promise<boolean> {
    const azitUser = await prisma.azitUser.findFirst({
      where: {
        id: memberId,
        role: AzitUserRole.HOST,
      },
      select: {
        id: true,
      },
    });

    return azitUser !== null;
  }

  async countMembersByAzitId(azitId: bigint): Promise<number> {
    return prisma.azitUser.count({
      where: {
        azitId,
      },
    });
  }

  async findMembersByAzitIdWithCursor(
    azitId: bigint,
    cursor: string | null,
    size: number,
  ) {
    const whereCondition: any = {
      azitId,
    };

    // 커서가 있으면 닉네임이 커서보다 큰 멤버만 조회
    if (cursor) {
      whereCondition.user = {
        nickname: {
          gt: cursor,
        },
      };
    }

    const members = await prisma.azitUser.findMany({
      where: whereCondition,
      include: {
        user: {
          include: {
            userAvatars: {
              where: {
                isEquipped: true,
              },
              include: {
                avatar: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        user: {
          nickname: 'asc', // 닉네임 오름차순 정렬
        },
      },
      take: size + 1, // 하나 더 가져와서 has_next 판단
    });

    return members;
  }

  /**
   * 오프셋 기반 멤버 목록 조회 -> 파티와 동일
   */
  async findMembersByAzitId(
    azitId: bigint,
    page: number,
    size: number,
  ) {
    const skip = (page - 1) * size;

    const members = await prisma.azitUser.findMany({
      where: { azitId },
      include: {
        user: {
          include: {
            userAvatars: {
              where: {
                isEquipped: true,
              },
              include: {
                avatar: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'asc', // 가입 순서대로 정렬
      },
      skip,
      take: size,
    });

    return members;
  }

  async createAzitUserWithDetails(
    userId: bigint,
    azitId: bigint,
    role: AzitUserRole = AzitUserRole.MEMBER,
  ) {
    return prisma.azitUser.create({
      data: {
        userId,
        azitId,
        role,
      },
      include: {
        user: {
          include: {
            userAvatars: {
              where: {
                isEquipped: true,
              },
              include: {
                avatar: true,
              },
              take: 1,
            },
          },
        },
      },
    });
  }

  async findAzitUserById(memberId: bigint) {
    return prisma.azitUser.findUnique({
      where: {
        id: memberId,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });
  }

  async countHostsByAzitId(azitId: bigint): Promise<number> {
    return prisma.azitUser.count({
      where: {
        azitId,
        role: AzitUserRole.HOST,
      },
    });
  }

  async deleteAzitUser(memberId: bigint) {
    return prisma.azitUser.delete({
      where: {
        id: memberId,
      },
    });
  }
}
