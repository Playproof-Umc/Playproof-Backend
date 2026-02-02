// src/modules/highlight/controllers/highlight-create.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Route,
  Tags,
  SuccessResponse,
  Response,
  Request,
  Security,
  Middlewares,
  UploadedFiles,
  FormField,
  Path,
  Query,
} from "tsoa";
import { injectable, inject } from "tsyringe";
import { HighlightCreateService } from "../services/highlight-create.service";
import { HighlightListService } from "../services/highlight-list.service";
import { HighlightUpdateService } from "../services/highlight-update.service";
import { HighlightDeleteService } from "../services/highlight-delete.service";
import { HighlightLikeService } from "../services/highlight-like.service";
import { HighlightCreateReqDto, HighlightVisibility, GetHighlightListReqDto, HighlightUpdateReqDto } from "../dtos/highlight.req.dto";
import { HighlightCreateResDto, GetHighlightListResDto, GetHighlightDetailResDto, HighlightDeleteResDto, HighlightLikeResDto, HighlightUnlikeResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("azits")
@Tags("Highlight")
@injectable()
export class HighlightCreateController extends Controller {
  constructor(
    @inject(HighlightCreateService) private highlightCreateService: HighlightCreateService,
    @inject(HighlightListService) private highlightListService: HighlightListService,
    @inject(HighlightUpdateService) private highlightUpdateService: HighlightUpdateService,
    @inject(HighlightDeleteService) private highlightDeleteService: HighlightDeleteService,
    @inject(HighlightLikeService) private highlightLikeService: HighlightLikeService,
  ) {
    super();
  }

  /**
   * 하이라이트 클립 생성
   * 새로운 하이라이트 클립을 생성합니다. (아지트 내부 또는 커뮤니티 공개)
   */
  @SuccessResponse("201", "Created")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(HighlightCreateReqDto))
  @Post("{azit_id}/highlights")
  public async createHighlight(
    @Request() req: any,
    @Path() azit_id: number,
    @FormField() content?: string,
    @FormField() visibility?: HighlightVisibility,
    @UploadedFiles() medias?: Express.Multer.File[],
  ): Promise<Result<HighlightCreateResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);

    // DTO 검증을 위해 req.body 사용
    const dto: HighlightCreateReqDto = {
      content: req.body.content,
      visibility: req.body.visibility,
    };

    const result = await this.highlightCreateService.createHighlight(
      userId,
      azitId,
      dto,
      medias,
    );

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 커뮤니티 직접 등록 하이라이트 생성 (추가된 기능)
   * 아지트 ID 없이 커뮤니티에 직접 하이라이트를 생성합니다.
   * URL: POST /azits/highlights
   */
  @SuccessResponse("201", "Created")
  @Security("jwt")
  @Middlewares(validationMiddleware(HighlightCreateReqDto))
  @Post("highlights") // 🚩 기존 @Route("azits")와 합쳐져 /azits/highlights 가 됩니다.
  public async createCommunityHighlight(
    @Request() req: any,
    @FormField() content?: string,
    @FormField() visibility?: HighlightVisibility,
    @UploadedFiles() medias?: Express.Multer.File[],
  ): Promise<Result<HighlightCreateResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = null; // 직접 등록이므로 null

    const dto: HighlightCreateReqDto = {
      content: req.body.content,
      visibility: req.body.visibility,
    };

    const result = await this.highlightCreateService.createHighlight(
      userId,
      azitId,
      dto,
      medias,
    );

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 하이라이트 목록 조회
   * 특정 아지트에 존재하는 모든 하이라이트 목록을 조회합니다.
   */
  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(GetHighlightListReqDto))
  @Get("{azit_id}/highlights")
  public async getHighlightList(
    @Request() req: any,
    @Path() azit_id: number,
    @Query() cursor?: number,
    @Query() limit?: number,
    @Query() sort?: string,
    @Query() order?: string,
  ): Promise<Result<GetHighlightListResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);

    // DTO 검증을 위해 req.query 사용
    const dto: GetHighlightListReqDto = {
      cursor: req.query.cursor ? Number(req.query.cursor) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sort: req.query.sort as any,
      order: req.query.order as any,
    };

    const result = await this.highlightListService.getHighlightList(userId, azitId, dto);

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 하이라이트 세부 조회
   * 특정 하이라이트의 세부 정보를 조회합니다.
   */
  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Get("{azit_id}/highlights/{highlight_id}")
  public async getHighlightDetail(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() highlight_id: number,
  ): Promise<Result<GetHighlightDetailResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const highlightId = BigInt(highlight_id);

    const result = await this.highlightListService.getHighlightDetail(
      userId,
      azitId,
      highlightId,
    );

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 하이라이트 수정
   * 특정 하이라이트의 정보를 수정합니다. (업로더만 가능)
   */
  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(HighlightUpdateReqDto))
  @Put("{azit_id}/highlights/{highlight_id}")
  public async updateHighlight(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() highlight_id: number,
    @FormField() content?: string,
    @FormField() visibility?: HighlightVisibility,
    @UploadedFiles() medias?: Express.Multer.File[],
  ): Promise<Result<GetHighlightDetailResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const highlightId = BigInt(highlight_id);

    // DTO 검증을 위해 req.body 사용
    const dto: HighlightUpdateReqDto = {
      content: req.body.content,
      visibility: req.body.visibility,
    };

    const result = await this.highlightUpdateService.updateHighlight(
      userId,
      azitId,
      highlightId,
      dto,
      medias,
    );

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 하이라이트 삭제
   * 특정 하이라이트를 삭제합니다. (업로더만 가능)
   */
  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Delete("{azit_id}/highlights/{highlight_id}")
  public async deleteHighlight(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() highlight_id: number,
  ): Promise<Result<HighlightDeleteResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const highlightId = BigInt(highlight_id);

    const result = await this.highlightDeleteService.deleteHighlight(
      userId,
      azitId,
      highlightId,
    );

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 하이라이트 좋아요 추가
   * 특정 하이라이트에 좋아요를 추가합니다.
   */
  @SuccessResponse("201", "Created")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<ConflictError>(409, "Conflict")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Post("{azit_id}/highlights/{highlight_id}/likes")
  public async addLike(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() highlight_id: number,
  ): Promise<Result<HighlightLikeResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const highlightId = BigInt(highlight_id);

    const result = await this.highlightLikeService.addLike(
      userId,
      azitId,
      highlightId,
    );

    this.setStatus(result.statusCode);
    return result;
  }

  /**
   * 하이라이트 좋아요 취소
   * 특정 하이라이트에서 좋아요를 삭제합니다.
   */
  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<UnauthorizedError>(401, "Unauthorized")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Delete("{azit_id}/highlights/{highlight_id}/likes")
  public async removeLike(
    @Request() req: any,
    @Path() azit_id: number,
    @Path() highlight_id: number,
  ): Promise<Result<HighlightUnlikeResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    const highlightId = BigInt(highlight_id);

    const result = await this.highlightLikeService.removeLike(
      userId,
      azitId,
      highlightId,
    );

    this.setStatus(result.statusCode);
    return result;
  }
}
