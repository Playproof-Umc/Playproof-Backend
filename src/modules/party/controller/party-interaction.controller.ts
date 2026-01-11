import { injectable } from "tsyringe";
import { Controller, Post, Patch, Delete, Path, Body, Request, Route, Tags, Security } from "tsoa";
import { PartyInteractionService } from "../service/party-interaction.service";
import { Result } from "../../../common/types/result.type";
import { ApplyPartyResDto, HandleApplicationResDto, ToggleLikeResDto, InteractionMessageResDto } from "../dtos/party-interaction.res.dto";
import { HandleApplicationReqDto } from "../dtos/party-interaction.req.dto";

@injectable()
@Route('parties')
@Tags('Party Interaction')
export class PartyInteractionController extends Controller {
  constructor(private readonly partyInteractionService: PartyInteractionService) {
    super();
  }

  // 1. 파티 참가 신청 API
  @Post('{postId}/applications')
  @Security("jwt")
  public async applyParty(
    @Request() request: any,
    @Path() postId: number
  ): Promise<Result<ApplyPartyResDto>> {
    const result = await this.partyInteractionService.applyParty(request.user.id, postId);
    this.setStatus(result.statusCode);
    return result;
  }

  // 2. 파티 신청 수락/거절 API
  @Patch('applications/{applicationId}')
  @Security("jwt")
  public async handleApplication(
    @Request() request: any,
    @Path() applicationId: number,
    @Body() body: HandleApplicationReqDto
  ): Promise<Result<HandleApplicationResDto>> {
    const result = await this.partyInteractionService.handleApplication(request.user.id, applicationId, body.isAccepted);
    this.setStatus(result.statusCode);
    return result;
  }

  // 3. 파티 좋아요 토글 API
  @Post('{postId}/likes')
  @Security("jwt")
  public async toggleLike(
    @Request() request: any,
    @Path() postId: number
  ): Promise<Result<ToggleLikeResDto>> {
    const result = await this.partyInteractionService.toggleLike(request.user.id, postId);
    this.setStatus(result.statusCode);
    return result;
  }

  // 4. 파티 참가 신청 취소 API
  @Delete('applications/{applicationId}')
  @Security("jwt")
  public async cancelApplication(
    @Request() request: any,
    @Path() applicationId: number
  ): Promise<Result<InteractionMessageResDto>> {
    const result = await this.partyInteractionService.cancelApplication(request.user.id, applicationId);
    this.setStatus(result.statusCode);
    return result;
  }
}