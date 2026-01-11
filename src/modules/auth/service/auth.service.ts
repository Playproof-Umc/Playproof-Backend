import { injectable, inject } from "tsyringe";
import bcrypt from "bcrypt";
import * as jose from "jose";
import { UserRepository } from "../../user/user.repository";
import { SignUpReqDto, LoginReqDto, SendCertificationReqDto} from "../dtos/auth.req.dto";
import { SignUpResDto, LoginResDto, SendCertificationResDto } from "../dtos/auth.res.dto"
import { Result, created, ok, unauthorized, conflict, isSuccess } from "../../../common/types/result.type";
import { UserErrorCode } from "../../../common/constants/error-code"
import { sendVerificationSms } from "../../../common/utils/sms";

@injectable()
export class AuthService {
  private readonly SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_fallback_secret_key");

  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async signUp(dto: SignUpReqDto): Promise<Result<SignUpResDto>> {
    const isPhoneExists = await this.userRepository.findByPhoneNumber(dto.phone);
    if (isPhoneExists) {
      return conflict({ message: "이미 가입된 번호입니다.", 
        errorCode: UserErrorCode.DUPLICATE_PHONE_NUMBER, 
        errors: [
          { field: "phone", value: dto.phone, reason: "이미 사용 중인 전화번호입니다." }
        ] });
    }
    const isNameExists = await this.userRepository.findByName(dto.nickname)
    if (isNameExists) {
      return conflict( {
        message: "이미 가입된 이름입니다.",
        errorCode: UserErrorCode.DUPLICATE_NAME,
        errors: [
          { field: "nickname", value: dto.nickname, reason: "이미 사용 중인 닉네임입니다." }
        ]
      })
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.userRepository.createUser({
      ...dto,
      password: hashedPassword,
    });

    return created({ 
      id: Number(newUser.id), 
      nickname: newUser.nickname, 
			phone: newUser.phone
		});
  }

  async login(dto: LoginReqDto): Promise<Result<LoginResDto>> {
    const user = await this.userRepository.findByPhoneNumber(dto.phone);

    if (!user || !(await bcrypt.compare(dto.password, user.password!))) {
      return unauthorized({ 
        message: "전화번호 또는 비밀번호가 일치하지 않습니다.", 
        errorCode: "AUTH_FAILED" 
      });
    }

    const accessToken = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h") // 2시간 후 만료
      .sign(this.SECRET);

    return ok({ accessToken });
  }

  async sendCertification(dto: SendCertificationReqDto): Promise<Result<SendCertificationResDto>> {
    // 전화번호 중복 확인
    const isPhoneExists = await this.userRepository.findByPhoneNumber(dto.phone);
    if (isPhoneExists) {
      return conflict({ message: "이미 가입된 번호입니다.", 
        errorCode: UserErrorCode.DUPLICATE_PHONE_NUMBER, 
        errors: [
          { field: "phone", value: dto.phone, reason: "이미 사용 중인 전화번호입니다." }
        ] });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Redis 저장 (코드 생략)
    // await this.redisClient.set(...)

    const smsResult = await sendVerificationSms(dto.phone, code);

    if (!isSuccess(smsResult)) {
      return smsResult; 
    }

    return ok({ status: "OK" });
  }
}