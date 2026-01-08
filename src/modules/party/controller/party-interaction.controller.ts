import { Controller, Post, Route, Tags, SuccessResponse, Path, Security, Request } from "tsoa";
import { injectable, inject } from "tsyringe";
import { PartyInteractionService } from "../service/party-interaction.service";
import { Result } from "../../../common/types/result.type";

@Route("parties")
@Tags("Party")
@injectable()
export class PartyInteractionController extends Controller {
  constructor(
    @inject(PartyInteractionService) private interactionService: PartyInteractionService
  ) {
    super();
  }

  @SuccessResponse("200", "OK")
  @Security("jwt")
  @Post("{id}/like")
  public async likeParty(
    @Path() id: number,
    @Request() req: any
  ): Promise<Result<void>> {
    const userId = req.user.id;
    const result = await this.interactionService.likeParty(id, userId);
    this.setStatus(result.statusCode);
    return result;
  }
}

