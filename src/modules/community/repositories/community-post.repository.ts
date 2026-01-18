import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { CommunityPostCreateReqDto, CommunityPostUpdateReqDto } from "../dtos/community-post.req.dto";

@injectable()
export class CommunityPostRepository extends PrismaClient {
  constructor() {
    super();
  }

  // 1. 게임별 목록 조회
  async findByGameId(
    gameId: number, 
    skip: number, 
    take: number
  ) {
    return await this.communityPost.findMany({
      where: {
        gameId: BigInt(gameId)
      },
      skip,
      take,
      include: {
        user: true,
        medias: true,
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // 2. 베스트 목록 조회
  async findBestPosts(
    gameId?: number, 
    limit: number = 5
  ) {
    return await this.communityPost.findMany({
      where: gameId ? {
        gameId: BigInt(gameId)
      } : {},
      take: limit,
      include: {
        user: true,
        medias: true,
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      },
      orderBy: {
        likes: {
          _count: 'desc'
        }
      }
    });
  }

  // 3. 상세 조회
  async findById(
    postId: number
  ) {
    return await this.communityPost.findUnique({
      where: {
        id: BigInt(postId)
      },
      include: {
        user: true,
        medias: true,
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });
  }

  // 4. 게시글 등록
  async save(
    userId: number, 
    dto: CommunityPostCreateReqDto
  ) {
    return await this.communityPost.create({
      data: {
        userId: BigInt(userId),
        gameId: BigInt(dto.game_id),
        title: dto.title,
        content: dto.content,
        medias: dto.medias ? {
          create: dto.medias.map((m) => {
            return {
              mediaUrl: m.media_url,
              order: m.order
            };
          })
        } : undefined
      },
      include: {
        user: true,
        medias: true,
        _count: {
          select: {
            comments: true,
            likes: true
          }
        }
      }
    });
  }

  // 5. 게시글 수정
  async update(
    postId: number, 
    dto: CommunityPostUpdateReqDto
  ) {
    return await this.$transaction(async (tx) => {
      if (dto.medias) {
        await tx.communityMedia.deleteMany({
          where: {
            postId: BigInt(postId)
          }
        });
      }

      return await tx.communityPost.update({
        where: {
          id: BigInt(postId)
        },
        data: {
          title: dto.title,
          content: dto.content,
          medias: dto.medias ? {
            create: dto.medias.map((m) => {
              return {
                mediaUrl: m.media_url,
                order: m.order
              };
            })
          } : undefined
        },
        include: {
          user: true,
          medias: true,
          _count: {
            select: {
              comments: true,
              likes: true
            }
          }
        }
      });
    });
  }

  // 6. 게시글 삭제
  async delete(
    postId: number
  ) {
    return await this.communityPost.delete({
      where: {
        id: BigInt(postId)
      }
    });
  }

  // 7. 개수 조회
  async countByGameId(
    gameId: number
  ) {
    return await this.communityPost.count({
      where: {
        gameId: BigInt(gameId)
      }
    });
  }
}