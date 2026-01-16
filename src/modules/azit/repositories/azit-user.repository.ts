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

  // ----------------------------------------------------------------------------------------------------
  // 존재 여부 확인
  // ----------------------------------------------------------------------------------------------------

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
}
