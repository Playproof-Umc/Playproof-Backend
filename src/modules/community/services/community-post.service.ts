import { injectable, inject } from "tsyringe";
import { CommunityPostRepository } from "../repositories/community-post.repository";
import { CommunityPostCreateReqDto, CommunityPostUpdateReqDto } from "../dtos/community-post.req.dto";
import { CommunityPostResDto, CommunityPostListResDto, CommunityPostDeleteResDto } from "../dtos/community-post.res.dto";
import { Result, ok, created, internalServerError } from "../../../common/types/result.type";
import { CommunityPostValidator } from "../utils/community-post.validator";

@injectable()
export class CommunityPostService {
  constructor(
    @inject(CommunityPostRepository) private repository: CommunityPostRepository
  ) {}

  // 1. 게시글 등록
  async createPost(userId: number, dto: CommunityPostCreateReqDto): Promise<Result<CommunityPostResDto>> {
    const error = await CommunityPostValidator.validateMasterData(this.repository, dto.game_id);
    if (error) return error;

    const post = await this.repository.save(userId, dto);
    if (!post) return internalServerError({ message: "게시글 등록에 실패했습니다." });

    return created(this.formatPostResponse(post));
  }

  // 2. 게시글 수정
  async updatePost(userId: number, postId: number, dto: CommunityPostUpdateReqDto): Promise<Result<CommunityPostResDto>> {
    const { error } = await CommunityPostValidator.checkPostOwnership(this.repository, postId, userId);
    if (error) return error;

    const updated = await this.repository.update(postId, dto);
    return ok(this.formatPostResponse(updated));
  }

  // 3. 게시글 삭제
  async deletePost(userId: number, postId: number): Promise<Result<CommunityPostDeleteResDto>> {
    const { error } = await CommunityPostValidator.checkPostOwnership(this.repository, postId, userId);
    if (error) return error;

    await this.repository.delete(postId);
    return ok({ post_id: postId, message: "게시글이 성공적으로 삭제되었습니다." });
  }

  // 4. 게시글 상세 조회
  async getPostDetail(postId: number): Promise<Result<CommunityPostResDto>> {
    const { post, error } = await CommunityPostValidator.validatePost(this.repository, postId);
    if (error) return error;

    return ok(this.formatPostResponse(post));
  }

  // 5. 게시글 목록 조회
  async getPostList(gameId: number, page: number, size: number): Promise<Result<CommunityPostListResDto>> {
    const skip = (page - 1) * size;
    const [posts, total] = await Promise.all([
      this.repository.findByGameId(gameId, skip, size),
      this.repository.countByGameId(gameId)
    ]);

    return ok({
      posts: posts.map((p) => this.formatPostResponse(p)),
      meta: {
        total_count: total,
        current_page: page,
        total_pages: Math.ceil(total / size)
      }
    });
  }

  // 5-1. 전체 게시글 목록 조회
  async getAllPostList(page: number, size: number): Promise<Result<CommunityPostListResDto>> {
    const skip = (page - 1) * size;
    const [posts, total] = await Promise.all([
      this.repository.findAll(skip, size),
      this.repository.countAll()
    ]);

    return ok({
      posts: posts.map((p) => this.formatPostResponse(p)),
      meta: {
        total_count: total,
        current_page: page,
        total_pages: Math.ceil(total / size)
      }
    });
  }

  // 6. 베스트 게시글 조회
  async getBestPostList(gameId?: number): Promise<Result<CommunityPostListResDto>> {
    const posts = await this.repository.findBestPosts(gameId);
    
    return ok({
      posts: posts.map((p) => this.formatPostResponse(p)),
      meta: {
        total_count: posts.length,
        current_page: 1,
        total_pages: 1
      }
    });
  }

  // 7. 응답 데이터 포맷팅 (매핑)
  private formatPostResponse(p: any): CommunityPostResDto {
    return {
      post_id: Number(p.id),
      user_id: Number(p.userId),
      nickname: p.user.nickname,
      game_id: Number(p.gameId),
      title: p.title,
      content: p.content,
      medias: p.medias.map((m: any) => ({
        media_url: m.mediaUrl,
        order: m.order
      })),
      comment_count: p._count.comments,
      like_count: p._count.likes,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString()
    };
  }
}