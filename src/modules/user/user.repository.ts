// src/modules/user/user.repository.ts
import { singleton } from 'tsyringe';
import { prisma } from '../../common/config/database';

@singleton()
export class UserRepository {
  async findByPhoneNumber(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByName(nickname: string) {
    return prisma.user.findUnique({ where: { nickname } });
  }

  async createUser(data: any) {
    return prisma.user.create({ data });
  }

  async updateUser(id: number, data: any) {
    return prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: number) {
    return prisma.user.delete({ where: { id } });
  }

  async findTrustScoreById(userId: bigint, tx?: any): Promise<number | null> {
    const client = tx ?? prisma;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    });
    return user?.trustScore ?? null;
  }

  async updateTrustScore(
    userId: bigint,
    trustScore: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.user.update({
      where: { id: userId },
      data: { trustScore },
    });
  }
}
