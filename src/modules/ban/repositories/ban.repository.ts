// src/modules/ban/repositories/ban.repository.ts

import { singleton } from 'tsyringe';
import { prisma } from '../../../common/config/database';
import { CreateBanReqDto } from '../dtos/ban.req.dto';

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
}
