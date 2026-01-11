// src/modules/azit/controllers/azit-delete.controller.ts
import { Controller, Delete, Route, Tags, SuccessResponse, Response, Request, Security, Path } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitDeleteService } from "../services/azit-delete.service";
import { Result, ForbiddenError, NotFoundError, InternalServerError } from "../../../common/types/result.type";

@Route("azits")
@Tags("Azit")
@injectable()
export class AzitDeleteController extends Controller {
  constructor(@inject(AzitDeleteService) private azitDeleteService: AzitDeleteService) { super(); }

  @SuccessResponse("200", "OK")
  @Response<ForbiddenError>(403, "Forbidden")
  @Response<NotFoundError>(404, "Not Found")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Delete("/{azit_id}")
  public async deleteAzit(
    @Request() req: any,
    @Path() azit_id: number
  ): Promise<Result<void>> {
    const userId = BigInt(req.user.id);
    const azitId = BigInt(azit_id);
    
    const result = await this.azitDeleteService.deleteAzit(userId, azitId);
    
    this.setStatus(result.statusCode);
    
    return result;
  }
}
