// src/modules/azit/repositories/azit.repository.ts
import { singleton } from "tsyringe";

import { Azit } from "@prisma/client";
import { prisma } from "../../../common/config/database";

@singleton()
export class AzitRepository {

	async createAzit(azitName: string, imageUrl: string | null = null) : Promise<Azit> {
    return prisma.azit.create({
      data: {
        azitName: azitName,
        imageUrl: imageUrl,
      },
    });
  }

  async findAzitById(azitId: bigint): Promise<Azit | null> {
    return prisma.azit.findUnique({
      where: {
        id: azitId,
      },
    });
  }

  async updateAzit(
    azitId: bigint,
    data: {
      azitName: string;
      imageUrl?: string | null;
    }
  ): Promise<Azit> {
    return prisma.azit.update({
      where: {
        id: azitId,
      },
      data,
    });
  }

  async deleteAzit(azitId: bigint): Promise<void> {
    await prisma.azit.delete({
      where: {
        id: azitId,
      },
    });
  }
}
