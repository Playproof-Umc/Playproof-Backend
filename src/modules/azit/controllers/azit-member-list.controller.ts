// src/modules/azit/controllers/azit-member-list.controller.ts
import {
    Controller,
    Get,
    Path,
    Query,
    Route,
    Tags,
    SuccessResponse,
    Response,
    Security,
    Request,
    Middlewares,
} from "tsoa";
import { injectable, inject } from "tsyringe";
import { AzitMemberListService } from "../services/azit-member-list.service";
import { GetAzitMembersResDto } from "../dtos/azit.res.dto";
import { GetAzitMembersReqDto } from "../dtos/azit.req.dto";
import {
    Result,
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    InternalServerError,
} from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

@Route("azits")
@Tags("Azit")
@injectable()
export class AzitMemberListController extends Controller {
    constructor(
        @inject(AzitMemberListService) private azitMemberListService: AzitMemberListService,
    ) {
        super();
    }

    /**
     * 아지트 멤버 조회
     * 특정 아지트에 속한 모든 멤버 정보를 조회합니다.
     */
    @SuccessResponse("200", "OK")
    @Response<BadRequestError>(400, "Bad Request")
    @Response<UnauthorizedError>(401, "Unauthorized")
    @Response<NotFoundError>(404, "Not Found")
    @Response<InternalServerError>(500, "Internal Server Error")
    @Security("jwt")
    @Middlewares(validationMiddleware(GetAzitMembersReqDto))
    @Get("{azitId}/members")
    public async getAzitMembers(
        @Path() azitId: number,
        @Request() req: any,
        @Query() page?: number,
        @Query() size?: number,
    ): Promise<Result<GetAzitMembersResDto>> {
        const azitIdBigInt = BigInt(azitId);
        const pageNum = page !== undefined ? page : 0;
        const sizeNum = size !== undefined ? size : 20;

        const result = await this.azitMemberListService.getAzitMembers(
            azitIdBigInt,
            pageNum,
            sizeNum,
        );

        this.setStatus(result.statusCode);
        return result;
    }
}
