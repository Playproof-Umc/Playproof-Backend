import { Controller, Patch, Post, Delete, Body, Path, Route, Tags, Security, Request, Response } from "tsoa";
import { injectable, inject } from "tsyringe";
import { PartyInteractionService } from "../service/party-interaction.service";
import { PartyApplicationHandleReqDto } from "../dtos/party.req.dto";
import { Result, ForbiddenError, NotFoundError, ConflictError } from "../../../common/types/result.type";

@Route("parties")
@Tags("Party Interaction")
@injectable()
export class PartyInteractionController extends Controller {
  constructor(@inject(PartyInteractionService) private interactionService: PartyInteractionService) {
    super();
  }

  /** 가입 신청하기 */
  @Security("jwt")
  @Post("/{partyId}/applications")
  public async applyParty(@Path() partyId: number, @Request() req: any): Promise<Result<any>> {
    const result = await this.interactionService.createApplication(req.user.id, partyId);
    this.setStatus(result.statusCode);
    return result;
  }

  /** 가입 신청 취소하기 */
  @Security("jwt")
  @Delete("/{partyId}/applications/{applicationId}")
  public async cancelApply(@Path() partyId: number, @Path() applicationId: number, @Request() req: any): Promise<Result<any>> {
    const result = await this.interactionService.cancelApplication(req.user.id, applicationId);
    this.setStatus(result.statusCode);
    return result;
  }

  /** 가입 신청 승낙/거절 (방장) */
  @Security("jwt")
  @Patch("/{partyId}/applications/{applicationId}")
  public async handleApply(
    @Path() partyId: number,
    @Path() applicationId: number,
    @Body() body: PartyApplicationHandleReqDto,
    @Request() req: any
  ): Promise<Result<any>> {
    const result = await this.interactionService.handleApplication(req.user.id, applicationId, body.isAccepted);
    this.setStatus(result.statusCode);
    return result;
  }
}