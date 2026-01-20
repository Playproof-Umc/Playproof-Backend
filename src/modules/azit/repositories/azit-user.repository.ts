// src/modules/azit/repositories/azit-user.repository.ts
import { singleton } from 'tsyringe';

import { Azit, AzitUser, AzitUserRole } from '@prisma/client';
import { prisma } from '../../../common/config/database';

@singleton()
export class AzitUserRepository {
  async createAzitUser(
    userId: bigint,
    azitId: bigint,
    role: AzitUserRole = AzitUserRole.MEMBER,
  ): Promise<AzitUser> {
    return prisma.azitUser.create({
      data: {
        userId,
        azitId,
        role,
      },
    });
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

  async findAzitsByUserId(
    userId: bigint,
  ): Promise<Array<Pick<Azit, 'id' | 'azitName' | 'imageUrl'>>> {
    const azitUsers = await prisma.azitUser.findMany({
      where: {
        userId,
      },
      select: {
        azit: {
          select: {
            id: true,
            azitName: true,
            imageUrl: true,
          },
        },
      },
    });

    return azitUsers.map((azitUser) => azitUser.azit);
  }

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

  async findAzitUserRoleByUserIdAndAzitId(
    userId: bigint,
    azitId: bigint,
  ): Promise<AzitUserRole | null> {
    const azitUser = await prisma.azitUser.findFirst({
      where: {
        userId,
        azitId,
      },
      select: {
        role: true,
      },
    });

    return azitUser?.role ?? null;
  }

  async existsAzitUserByUserIdAndAzitId(
    userId: bigint,
    azitId: bigint,
  ): Promise<boolean> {
    const azitUser = await prisma.azitUser.findFirst({
      where: {
        userId,
        azitId,
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
