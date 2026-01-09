import { Controller, Post, Body, Route, Tags, SuccessResponse, Response, Get, Path, Security, Middlewares, Request } from "tsoa";
import { injectable, inject } from "tsyringe";
import { PartyService } from "../service/party.service";
import { Result } from "../../../common/types/result.type";
import { PartyCreateResDto, PartyGetResDto } from "../dtos/party.res.dto";
import { PartyCreateReqDto } from "../dtos/party.req.dto";
import { validationMiddleware } from "../../../common/middlewares/validation";

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
  @Middlewares(validationMiddleware(PartyCreateReqDto))
  @Post("/")
  public async createParty(
    @Body() requestBody: PartyCreateReqDto,
    @Request() req: any,
  ): Promise<Result<PartyCreateResDto>> {
    const userId = req.user.id;
    const result = await this.partyService.createParty( requestBody, userId );
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Get("{id}")
  public async getParty(
    @Path() id: number
  ): Promise<Result<PartyGetResDto>> {
    const result = await this.partyService.getParty(id);
    this.setStatus(result.statusCode);
    return result;
  }
}

