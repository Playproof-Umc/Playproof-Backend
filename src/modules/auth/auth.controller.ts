import { Controller, Post, Body, Route, SuccessResponse, Middlewares, Tags, Response } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AuthService } from "./auth.service";
import { SignUpReqDto, LoginReqDto } from "./dtos/auth.req.dto";
import { SignUpResDto, LoginResDto } from "./dtos/auth.res.dto"
import { Result, BadRequestError, ConflictError, InternalServerError } from "../../common/types/result.type";
import { validationMiddleware } from "../../common/middlewares/validation";

@injectable()
@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  constructor(@inject(AuthService) private authService: AuthService) {
    super();
  }

  @SuccessResponse("201", "Created")
  @Response<BadRequestError>(400, "Bad Request") 
  @Response<ConflictError>(409, "Conflict")
  @Response<InternalServerError>(500, "Internal Server Error")
  @Middlewares(validationMiddleware(SignUpReqDto))
  @Post("/signup")
  public async signUp(@Body() body: SignUpReqDto): Promise<Result<SignUpResDto>> {
    const result = await this.authService.signUp(body);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
	@Response<BadRequestError>(400, "Bad Request") 
  @Response<InternalServerError>(500, "Internal Server Error")
  @Middlewares(validationMiddleware(LoginReqDto))
  @Post("/login")
  public async login(@Body() body: LoginReqDto): Promise<Result<LoginResDto>> {
    const result = await this.authService.login(body);
    this.setStatus(result.statusCode);
    return result;
  }
}