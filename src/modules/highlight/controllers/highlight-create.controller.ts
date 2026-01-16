// src/modules/highlight/controllers/highlight-create.controller.ts
import {
  Controller,
  Post,
  Get,
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
import { HighlightCreateReqDto, HighlightVisibility, GetHighlightListReqDto } from "../dtos/highlight.req.dto";
import { HighlightCreateResDto, GetHighlightListResDto } from "../dtos/highlight.res.dto";
import {
  Result,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
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
}
