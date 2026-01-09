import { Controller, Post, Patch, Delete, Path, Security, Request, Route, Tags, Body } from "tsoa";
import { injectable, inject } from "tsyringe";
import { PartyInteractionService } from "../service/party-interaction.service";
import { HandleApplicationReqDto } from "../dtos/party-interaction.req.dto";
import { ApplyPartyResDto, InteractionMessageResDto, ToggleLikeResDto } from "../dtos/party-interaction.res.dto";

@Route("parties")
@Tags("Party Interaction")
@injectable()
export class PartyInteractionController extends Controller {
  constructor(
    @inject(PartyInteractionService) private interactionService: PartyInteractionService
  ) { super(); }

  // 1. 파티 참가 신청 API
  @Security("jwt")
  @Post("{postId}/applications")
  public async apply(@Path() postId: number, @Request() req: any): Promise<ApplyPartyResDto> {
    const result = await this.interactionService.applyParty(req.user.id, postId);
    this.setStatus(result.statusCode);
    return result.data!; 
  }

  // 2. 참가 신청 취소 API
  @Security("jwt")
  @Delete("applications/{applicationId}")
  public async cancel(@Path() applicationId: number, @Request() req: any): Promise<InteractionMessageResDto> {
    const result = await this.interactionService.cancelApplication(req.user.id, applicationId);
    this.setStatus(result.statusCode);
    return result.data!;
  }

  // 3. 참가 신청 승낙 및 거절 API
  @Security("jwt")
  @Patch("applications/{applicationId}")
  public async handle(
    @Path() applicationId: number, 
    @Body() body: HandleApplicationReqDto, 
    @Request() req: any
  ): Promise<InteractionMessageResDto> {
    const result = await this.interactionService.handleApplication(req.user.id, applicationId, body.isAccepted);
    this.setStatus(result.statusCode);
    return result.data!;
  }

  // 4. 좋아요 등록 및 취소 토글 API
  @Security("jwt")
  @Post("{postId}/likes")
  public async toggleLike(@Path() postId: number, @Request() req: any): Promise<ToggleLikeResDto> {
    const result = await this.interactionService.toggleLike(req.user.id, postId);
    this.setStatus(result.statusCode);
    return result.data!;
  }
}