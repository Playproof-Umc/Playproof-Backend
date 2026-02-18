// src/modules/user/user.repository.ts
import { singleton } from "tsyringe";
import { prisma } from "../../common/config/database"; 
import { PlayStyle, Provider } from "@prisma/client";
import { SignUpReqDto } from '../auth/dtos/auth.req.dto';
import { AddGameAccountReqDto } from "./dtos/user.req.dto";

@singleton()
export class UserRepository {
  async findByPhoneNumber(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: number) {
    return prisma.user.findUnique({ 
      where: { id },
      include: {
        userAvatars: {
          where: { isEquipped: true }, 
          include: {
            avatar: true 
          }
        }
      }
    });
  }

  async findByName(nickname: string) {
    return prisma.user.findUnique({ where: { nickname } }); 
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

  async getTop3FeedbackTags(userId: number) {
    const targetId = BigInt(userId);

    const [posGroup, negGroup] = await Promise.all([
      prisma.feedbackPositiveCategory.groupBy({
        by: ['positiveId'],
        where: { feedback: { targetId } },
        _count: { positiveId: true },
        orderBy: { _count: { positiveId: 'desc' } },
        take: 3,
      }),
      prisma.feedbackNegativeCategory.groupBy({
        by: ['negativeId'],
        where: { feedback: { targetId } },
        _count: { negativeId: true },
        orderBy: { _count: { negativeId: 'desc' } },
        take: 3,
      }),
    ]);

    const mergedTags = [
      ...posGroup.map((t) => ({
        id: Number(t.positiveId),
        type: 'POSITIVE',
        count: t._count.positiveId,
      })),
      ...negGroup.map((t) => ({
        id: Number(t.negativeId),
        type: 'NEGATIVE',
        count: t._count.negativeId,
      })),
    ];

    return mergedTags
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((tag) => ({
        id: tag.id,
        type: tag.type, 
      }));
  }

  async getVerifiedGameAccounts(userId: number) {
    const targetId = BigInt(userId);

    const records = await prisma.userGameInfo.findMany({
      where: {
        userId: targetId,
        isVerified: true, 
      },
      select: {
        accountId: true,
        gameInfo: { 
          select: {
            gameId: true, 
          },
        },
      },
    });

    return records.map((record) => ({
      gameId: Number(record.gameInfo.gameId), 
      accountId: record.accountId,
    }));
  }

  async getUserPreferredGameIds(userId: number): Promise<number[]> {
    const targetId = BigInt(userId);

    const records = await prisma.userGameInfo.findMany({
      where: {
        userId: targetId,
      },
      select: {
        gameInfo: {
          select: {
            gameId: true,
          },
        },
      },
    });

    const gameIds = records.map((record) => Number(record.gameInfo.gameId));
    
    return [...new Set(gameIds)];
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
            accountId: gameInfo.accountId ? gameInfo.accountId : null, 
            isVerified: gameInfo.accountId ? true : false,
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

  async findReceivedFeedbacks(userId: number, cursorId: number | null, limit: number) {
    const targetId = BigInt(userId);
    const takeLimit = limit + 1; 

    const cursorCondition = cursorId
      ? {
          id: { lt: BigInt(cursorId) },
        }
      : {};

    return await prisma.feedback.findMany({
      where: {
        targetId: targetId,
        ...cursorCondition,
      },
      take: takeLimit,
      orderBy: {
        id: "desc", 
      },
      include: { 
        user: {
          select: {
            id: true,
            nickname: true,
            trustScore: true,
            userAvatars: {
              where: { isEquipped: true },
              select: { avatar: { select: { avatarUrl: true } } },
            },
          },
        },
        positiveCategories: {
          include: { positive: true },
        },
        negativeCategories: {
          include: { negative: true },
        },
      },
    });
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

  async findUserGameAccount(userId: number, gameId: number, accountId: string) {
    return await prisma.userGameInfo.findFirst({
      where: {
        userId: BigInt(userId),
        gameInfo: {
          gameId: BigInt(gameId),
        },
        accountId: accountId,
      },
    });
  }

  async createGameAccount(userId: number, data: AddGameAccountReqDto) {
    const gameInfo = await prisma.gameInfo.create({
      data: {
        gameId: BigInt(data.gameId),
        gameName: data.gameName,
        gameNickname: data.gameNickname,
        tierId: data.tierId ? BigInt(data.tierId) : null,
        positionId: data.positionId ? BigInt(data.positionId) : null,
      },
    });
    return await prisma.userGameInfo.create({
      data: {
        userId: BigInt(userId),
        infoId: gameInfo.id, 
        accountId: data.accountId,
        isVerified: true,
      },
      include: {
        gameInfo: true,
      },
    });
    }
}
