// src/modules/azit/controllers/azit-list.controller.ts
import { Controller, Get, Route, Tags, SuccessResponse, Response, Request, Security } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitListService } from "../services/azit-list.service";
import { AzitListResDto } from "../dtos/azit.res.dto";
import { Result, InternalServerError } from "../../../common/types/result.type";

@Route("azits")
@Tags("Azit")
@injectable()
export class AzitListController extends Controller {
  constructor(@inject(AzitListService) private azitListService: AzitListService) { super(); }

  @SuccessResponse("200", "OK")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Get("/")
  public async getAzits(
		@Request() req: any
	): Promise<Result<AzitListResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.azitListService.getAzitsByUserId(userId);

    this.setStatus(result.statusCode);

    return result;
  }
}

