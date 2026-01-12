// src/modules/azit/controllers/azit-member-remove.controller.ts
import {
    Controller,
    Delete,
    Path,
    Route,
    Tags,
    SuccessResponse,
    Response,
    Security,
    Request,
} from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitMemberRemoveService } from "../services/azit-member-remove.service";
import { RemoveAzitMemberResDto } from "../dtos/azit.res.dto";
import {
    Result,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    InternalServerError,
} from "../../../common/types/result.type";

@Route("azits")
@Tags("Azit")
@injectable()
export class AzitMemberRemoveController extends Controller {
    constructor(
        @inject(AzitMemberRemoveService) private azitMemberRemoveService: AzitMemberRemoveService,
    ) {
        super();
    }

    /**
     * 아지트 멤버 제거
     * 특정 아지트에서 멤버를 제거합니다. (아지트장만 가능 또는 본인이 탈퇴)
     */
    @SuccessResponse("200", "OK")
    @Response<BadRequestError>(400, "Bad Request")
    @Response<UnauthorizedError>(401, "Unauthorized")
    @Response<ForbiddenError>(403, "Forbidden")
    @Response<NotFoundError>(404, "Not Found")
    @Response<InternalServerError>(500, "Internal Server Error")
    @Security("jwt")
    @Delete("{azit_id}/members/{member_id}")
    public async removeAzitMember(
        @Request() req: any,
        @Path() azit_id: number,
        @Path() member_id: number,
    ): Promise<Result<RemoveAzitMemberResDto>> {
        const requestUserId = BigInt(req.user.id);
        const azitId = BigInt(azit_id);
        const memberId = BigInt(member_id);

        const result = await this.azitMemberRemoveService.removeAzitMember(
            requestUserId,
            azitId,
            memberId,
        );

        this.setStatus(result.statusCode);
        return result;
    }
}
