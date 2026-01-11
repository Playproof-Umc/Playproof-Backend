import { injectable } from "tsyringe";
import { Controller, Get, Post, Patch, Delete, Path, Body, Query, Request, Route, Tags, Security } from "tsoa";
import { PartyCommentService } from "../service/party-comment.service";
import { CommentListResDto, CommentActionResDto } from "../dtos/party-comment.res.dto";
import { Result } from "../../../common/types/result.type";
import { CreateCommentReqDto } from "../dtos/party-comment.req.dto";

@injectable()
@Route('')
@Tags('Party Comment')
export class PartyCommentController extends Controller {
  constructor(private readonly partyCommentService: PartyCommentService) {
    super();
  }

  // 1. 댓글 목록 조회
  @Get('parties/{partyId}/comments')
  public async getComments(
    @Path() partyId: number,
    @Query() page: number = 1,
    @Query() limit: number = 10
  ): Promise<Result<CommentListResDto>> {
    return await this.partyCommentService.getComments(partyId, page, limit);
  }

  // 2. 댓글 작성
  @Post('parties/{partyId}/comments')
  @Security("jwt")
  public async createComment(
    @Request() request: any,
    @Path() partyId: number,
    @Body() body: CreateCommentReqDto
  ): Promise<Result<CommentActionResDto>> {
    const result = await this.partyCommentService.createComment(
      request.user.id, 
      partyId, 
      body.content, 
      body.parentId
    );
    this.setStatus(result.statusCode);
    return result;
  }

  // 3. 댓글 수정
  @Patch('comments/{commentId}')
  @Security("jwt")
  public async updateComment(
    @Request() request: any,
    @Path() commentId: number,
    @Body() body: { content: string }
  ): Promise<Result<CommentActionResDto>> {
    const result = await this.partyCommentService.updateComment(request.user.id, commentId, body.content);
    this.setStatus(result.statusCode);
    return result;
  }

  // 4. 댓글 삭제
  @Delete('comments/{commentId}')
  @Security("jwt")
  public async deleteComment(
    @Request() request: any,
    @Path() commentId: number
  ): Promise<Result<CommentActionResDto>> {
    const result = await this.partyCommentService.deleteComment(request.user.id, commentId);
    this.setStatus(result.statusCode);
    return result;
  }
}