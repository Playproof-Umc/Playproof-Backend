import { injectable, inject } from "tsyringe";
import bcrypt from "bcrypt";
import * as jose from "jose";
import { UserRepository } from "../user/user.repository";
import { SignUpReqDto, LoginReqDto } from "./dtos/auth.req.dto";
import { SignUpResDto, LoginResDto } from "./dtos/auth.res.dto"
import { Result, created, ok, unauthorized, conflict } from "../../common/types/result.type";

@injectable()
export class AuthService {
  private readonly SECRET = new TextEncoder().encode("your_very_secure_secret_key_12345");

  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async signUp(dto: SignUpReqDto): Promise<Result<SignUpResDto>> {
    const exists = await this.userRepository.findByPhoneNumber(dto.phoneNumber);
    if (exists) {
      return conflict({ message: "이미 가입된 번호입니다.", errorCode: "DUPLICATE_PHONE" });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.userRepository.createUser({
      ...dto,
      password: hashedPassword,
    });

    return created({ 
      id: newUser.id, 
      name: newUser.name, 
			phoneNumber: newUser.phoneNumber
		});
  }

  async login(dto: LoginReqDto): Promise<Result<LoginResDto>> {
    const user = await this.userRepository.findByPhoneNumber(dto.phoneNumber);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
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
}