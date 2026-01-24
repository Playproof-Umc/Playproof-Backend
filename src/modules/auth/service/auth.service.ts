// src/modules/auth/service/auth.service.ts
import { injectable, inject } from "tsyringe";
import * as jose from "jose";
import { UserRepository } from "../../user/user.repository";
import { SignUpReqDto, LoginReqDto, SendCertificationReqDto, VerifyCertificationReqDto} from "../dtos/auth.req.dto";
import { SignUpResDto, LoginResDto, SendCertificationResDto, VerifyCertificationResDto } from "../dtos/auth.res.dto"
import { Result, created, ok, unauthorized, conflict, isSuccess, badRequest, success} from "../../../common/types/result.type";
import { ResultChain } from "../../../common/types/result.chain";
import { sendVerificationSms } from "../../../common/utils/sms.util";
import { redisClient } from "../../../common/config/database";
import { SmsErrorCode } from "../../../common/constants/error-code";
import { checkPhoneNumberDuplicate, checkNicknameDuplicate } from "../utils/auth.validator";
import { REDIS_PREFIX } from "../../../common/constants/redis.const";
import { smsConfig } from "../../../common/config/sms";
import { authConfig } from "../../../common/config/auth";
import { hashPassword, comparePassword } from "../../../common/utils/password.util";

@injectable()
export class AuthService {
  private readonly SECRET = new TextEncoder().encode(authConfig.jwtSecret);

  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async signUp(dto: SignUpReqDto): Promise<Result<SignUpResDto>> {
    
    // 중복 검증
    const check = await ResultChain.of(dto)
      .flatThenAsync(checkPhoneNumberDuplicate(this.userRepository))
      .flatThenAsync(checkNicknameDuplicate(this.userRepository))
      .getResult();

    if(!isSuccess(check)) return check;

    /*
    // 전화번호 중복 검증
    const phoneDuplicateError = await checkPhoneNumberDuplicate<SignUpResDto>(this.userRepository, dto.phone);
    if (phoneDuplicateError) return phoneDuplicateError;
    
    // 닉네임 중복 검증
    const nicknameDuplicateError = await checkNicknameDuplicate<SignUpResDto>(this.userRepository, dto.nickname);
    if (nicknameDuplicateError) return nicknameDuplicateError;
    */

    // 비밀번호 해쉬
    const hashedPasswordResult = await hashPassword(dto.password)
    if(!isSuccess(hashedPasswordResult)) return hashedPasswordResult;
    const hashedPassword = hashedPasswordResult.data;

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

    // 비밀번호 일치 여부 확인 및 유저 존재 여부 확인
    const comparePasswordResult = user ? await comparePassword(dto.password, user.password!) : ok(false);
    if(!isSuccess(comparePasswordResult)) return comparePasswordResult;
    if (!user || !comparePasswordResult.data) {
      return unauthorized({ 
        message: "전화번호 또는 비밀번호가 일치하지 않습니다.", 
        errorCode: "AUTH_FAILED" 
      });
    }

    const accessToken = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: authConfig.jwtAlgorithm })
      .setIssuedAt()
      .setExpirationTime(authConfig.jwtExpiration)
      .sign(this.SECRET);

    return ok({ accessToken });
  }

  async sendCertification(dto: SendCertificationReqDto): Promise<Result<SendCertificationResDto>> {
    // 전화번호 중복 검증
    const check = await ResultChain.of(dto)
      .flatThenAsync(checkPhoneNumberDuplicate(this.userRepository))
      .getResult();
      
    if(!isSuccess(check)) return check;

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 레디스 저장
    await redisClient.set(`${REDIS_PREFIX.SMS}${dto.phone}`, code, { 
      EX: smsConfig.verificationTTL 
    });

    // SMS 발송
    const smsResult = await sendVerificationSms(dto.phone, code);

    // SMS 발송 실패 시 레디스에서 코드 삭제 및 에러 객체 반환
    if (!isSuccess(smsResult)) {
      await redisClient.del(`sms:${dto.phone}`);
      return smsResult; 
    }

    return ok({ status: "OK" });
  }

  async verifyCertification(dto: VerifyCertificationReqDto): Promise<Result<VerifyCertificationResDto>> {
    const key = `sms:${dto.phone}`;
    
    // 인증번호 가져오기
    const storedCode = await redisClient.get(key);

    // error: 데이터가 없는 경우
    if (!storedCode) {
      return badRequest({ 
        message: "인증 시간이 만료되었거나 인증 코드가 존재하지 않습니다.", 
        errorCode: SmsErrorCode.CERTIFICATION_EXPIRED,
        errors: [
          { field: "code", value: dto.code, reason: "만료되거나 존재하지 않는 인증 코드입니다." }
        ] 
      });
    }

    // error: 인증번호 불일치
    if (storedCode !== dto.code) {
      return badRequest({ 
        message: "인증 번호가 일치하지 않습니다.", 
        errorCode: SmsErrorCode.CERTIFICATION_MISMATCH,
        errors: [
          { field: "code", value: dto.code, reason: "인증 코드가 일치하지 않습니다." }
        ] 
      });
    }

    // 성공시, 인증 데이터 삭제
    await redisClient.del(key);

    return ok({ status: "VERIFIED" });
  }
}