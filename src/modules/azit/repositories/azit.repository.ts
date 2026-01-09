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
}