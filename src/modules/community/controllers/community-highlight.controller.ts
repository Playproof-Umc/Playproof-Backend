import { Controller, Get, Post, Patch, Delete, Route, Tags, Body, Path, Query, Request, Security, SuccessResponse, Middlewares, UploadedFiles, FormField } from "tsoa";
import { injectable, singleton } from "tsyringe";
import { CommunityHighlightService } from "../services/community-highlight.service";
import { CommunityHighlightCreateReqDto, CommunityHighlightUpdateReqDto } from "../dtos/community-highlight.req.dto";
import { 
  CommunityHighlightResDto, 
  CommunityHighlightListResDto, 
  CommunityHighlightUpdateResDto, 
  CommunityHighlightDeleteResDto 
} from "../dtos/community-highlight.res.dto";
import { Result } from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("community/highlights")
@Tags("Community Highlight")
@injectable()
@singleton()
export class CommunityHighlightController extends Controller {
  constructor(private readonly highlightService: CommunityHighlightService) {
    super();
  }

  // 1. 커뮤니티 하이라이트 목록 조회 (최신순)
  @SuccessResponse("200", "OK")
  @Get("")
  public async getHighlightList(
    @Request() request: any,
    @Query() page: number = 1,
    @Query() size: number = 10
  ): Promise<Result<CommunityHighlightListResDto>> {
    const userId = request.user?.id ? BigInt(request.user.id) : null;
    const result = await this.highlightService.getHighlightList(userId, page, size);
    this.setStatus(result.statusCode);
    return result;
  }

  // 2. 하이라이트 상세 조회
  @SuccessResponse("200", "OK")
  @Get("{highlightId}")
  public async getHighlightDetail(
    @Path() highlightId: number,
    @Request() request: any
  ): Promise<Result<CommunityHighlightResDto>> {
    const userId = request.user?.id ? BigInt(request.user.id) : null;
    const result = await this.highlightService.getHighlightDetail(userId, BigInt(highlightId));
    this.setStatus(result.statusCode);
    return result;
  }

  // 3. 하이라이트 생성
  @SuccessResponse("201", "Created")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityHighlightCreateReqDto))
  @Post("")
  public async createHighlight(
    @Request() request: any,
    @FormField() azit_id?: number,
    @FormField() content?: string,
    @FormField() is_public?: boolean,
    @UploadedFiles() medias?: Express.Multer.File[],
  ): Promise<Result<CommunityHighlightUpdateResDto>> {
    const userId = BigInt(request.user.id);
    const dto: CommunityHighlightCreateReqDto = {
      azit_id: request.body.azit_id ? Number(request.body.azit_id) : undefined,
      content: request.body.content,
      is_public: request.body.is_public === "true" || request.body.is_public === true,
    };
    const result = await this.highlightService.createHighlight(userId, dto, medias);
    this.setStatus(result.statusCode);
    return result;
  }

  // 4. 하이라이트 수정
  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Middlewares(validationMiddleware(CommunityHighlightUpdateReqDto))
  @Patch("{highlightId}")
  public async updateHighlight(
    @Path() highlightId: number,
    @Body() body: CommunityHighlightUpdateReqDto,
    @Request() request: any
  ): Promise<Result<CommunityHighlightUpdateResDto>> {
    const userId = BigInt(request.user.id);
    const result = await this.highlightService.updateHighlight(userId, BigInt(highlightId), body);
    this.setStatus(result.statusCode);
    return result;
  }

  // 5. 하이라이트 삭제
  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Delete("{highlightId}")
  public async deleteHighlight(
    @Path() highlightId: number,
    @Request() request: any
  ): Promise<Result<CommunityHighlightDeleteResDto>> {
    const userId = BigInt(request.user.id);
    const result = await this.highlightService.deleteHighlight(userId, BigInt(highlightId));
    this.setStatus(result.statusCode);
    return result;
  }
}