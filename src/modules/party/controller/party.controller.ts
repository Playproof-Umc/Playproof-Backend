import { Controller, Post, Body, Route, Tags, SuccessResponse, Response, Get, Path, Security } from "tsoa";
import { injectable, inject } from "tsyringe";
import { PartyService } from "../service/party.service";
import { Result } from "../../../common/types/result.type";

@Route("parties")
@Tags("Party")
@injectable()
export class PartyController extends Controller {
  constructor(
    @inject(PartyService) private partyService: PartyService
  ) {
    super();
  }

  @SuccessResponse("201", "Created")
  @Security("jwt")
  @Post("/")
  public async createParty(
    @Body() requestBody: any
  ): Promise<Result<void>> {
    const result = await this.partyService.createParty(requestBody);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Get("{id}")
  public async getParty(
    @Path() id: number
  ): Promise<Result<any>> {
    const result = await this.partyService.getParty(id);
    this.setStatus(result.statusCode);
    return result;
  }
}

