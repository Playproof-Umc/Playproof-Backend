// src/modules/user/user.repository.ts
import { singleton } from "tsyringe";
import { prisma } from "../../common/config/database"; 

@singleton()
export class UserRepository{
    
  async findByPhoneNumber(phoneNumber: string) {
    return prisma.user.findUnique({ where: { phoneNumber } });
  }

  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
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
}