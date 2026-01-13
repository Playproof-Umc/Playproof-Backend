// src/modules/azit/controllers/azit-member.controller.ts
import {
    Controller,
    Get,
    Post,
    Delete,
    Path,
    Query,
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
import { AzitMemberService } from "../services/azit-member.service";
import { AddAzitMemberReqDto, GetAzitMembersReqDto } from "../dtos/azit.req.dto";
import { GetAzitMembersResDto, AddAzitMemberResDto, RemoveAzitMemberResDto } from "../dtos/azit.res.dto";
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
export class AzitMemberController extends Controller {
    constructor(
        @inject(AzitMemberService) private azitMemberService: AzitMemberService,
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

        const result = await this.azitMemberService.getAzitMembers(
            azitIdBigInt,
            pageNum,
            sizeNum,
        );

        this.setStatus(result.statusCode);
        return result;
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

        const result = await this.azitMemberService.addAzitMember(
            hostUserId,
            azitId,
            body,
        );

        this.setStatus(result.statusCode);
        return result;
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

        const result = await this.azitMemberService.removeAzitMember(
            requestUserId,
            azitId,
            memberId,
        );

        this.setStatus(result.statusCode);
        return result;
    }
}
