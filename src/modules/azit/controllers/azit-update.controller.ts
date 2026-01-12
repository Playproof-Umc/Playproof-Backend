// src/modules/azit/controllers/azit-update.controller.ts
import { Controller, Patch, Route, Tags, SuccessResponse, Response, Request, Security, Middlewares, UploadedFile, FormField, Path } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitUpdateService } from "../services/azit-update.service";
import { AzitUpdateReqDto } from "../dtos/azit.req.dto";
import { AzitCreateResDto } from "../dtos/azit.res.dto";
import { Result, ForbiddenError, NotFoundError, ConflictError, InternalServerError } from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("azits")
@Tags("Azit")
@injectable()
export class AzitUpdateController extends Controller {
  constructor(@inject(AzitUpdateService) private azitUpdateService: AzitUpdateService) { super(); }

  @SuccessResponse("200", "OK")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<ConflictError>(409, "Conflict")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(AzitUpdateReqDto))
  @Patch("/{azit_id}")
  public async updateAzit(
    @Request() req: any,
    @Path() azit_id: number,
    @FormField('azit_name') azit_name?: string | null, 			// Swagger 문서화용 (사용 안 함)
    @FormField('is_delete_icon') is_delete_icon?: boolean, 	// Swagger 문서화용 (사용 안 함)
    @UploadedFile('azit_icon') azit_icon?: Express.Multer.File
  ): Promise<Result<AzitCreateResDto>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    
    const result = await this.azitUpdateService.updateAzit(
      userId, azitId, req.body, azit_icon
    );
    
    this.setStatus(result.statusCode);
    
    return result;
  }
}

