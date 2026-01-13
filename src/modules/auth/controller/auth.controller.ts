import { Controller, Post, Body, Route, SuccessResponse, Middlewares, Tags, Response } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AuthService } from "../service/auth.service";
import { SignUpReqDto, LoginReqDto, SendCertificationReqDto, VerifyCertificationReqDto } from "../dtos/auth.req.dto";
import { SignUpResDto, LoginResDto, SendCertificationResDto, VerifyCertificationResDto } from "../dtos/auth.res.dto"
import { Result, BadRequestError, ConflictError, InternalServerError } from "../../../common/types/result.type";
import { validationMiddleware } from "../../../common/middlewares/validation";

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

  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request")
  @Response<BadRequestError>(409, "Conflict") 
  @Response<InternalServerError>(500, "Internal Server Error")
  @Middlewares(validationMiddleware(SendCertificationReqDto))
  @Post("/phone/send-certification")
  public async sendCertification(@Body() body: SendCertificationReqDto): Promise<Result<SendCertificationResDto>> {
    const result = await this.authService.sendCertification(body);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse("200", "OK")
  @Response<BadRequestError>(400, "Bad Request") 
  @Response<InternalServerError>(500, "Internal Server Error")
  @Middlewares(validationMiddleware(VerifyCertificationReqDto))
  @Post("/phone/validate")
  public async verifyCertification(@Body() body: VerifyCertificationReqDto): Promise<Result<VerifyCertificationResDto>> {
    const result = await this.authService.verifyCertification(body);
    this.setStatus(result.statusCode);
    return result;
  }
}