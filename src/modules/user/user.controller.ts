// src/modules/user/user.controller.ts
import { Controller, Post, Body, Route, Tags, SuccessResponse, Response } from "tsoa";
import { injectable, inject } from "tsyringe";
import { UserService } from "./user.service";
import { UserSignUpReqDto } from "./dtos/user.req.dto";
import { UserSignUpResDto } from "./dtos/user.res.dto"; 
import { Result, BadRequestError, ConflictError, InternalServerError } from "../../common/types/result.type";

@Route("users")
@Tags("User")
@injectable()
export class UserController extends Controller {
  constructor(@inject(UserService) private userService: UserService) {
    super();
  }

  @SuccessResponse("201", "Created") 
  @Response<BadRequestError>(400, "Bad Request") 
  @Response<ConflictError>(409, "Conflict")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Post("/signup")
  public async signUp(
    @Body() body: UserSignUpReqDto
  ): Promise<Result<UserSignUpResDto>> {
    
    const result = await this.userService.signUp(body);

    this.setStatus(result.statusCode);

    return result;
  }
}