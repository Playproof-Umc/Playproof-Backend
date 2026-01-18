import { injectable, inject } from "tsyringe";
import { CommunityPostRepository } from "../repositories/community-post.repository";
import { Result, ok, created, notFound, forbidden, internalServerError } from "../../../common/types/result.type";
import { CommunityPostResDto, CommunityPostListResDto, CommunityPostDeleteResDto } from "../dtos/community-post.res.dto";
import { CommunityPostCreateReqDto, CommunityPostUpdateReqDto } from "../dtos/community-post.req.dto";
import { validateGameExists, validatePostOwnership } from "../utils/community-post.validator";

@injectable()
export class CommunityPostService {
  constructor(
    @inject(CommunityPostRepository) private repository: CommunityPostRepository
  ) {}

  // 1. 게임별 목록 조회
  async getPostList(gameId: number, page: number, size: number): Promise<Result<CommunityPostListResDto>> {
    const skip = (page - 1) * size;
    const [posts, total] = await Promise.all([
      this.repository.findByGameId(gameId, skip, size),
      this.repository.countByGameId(gameId)
    ]);

    return ok({
      posts: posts.map((p) => this.mapToResDto(p)),
      meta: {
        total_count: total,
        current_page: page,
        total_pages: Math.ceil(total / size)
      }
    });
  }

  // 2. 베스트 목록 조회
  async getBestPostList(gameId?: number): Promise<Result<CommunityPostListResDto>> {
    const posts = await this.repository.findBestPosts(gameId);
    return ok({
      posts: posts.map((p) => this.mapToResDto(p)),
      meta: { total_count: posts.length, current_page: 1, total_pages: 1 }
    });
  }

  // 3. 게시글 상세 조회
  async getPostDetail(postId: number): Promise<Result<CommunityPostResDto>> {
    const post = await this.repository.findById(postId);
    if (!post) return notFound({ message: "게시글을 찾을 수 없습니다." });
    return ok(this.mapToResDto(post));
  }

  // 4. 게시글 등록
  async createPost(userId: number, dto: CommunityPostCreateReqDto): Promise<Result<CommunityPostResDto>> {
    const gameError = await validateGameExists<CommunityPostResDto>(this.repository, dto.game_id);
    if (gameError) return gameError;

    const post = await this.repository.save(userId, dto);
    if (!post) return internalServerError({ message: "게시글 등록에 실패했습니다." });

    return created(this.mapToResDto(post));
  }

  // 5. 게시글 수정
  async updatePost(userId: number, postId: number, dto: CommunityPostUpdateReqDto): Promise<Result<CommunityPostResDto>> {
    const validation = await validatePostOwnership<CommunityPostResDto>(this.repository, postId, userId);
    if ('statusCode' in validation) return validation as Result<CommunityPostResDto>;

    const updated = await this.repository.update(postId, dto);
    return ok(this.mapToResDto(updated));
  }

  // 6. 게시글 삭제
  async deletePost(userId: number, postId: number): Promise<Result<CommunityPostDeleteResDto>> {
    const validation = await validatePostOwnership<CommunityPostDeleteResDto>(this.repository, postId, userId);
    if ('statusCode' in validation) return validation as Result<CommunityPostDeleteResDto>;

    await this.repository.delete(postId);
    return ok({ post_id: postId, message: "게시글이 성공적으로 삭제되었습니다." });
  }

  // 7. 조회용 DTO 매핑 (private)
  private mapToResDto(p: any): CommunityPostResDto {
    return {
      post_id: Number(p.id),
      user_id: Number(p.userId),
      nickname: p.user.nickname,
      game_id: Number(p.gameId),
      title: p.title,
      content: p.content,
      medias: p.medias.map((m: any) => ({ media_url: m.mediaUrl, order: m.order })),
      comment_count: p._count.comments,
      like_count: p._count.likes,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString()
    };
  }
}