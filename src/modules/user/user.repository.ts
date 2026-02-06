// src/modules/user/user.repository.ts
import { singleton } from "tsyringe";
import { prisma } from "../../common/config/database"; 
import { PlayStyle, Provider } from "@prisma/client";
import { SignUpReqDto } from '../auth/dtos/auth.req.dto';

@singleton()
export class UserRepository{
    
  async findByPhoneNumber(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  async getUserTsRank(userTrustScore: number) {
    const higherScores = await prisma.user.groupBy({
      by: ['trustScore'],
      where: {
        trustScore: {
          gt: userTrustScore,
        },
      },
    });

    return higherScores.length + 1;
  }

  async getPositiveFeedbackPercentage(userId: number) {
    const targetId = BigInt(userId);

    const positiveCount = await prisma.feedbackPositiveCategory.count({
      where: {
        feedback: {
          targetId: targetId,
        },
      },
    });

    const negativeCount = await prisma.feedbackNegativeCategory.count({
      where: {
        feedback: {
          targetId: targetId,
        },
      },
    });

    const totalCount = positiveCount + negativeCount;

    if (totalCount === 0) {
      return {
        positiveCount: 0,
        negativeCount: 0,
        totalCount: 0,
        percentage: 0,
      };
    }

    const percentage = (positiveCount / totalCount) * 100;

    return {
      positiveCount,
      negativeCount,
      totalCount,
      percentage: Math.round(percentage * 10) / 10, 
    };
  }

  async getUserCategoryIds(userId: number): Promise<number[]> {
    const result = await prisma.userCategoryInfo.findMany({
      where: { 
        userId: BigInt(userId)
      },
      select: { 
        categoryId: true
      }
    });

    return result.map((item) => Number(item.categoryId));
  }

  async findByName(nickname: string) {
    const userInfo = await prisma.user.findUnique({ where: { nickname } }); 
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
}