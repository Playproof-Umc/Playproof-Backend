// src/modules/auth/service/auth.service.ts
import { injectable, inject } from "tsyringe";
import * as jose from "jose";
import { UserRepository } from "../../user/user.repository";
import { SignUpReqDto, LoginReqDto, SendCertificationReqDto, VerifyCertificationReqDto, VerifiyDuplicateNicknameReqDto, RefreshTokenReqDto } from "../dtos/auth.req.dto";
import { SignUpResDto, LoginResDto, SendCertificationResDto, VerifyCertificationResDto, VerifiyDuplicateNicknameResDto, RefreshTokenResDto } from "../dtos/auth.res.dto"
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


interface SmsValidateCodeData{
  storedCode: string | null,
  userCode: string,
  key: string
}

@injectable()
export class AuthService {
  private readonly SECRET = new TextEncoder().encode(authConfig.jwtSecret);

  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async signUp(dto: SignUpReqDto): Promise<Result<SignUpResDto>> {
    return await ResultChain.of(dto)
    .flatThenAsync(checkPhoneNumberDuplicate(this.userRepository))
    .flatThenAsync(checkNicknameDuplicate(this.userRepository))
    .flatThenAsync((dto) => this.hashPasswordStep(dto))
    .flatThenAsync((dto) => this.createUserStep(dto))
    .flatThen((user) => Promise.resolve(created(this.toSignUpResponse(user))))
    .getResult();
  }

  private async hashPasswordStep(dto: SignUpReqDto): Promise<Result<SignUpReqDto>> {
    const hashResult = await hashPassword(dto.password);
    if (!isSuccess(hashResult)) return hashResult;

    return success({ ...dto, password: hashResult.data });
  }
  private async createUserStep(dto: SignUpReqDto) { 
    const newUser = await this.userRepository.createUser(dto);
    return success(newUser);
  }
  private toSignUpResponse(user: any): SignUpResDto {
    return {
      id: Number(user.id),
      nickname: user.nickname,
      phone: user.phone,
    };
  }
  
