// src/modules/user/user.repository.ts
import { singleton } from "tsyringe";
import { prisma } from "../../common/config/database"; 
import { PlayStyle, Provider } from "@prisma/client";
import { SignUpReqDto } from '../auth/dtos/auth.req.dto';

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

  async createUser(dto: SignUpReqDto) {
    const { gameInfo, terms } = dto;

    return await prisma.user.create({
      data: {
        // 1. 유저 기본 정보
        nickname: dto.nickname,
        password: dto.password, 
        phone: dto.phone,
        provider: Provider.LOCAL,
        
        playStyle: gameInfo.playStyle === 'manner' ? PlayStyle.MANNER : PlayStyle.SKILL,

        userTerms: {
          create: terms
            .filter((term) => term.agree)
            .map((term) => ({
              termId: BigInt(term.id),
            })),
        },

        userGameInfos: {
          create: {
            accountId: gameInfo.accountId, 
            gameInfo: {
              create: {
                gameId: BigInt(gameInfo.gameId),
                gameName: gameInfo.gameName,
                gameNickname: gameInfo.gameNickname,
                tierId: gameInfo.tierId ? BigInt(gameInfo.tierId) : null,
                positionId: gameInfo.positionId ? BigInt(gameInfo.positionId) : null,
              },
            },
          },
        },
      },
      include: {
        userTerms: true,
        userGameInfos: {
          include: {
            gameInfo: true,
          },
        },
      },
    });
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
