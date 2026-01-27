import { Controller, Post, Get, Body, Query, Route, Tags, SuccessResponse, Response, Security, Middlewares, Request } from "tsoa";
import { injectable, inject } from "tsyringe";

import { FeedbackCreateReqDto } from "../dtos/feedback.req.dto";
import { FeedbackCreateResDto, FeedbackListResDto } from "../dtos/feedback.res.dto";
import { FeedbackService } from "../services/feedback.service";
import { validationMiddleware } from "../../../common/middlewares/validation";
import { Result, BadRequestError, NotFoundError, ConflictError, InternalServerError } from "../../../common/types/result.type";

@Route("feedbacks")
@Tags("Feedback")
@injectable()
export class FeedbackController extends Controller {
  constructor(
    @inject(FeedbackService) private feedbackService: FeedbackService
  ) {
    super();
  }

  @SuccessResponse("201", "Created")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<NotFoundError>(404, "Not Found")
  @Response<ConflictError>(409, "Conflict")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Middlewares(validationMiddleware(FeedbackCreateReqDto))
  @Post("/")
  public async createFeedback(
    @Body() requestBody: FeedbackCreateReqDto,
    @Request() req: any,
  ): Promise<Result<FeedbackCreateResDto>> {
    const userId = BigInt(req.user.id);
    const result = await this.feedbackService.createFeedback(userId, requestBody);
    
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Security("jwt")
  @Get("/mypage")
  public async getMyFeedbacks(
    @Request() req: any,
    @Query() cursor?: string,
    @Query() size?: number,
  ): Promise<Result<FeedbackListResDto>> {
    const userId = BigInt(req.user.id);
    const pageSize = size || 15;
    const result = await this.feedbackService.getFeedbacksMyPage(userId, cursor, pageSize);
    
    this.setStatus(result.statusCode);
    return result;
  }
}