  async login(dto: LoginReqDto): Promise<Result<LoginResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync((dto) => this.comparePasswordStep(dto))
      .flatThenAsync((user) => this.generateTokensStep(user))
      .flatThen((tokens) => Promise.resolve(ok(this.toLoginResponse(tokens))))
      .getResult();
  }

  private async comparePasswordStep(dto: LoginReqDto): Promise<Result<any>> {
    const user = await this.userRepository.findByPhoneNumber(dto.phone);
    const comparePasswordResult = user ? await comparePassword(dto.password, user.password!) : ok(false);
    if(!isSuccess(comparePasswordResult)) return comparePasswordResult;
    if (!user || !comparePasswordResult.data) {
      return unauthorized({ 
        message: "전화번호 또는 비밀번호가 일치하지 않습니다.", 
        errorCode: "AUTH_FAILED" 
      });
    }
    return success(user);
  }

  private async generateAccessTokenStep(user: any): Promise<Result<string>> {
    const accessToken = await new jose.SignJWT({ userId: user.id.toString() })
      .setProtectedHeader({ alg: authConfig.jwtAlgorithm })
      .setIssuedAt()
      .setExpirationTime(authConfig.jwtExpiration)
      .sign(this.SECRET);
    return success(accessToken);
  }

  private async generateRefreshTokenStep(user: any): Promise<Result<string>> {
    const refreshToken = await new jose.SignJWT({ userId: user.id.toString() })
      .setProtectedHeader({ alg: authConfig.jwtAlgorithm })
      .setIssuedAt()
      .setExpirationTime(authConfig.jwtRefreshExpiration)
      .sign(this.SECRET);
    return success(refreshToken);
  }

  private async storeRefreshTokenStep(userId: bigint, refreshToken: string): Promise<Result<boolean>> {
    const key = `${REDIS_PREFIX.REFRESH_TOKEN}${userId}`;
    await redisClient.set(key, refreshToken, { EX: authConfig.refreshTokenTTL });
    return success(true);
  }

  private async generateTokensStep(user: any): Promise<Result<{ accessToken: string; refreshToken: string }>> {
    const [accessResult, refreshResult] = await Promise.all([
      this.generateAccessTokenStep(user),
      this.generateRefreshTokenStep(user),
    ]);
    if (!isSuccess(accessResult)) return accessResult;
    if (!isSuccess(refreshResult)) return refreshResult;

    const storeResult = await this.storeRefreshTokenStep(user.id, refreshResult.data);
    if (!isSuccess(storeResult)) return storeResult;

    return success({ accessToken: accessResult.data, refreshToken: refreshResult.data });
  }

  private toLoginResponse(tokens: { accessToken: string; refreshToken: string }): LoginResDto {
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async refresh(dto: RefreshTokenReqDto): Promise<Result<RefreshTokenResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync((dto) => this.verifyRefreshTokenStep(dto.refreshToken))
      .flatThenAsync((userId) => this.validateStoredRefreshTokenStep(userId, dto.refreshToken))
      .flatThenAsync(async (userId) => {
        const user = await this.userRepository.findById(Number(userId));
        if (!user) return unauthorized({ message: "유저를 찾을 수 없습니다.", errorCode: "AUTH_REFRESH_FAILED" });
        return success(user);
      })
      .flatThenAsync((user) => this.generateTokensStep(user))
      .flatThenAsync((tokens) =>
        Promise.resolve(ok<RefreshTokenResDto>({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })),
      )
      .getResult();
  }

  private async verifyRefreshTokenStep(refreshToken: string): Promise<Result<bigint>> {
    try {
      const { payload } = await jose.jwtVerify(refreshToken, this.SECRET);
      const userId = payload.userId;
      if (userId === undefined || userId === null) {
        return unauthorized({ message: "유효하지 않은 리프레시 토큰입니다.", errorCode: "AUTH_REFRESH_FAILED" });
      }
      const userIdStr = typeof userId === "number" ? String(userId) : typeof userId === "string" ? userId : null;
      if (userIdStr === null) {
        return unauthorized({ message: "유효하지 않은 리프레시 토큰입니다.", errorCode: "AUTH_REFRESH_FAILED" });
      }
      return success(BigInt(userIdStr));
    } catch {
      return unauthorized({ message: "만료되었거나 유효하지 않은 리프레시 토큰입니다.", errorCode: "AUTH_REFRESH_FAILED" });
    }
  }

  private async validateStoredRefreshTokenStep(userId: bigint, refreshToken: string): Promise<Result<bigint>> {
    const key = `${REDIS_PREFIX.REFRESH_TOKEN}${userId}`;
    const storedToken = await redisClient.get(key);
    if (!storedToken || storedToken !== refreshToken) {
      return unauthorized({ message: "만료되었거나 유효하지 않은 리프레시 토큰입니다.", errorCode: "AUTH_REFRESH_FAILED" });
    }
    return success(userId);
  }

  async sendCertification(dto: SendCertificationReqDto): Promise<Result<SendCertificationResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkPhoneNumberDuplicate(this.userRepository))
      .flatThenAsync((dto) => this.storeVerificationCode(dto.phone))
      .flatThenAsync((dto) => sendVerificationSms(dto.phone, dto.code))
      .flatThen(() => Promise.resolve(ok(this.toSendSmsResponse())))
      .getResult();
  }
  
  private async storeVerificationCode(phone: string): Promise<Result<any>> {
    const code = await this.GenerateVerificationCode();
    await redisClient.set(`${REDIS_PREFIX.SMS}${phone}`, code, { EX: smsConfig.verificationTTL });
    return success({ phone, code });
  }

  private async GenerateVerificationCode(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  private toSendSmsResponse(): SendCertificationResDto {
    return { status: "OK" };
  }

  async verifyCertification(dto: VerifyCertificationReqDto): Promise<Result<VerifyCertificationResDto>> {

    return await ResultChain.of(dto)
    .flatThenAsync((dto) => this.fetchStoredCodeStep(dto))
    .flatThen((ctx) => Promise.resolve(this.validateCodeExpiration(ctx)))
    .flatThen((data) => Promise.resolve(this.validateCodeMatch(data)))
    .flatThenAsync((data) => this.deleteCodeStep(data))
    .flatThen(() => Promise.resolve(ok(this.toValidateCodeResponse())))
    .getResult();
  }

  private async fetchStoredCodeStep(dto: VerifyCertificationReqDto): Promise<Result<SmsValidateCodeData>> {
    const key = `${REDIS_PREFIX.SMS}${dto.phone}`;
    const storedCode = await redisClient.get(key);
    return success({ 
      storedCode,      
      userCode: dto.code, 
      key 
    });
  }

  private validateCodeExpiration(ctx: SmsValidateCodeData): Result<SmsValidateCodeData> {
    if (!ctx.storedCode) {
      return badRequest({ 
        message: "인증 시간이 만료되었거나 인증 코드가 존재하지 않습니다.", 
        errorCode: SmsErrorCode.CERTIFICATION_EXPIRED,
        errors: [
          { 
            field: "code", 
            value: ctx.userCode, 
            reason: "만료되거나 존재하지 않는 인증 코드입니다." 
          }
        ] 
      });
    }
    return success({
      storedCode: ctx.storedCode,
      userCode: ctx.userCode,
      key: ctx.key
    });
  }
  private validateCodeMatch(data: SmsValidateCodeData): Result<SmsValidateCodeData> {
    if (data.storedCode !== data.userCode) {
      return badRequest({ 
        message: "인증 번호가 일치하지 않습니다.", 
        errorCode: SmsErrorCode.CERTIFICATION_MISMATCH,
        errors: [
          { field: "code", value: data.userCode, reason: "인증 코드가 일치하지 않습니다." }
        ] 
      });
    }
    return success(data);
  }
  private async deleteCodeStep(data: SmsValidateCodeData): Promise<Result<boolean>> {
    await redisClient.del(data.key);
    return success(true)
  }

  private toValidateCodeResponse(): VerifyCertificationResDto {
    return { status: "VERIFIED" };
  }

    async verifyDuplicateNickname(dto: VerifiyDuplicateNicknameReqDto): Promise<Result<VerifiyDuplicateNicknameResDto>> {
    const existingUser = await this.userRepository.findByName(dto.nickname);
  
    const isDuplicate = !!existingUser; 

    return ok({ 
      isDuplicate 
    });
  }
}