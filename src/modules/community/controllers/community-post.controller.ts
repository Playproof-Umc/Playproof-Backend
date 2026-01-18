import { Controller, Post, Body, Route, Tags, SuccessResponse, Get, Path, Security, Middlewares, Request, Patch, Delete, Query } from "tsoa";
import { injectable, inject } from "tsyringe";
import { CommunityPostService } from "../services/community-post.service";
import { Result } from "../../../common/types/result.type";
import { CommunityPostResDto, CommunityPostListResDto, CommunityPostDeleteResDto } from "../dtos/community-post.res.dto";
import { CommunityPostCreateReqDto, CommunityPostUpdateReqDto } from "../dtos/community-post.req.dto";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("community")
@Tags("Community")
@injectable()
export class CommunityPostController extends Controller {
  constructor(
    @inject(CommunityPostService) private service: CommunityPostService
  ) {
    super();
  }

  // 1. 게임별 목록 조회
  @SuccessResponse("200", "OK")
  @Get("games/{game_id}/posts")
  public async getPostList(
    @Path() game_id: number,
    @Query() page: number = 1,
    @Query() size: number = 10
  ): Promise < Result < CommunityPostListResDto >> {
    const result = await this.service.getPostList(game_id, page, size);

    this.setStatus(result.statusCode);

    return result;
  }

  // 2. 베스트 목록 조회
  @SuccessResponse("200", "OK")
  @Get("posts/best")
  public async getBestPosts(
    @Query() game_id ?: number
  ): Promise < Result < CommunityPostListResDto >> {
    const result = await this.service.getBestPostList(game_id);

    this.setStatus(result.statusCode);

    return result;
  }

  // 3. 상세 조회
  @SuccessResponse("200", "OK")
  @Get("posts/{post_id}")
  public async getPostDetail(
    @Path() post_id: number
  ): Promise < Result < CommunityPostResDto >> {
    const result = await this.service.getPostDetail(post_id);

    this.setStatus(result.statusCode);

    return result;
  }

  // 4. 글 등록
  @SuccessResponse("201", "Created")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityPostCreateReqDto))
  @Post("posts")
  public async createPost(
    @Body() body: CommunityPostCreateReqDto,
    @Request() req: any
  ): Promise < Result < CommunityPostResDto >> {
    const userId = req.user.id;
    const result = await this.service.createPost(userId, body);

    this.setStatus(result.statusCode);

    return result;
  }

  // 5. 글 수정
  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityPostUpdateReqDto))
  @Patch("posts/{post_id}")
  public async updatePost(
    @Path() post_id: number,
    @Body() body: CommunityPostUpdateReqDto,
    @Request() req: any
  ): Promise < Result < CommunityPostResDto >> {
    const userId = req.user.id;
    const result = await this.service.updatePost(userId, post_id, body);

    this.setStatus(result.statusCode);

    return result;
  }

  // 6. 글 삭제
  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Delete("posts/{post_id}")
  public async deletePost(
    @Path() post_id: number,
    @Request() req: any
  ): Promise < Result < CommunityPostDeleteResDto >> {
    const userId = req.user.id;
    const result = await this.service.deletePost(userId, post_id);

    this.setStatus(result.statusCode);

    return result;
  }
}