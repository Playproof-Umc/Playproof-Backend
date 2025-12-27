// src/modules/user/user.repository.ts
import { singleton } from "tsyringe";
import { prisma } from "../../common/config/database"; 

@singleton()
export class UserRepository {
    
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: any) {
    return prisma.user.create({ data });
  }
}