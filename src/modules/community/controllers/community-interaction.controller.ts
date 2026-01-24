import { Controller, Post, Body, Route, Tags, SuccessResponse, Get, Path, Security, Middlewares, Request, Patch, Delete, Query } from "tsoa";
import { injectable, inject } from "tsyringe";
import { CommunityInteractionService } from "../services/community-interaction.service";
import { Result } from "../../../common/types/result.type";
import { 
  CommunityLikeResDto, 
  CommunityCommentResDto, 
  CommunityCommentListResDto 
} from "../dtos/community-interaction.res.dto";
import { 
  CommunityLikeReqDto, 
  CommunityCommentCreateReqDto, 
  CommunityCommentUpdateReqDto 
} from "../dtos/community-interaction.req.dto";
import { CommunityTargetType } from "../types/community-type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("community")
@Tags("Community Interaction")
@injectable()
export class CommunityInteractionController extends Controller {
  constructor(
    @inject(CommunityInteractionService) private service: CommunityInteractionService
  ) {
    super();
  }

  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityLikeReqDto))
  @Post("likes")
  public async toggleLike(
    @Body() body: CommunityLikeReqDto,
    @Request() req: any
  ): Promise<Result<CommunityLikeResDto>> {
    const result = await this.service.toggleLike(BigInt(req.user.id), body);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("201", "Created")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityCommentCreateReqDto))
  @Post("comments")
  public async createComment(
    @Body() body: CommunityCommentCreateReqDto,
    @Request() req: any
  ): Promise<Result<CommunityCommentResDto>> {
    const result = await this.service.createComment(BigInt(req.user.id), body);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Get("comments")
  public async getComments(
    @Query() target_type: CommunityTargetType,
    @Query() target_id: number
  ): Promise<Result<CommunityCommentListResDto>> {
    const result = await this.service.getComments(target_type, target_id);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityCommentUpdateReqDto))
  @Patch("comments/{comment_id}")
  public async updateComment(
    @Path() comment_id: number,
    @Body() body: CommunityCommentUpdateReqDto,
    @Request() req: any
  ): Promise<Result<{ message: string }>> {
    const result = await this.service.updateComment(BigInt(req.user.id), comment_id, body);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Delete("comments/{comment_id}")
  public async deleteComment(
    @Path() comment_id: number,
    @Request() req: any
  ): Promise<Result<{ message: string }>> {
    const result = await this.service.deleteComment(BigInt(req.user.id), comment_id);
    this.setStatus(result.statusCode);
    return result;
  }
}