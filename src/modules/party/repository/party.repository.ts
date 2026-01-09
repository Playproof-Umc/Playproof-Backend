import { prisma } from "../../../common/config/database"; 
import { singleton } from "tsyringe";

@singleton()
export class PartyRepository {
  async createParty(data: any, userId: number) {
    return prisma.partyPost.create({ data: { ...data, userId } });
  }

  async findById(id: number) {
    return prisma.partyPost.findUnique({ where: { id } });
  }

  async findByUserId(userId: number) {
    return prisma.partyPost.findMany({ where: { userId } });
  }

  async findByGameId(gameId: number) {
    return prisma.partyPost.findMany({ where: { gameId } });
  }

  async findByAzitId(azitId: number) {
    return prisma.partyPost.findMany({ where: { azitId } });
  }

  async findByPositionId(positionId: number) {
    return prisma.partyPost.findMany({ where: { positionId } });
  }

  async findByTierId(tierId: number) {
    return prisma.partyPost.findMany({ where: { tierId } });
  }

  async updateParty(id: number, data: any) {
    return prisma.partyPost.update({ where: { id }, data });
  }

  async deleteParty(id: number) {
    return prisma.partyPost.delete({ where: { id } });
  }
}
