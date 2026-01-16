// src/modules/azit/repositories/azit.repository.ts
import { singleton } from 'tsyringe';
import { Azit } from '@prisma/client';

import { prisma } from '../../../common/config/database';

@singleton()
export class AzitRepository {
  // ----------------------------------------------------------------------------------------------------
  // 생성
  // ----------------------------------------------------------------------------------------------------

  async createAzit(
    azitName: string,
    imageUrl: string | null,
    tx?: any,
  ): Promise<Azit> {
    const client = tx || prisma;
    return client.azit.create({
      data: {
        azitName: azitName,
        imageUrl: imageUrl,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 조회: azitId
  // ----------------------------------------------------------------------------------------------------

  async findAzitById(azitId: bigint): Promise<Azit> {
    return prisma.azit.findUnique({
      where: {
        id: azitId,
      },
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 수정
  // ----------------------------------------------------------------------------------------------------

  async updateAzit(
    azitId: bigint,
    data: {
      azitName: string;
      imageUrl: string | null;
    },
  ): Promise<Azit> {
    return prisma.azit.update({
      where: {
        id: azitId,
      },
      data,
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // 삭제
  // ----------------------------------------------------------------------------------------------------

  async deleteAzit(azitId: bigint): Promise<void> {
    await prisma.azit.delete({
      where: {
        id: azitId,
      },
    });
  }
}
