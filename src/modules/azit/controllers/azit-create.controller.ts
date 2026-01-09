// src/modules/azit/controllers/azit-create.controller.ts
import { Controller, Post, Route, Tags, SuccessResponse, Response, Request, Security, Middlewares, UploadedFile, FormField } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitService } from "../services/azit.service";
import { AzitCreateReqDto } from "../dtos/azit.req.dto";
import { AzitCreateResDto } from "../dtos/azit.res.dto";
import { Result, ConflictError, InternalServerError } from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("azits")
@Tags("Azit")
@injectable()
export class AzitController extends Controller {
  constructor(@inject(AzitService) private azitService: AzitService) { super(); }

  @SuccessResponse("201", "Created")
  @Response<ConflictError>(409, "Conflict")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(AzitCreateReqDto))
  @Post("/")
  public async createAzit(
    @Request() req: any,
    @FormField('azit_name') azit_name: string, // Swagger 문서화용 (사용 안 함)
    @UploadedFile('azit_icon') azit_icon?: Express.Multer.File
  ): Promise<Result<AzitCreateResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.azitService.createAzit(userId, req.body, azit_icon);
    
    this.setStatus(result.statusCode);
    
    return result;
  }
}
