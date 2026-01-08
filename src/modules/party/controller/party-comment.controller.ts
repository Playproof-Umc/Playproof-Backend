import { Controller, Post, Body, Route, Tags, SuccessResponse, Path, Security } from "tsoa";
import { injectable, inject } from "tsyringe";
import { PartyCommentService } from "../service/party-comment.service";
import { Result } from "../../../common/types/result.type";

@Route("parties/comment")
@Tags("Party Comment")
@injectable()
export class PartyCommentController extends Controller {
  constructor(
    @inject(PartyCommentService) private commentService: PartyCommentService
  ) {
    super();
  }

  @SuccessResponse("201", "Created")
  @Security("jwt")
  @Post("{id}")
  public async addComment(
    @Path() id: number,
    @Body() body: { content: string }
  ): Promise<Result<void>> {
    const result = await this.commentService.addComment(id, body.content);
    this.setStatus(result.statusCode);
    return result;
  }
}

