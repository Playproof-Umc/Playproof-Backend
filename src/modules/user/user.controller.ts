import {
  Controller,
  Post,
  Body,
  Route,
  Tags,
  SuccessResponse,
  Response,
  Get,
  Query,
  Queries,
  Middlewares,
  Request,
  Security,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { UserService } from './user.service';
import { AddGameAccountReqDto, UserUpdateReqDto } from './dtos/user.req.dto';
import {
  UserSignUpResDto,
  UserUpdateResDto,
  UserGetResDto,
  UserFeedbackListResDto,
  AddGameAccountResDto,
} from './dtos/user.res.dto';
import {
  Result,
  BadRequestError,
  ConflictError,
  InternalServerError,
} from '../../common/types/result.type';
import { User } from '@prisma/client';
import { get } from 'node:http';
import { validationMiddleware } from '../../common/middlewares/validation';

@Route('users')
@Tags('User')
@injectable()
export class UserController extends Controller {
  constructor(@inject(UserService) private userService: UserService) {
    super();
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Get('/')
  public async getUserProfile(
    @Query() userId: number,
  ): Promise<Result<UserGetResDto>> {
    const result = await this.userService.getUserById(userId);

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Get('/me')
  public async getMyProfile(
    @Request() req: any,
  ): Promise<Result<UserGetResDto>> {
    const userId = req.user.id;
    const result = await this.userService.getUserById(userId);

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Get('/me/feedbacks')
  public async getMyFeedbacks(
    @Request() req: any,
    @Query() cursor?: number,
    @Query() limit: number = 10,
  ): Promise<Result<UserFeedbackListResDto>> {
    const userId = req.user.id;
    const result = await this.userService.getUserFeedbacks(
      userId,
      cursor ?? null,
      limit,
    );

    this.setStatus(result.statusCode);

    return result;
  }

  @SuccessResponse('201', 'Created')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Middlewares(validationMiddleware(AddGameAccountReqDto))
  @Post('/me/game-accounts')
  public async updateMyGameAccounts(
    @Request() req: any,
    @Body() body: AddGameAccountReqDto,
  ): Promise<Result<AddGameAccountResDto>> {
    const userId = req.user.id;
    const result = await this.userService.addGameAccount(userId, body);
    this.setStatus(result.statusCode);
    return result;
  }
}