import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { CommunityPostCreateReqDto, CommunityPostUpdateReqDto } from "../dtos/community-post.req.dto";

@injectable()
export class CommunityPostRepository extends PrismaClient {
  constructor() {
    super();
  }

  // 1. 게임 카테고리 존재 확인
  async findGameById(gameId: number) {
    return await this.game.findUnique({
      where: {
        id: BigInt(gameId)
      }
    });
  }

  // 2. 게임별 목록 조회
  async findByGameId(gameId: number, skip: number, take: number) {
    return await this.communityPost.findMany({
      where: { gameId: BigInt(gameId) },
      skip,
      take,
      include: {
        user: true,
        medias: true,
        _count: { select: { comments: true, likes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 2-1. 전체 목록 조회
  async findAll(skip: number, take: number) {
    return await this.communityPost.findMany({
      skip,
      take,
      include: {
        user: true,
        medias: true,
        _count: { select: { comments: true, likes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 3. 베스트 목록 조회
  async findBestPosts(gameId?: number, limit: number = 5) {
    return await this.communityPost.findMany({
      where: gameId ? { gameId: BigInt(gameId) } : {},
      take: limit,
      include: {
        user: true,
        medias: true,
        _count: { select: { comments: true, likes: true } }
      },
      orderBy: { likes: { _count: 'desc' } }
    });
  }

  // 4. 상세 조회
  async findById(postId: number) {
    return await this.communityPost.findUnique({
      where: { id: BigInt(postId) },
      include: {
        user: true,
        medias: true,
        _count: { select: { comments: true, likes: true } }
      }
    });
  }

  // 5. 게시글 등록
  async save(userId: number, dto: CommunityPostCreateReqDto) {
    return await this.communityPost.create({
      data: {
        userId: BigInt(userId),
        gameId: BigInt(dto.game_id),
        title: dto.title,
        content: dto.content,
        medias: dto.medias ? {
          create: dto.medias.map((m) => ({
            mediaUrl: m.media_url,
            order: m.order
          }))
        } : undefined
      },
      include: {
        user: true,
        medias: true,
        _count: { select: { comments: true, likes: true } }
      }
    });
  }

  // 6. 게시글 수정 (트랜잭션 최적화) // 2. 트랜잭션 유지 🏁
  async update(postId: number, dto: CommunityPostUpdateReqDto) {
    return await this.$transaction(async (tx) => {
      // 미디어가 새로 들어오면 기존 미디어 삭제
      if (dto.medias) {
        await tx.communityMedia.deleteMany({
          where: { postId: BigInt(postId) }
        });
      }

      return await tx.communityPost.update({
        where: { id: BigInt(postId) },
        data: {
          title: dto.title,
          content: dto.content,
          medias: dto.medias ? {
            create: dto.medias.map((m) => ({
              mediaUrl: m.media_url,
              order: m.order
            }))
          } : undefined
        },
        include: {
          user: true,
          medias: true,
          _count: { select: { comments: true, likes: true } }
        }
      });
    });
  }

  // 7. 게시글 삭제
  async delete(postId: number) {
    return await this.communityPost.delete({
      where: { id: BigInt(postId) }
    });
  }

  // 8. 개수 조회
  async countByGameId(gameId: number) {
    return await this.communityPost.count({
      where: { gameId: BigInt(gameId) }
    });
  }

  // 9. 전체 개수 조회
  async countAll() {
    return await this.communityPost.count();
  }
}