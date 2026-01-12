// src/modules/azit/controllers/azit-member-add.controller.ts
import {
    Controller,
    Post,
    Path,
    Body,
    Route,
    Tags,
    SuccessResponse,
    Response,
    Security,
    Request,
    Middlewares,
} from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitMemberAddService } from "../services/azit-member-add.service";
import { AddAzitMemberReqDto } from "../dtos/azit.req.dto";
import { AddAzitMemberResDto } from "../dtos/azit.res.dto";
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
@Tags("Azit")
@injectable()
export class AzitMemberAddController extends Controller {
    constructor(
        @inject(AzitMemberAddService) private azitMemberAddService: AzitMemberAddService,
    ) {
        super();
    }

    /**
     * 아지트 멤버 추가
     * 특정 아지트에 새로운 멤버를 추가합니다. (아지트장만 가능)
     */
    @SuccessResponse("201", "Created")
    @Response<BadRequestError>(400, "Bad Request")
    @Response<UnauthorizedError>(401, "Unauthorized")
    @Response<ForbiddenError>(403, "Forbidden")
    @Response<NotFoundError>(404, "Not Found")
    @Response<ConflictError>(409, "Conflict")
    @Response<InternalServerError>(500, "Internal Server Error")
    @Security("jwt")
    @Middlewares(validationMiddleware(AddAzitMemberReqDto))
    @Post("{azit_id}/members")
    public async addAzitMember(
        @Request() req: any,
        @Path() azit_id: number,
        @Body() body: AddAzitMemberReqDto,
    ): Promise<Result<AddAzitMemberResDto>> {
        const hostUserId = BigInt(req.user.id);
        const azitId = BigInt(azit_id);

        const result = await this.azitMemberAddService.addAzitMember(
            hostUserId,
            azitId,
            body,
        );

        this.setStatus(result.statusCode);
        return result;
    }
}
