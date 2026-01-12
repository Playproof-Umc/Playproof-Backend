// src/modules/azit/repositories/azit-user.repository.ts
import { singleton } from "tsyringe";

import { Azit, AzitUser, AzitUserRole } from "@prisma/client";
import { prisma } from "../../../common/config/database";

@singleton()
export class AzitUserRepository {
  async createAzitUser(userId: bigint, azitId: bigint, role: AzitUserRole = AzitUserRole.MEMBER) : Promise<AzitUser>{
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

  async findAzitsByUserId(userId: bigint): Promise<Array<Pick<Azit, 'id' | 'azitName' | 'imageUrl'>>> {
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

  async findAzitUserRoleByUserIdAndAzitId(userId: bigint, azitId: bigint): Promise<AzitUserRole | null> {
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

  async countMembersByAzitId(azitId: bigint): Promise<number> {
    return prisma.azitUser.count({
      where: {
        azitId,
      },
    });
  }

  async findMembersByAzitIdWithPagination(
    azitId: bigint,
    page: number,
    size: number,
  ) {
    const skip = page * size;

    const members = await prisma.azitUser.findMany({
      where: {
        azitId,
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
      orderBy: [
        {
          role: 'asc', // HOST가 먼저
        },
        {
          joinedAt: 'asc',
        },
      ],
      skip,
      take: size,
    });

    return members;
  }
}