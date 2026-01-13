// src/modules/auth/dtos/auth.req.dto.ts
import { IsString, IsNotEmpty, Matches, MinLength, IsPhoneNumber } from "class-validator";

export class SignUpReqDto {
	/**
   * @example "홍길동"
   */
  @IsString()
  @IsNotEmpty({ message: "이름은 필수입니다."})
  nickname!: string;

	/**
   * @example "strongpassword"
   */
  @IsString()
  @MinLength(8, { message: "비밀번호는 최소 8자 이상이어야 합니다." })
  password!: string;

	/**
   * @example "010-1234-5678"
   */
  @IsString()
  @IsPhoneNumber("KR", { message: "형식에 맞지 않는 전화번호입니다. "})
  phone!: string;
}

export class LoginReqDto {
	/**
	 * @example "010-1234-5678"
	 */
  @IsString()
  @IsNotEmpty()
  phone!: string;

	/**
	 * @example "strongpassword"
	 */
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SendCertificationReqDto {
  /**
   * @example "010-1234-5678"
   */
  @IsString()
  @IsPhoneNumber("KR", { message: "형식에 맞지 않는 전화번호입니다. "})
  phone!: string;
}

export class VerifyCertificationReqDto {
  /**
   * @example "010-1234-5678"
   */
  @IsString()
  @IsPhoneNumber("KR", { message: "형식에 맞지 않는 전화번호입니다. "})
  phone!: string;

  /**
   * @example "123456"
   */
  @IsString()
  @Matches(/^\d{6}$/, { message: "인증 코드는 6자리 숫자여야 합니다." })
  code!: string;
}