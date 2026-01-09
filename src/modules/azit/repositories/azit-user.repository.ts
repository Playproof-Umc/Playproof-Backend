// src/modules/azit/repositories/azit-user.repository.ts
import { singleton } from "tsyringe";

import { AzitUser, AzitUserRole } from "@prisma/client";
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
}