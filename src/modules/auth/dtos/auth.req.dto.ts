// src/modules/auth/dtos/auth.req.dto.ts
import { IsString, IsNotEmpty, Matches, MinLength, IsPhoneNumber } from "class-validator";

export class SignUpReqDto {
	/**
   * @example "홍길동"
   */
  @IsString()
  @IsNotEmpty()
  name!: string;

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
  @IsPhoneNumber("KR")
  phoneNumber!: string;
}

export class LoginReqDto {
	/**
	 * @example "010-1234-5678"
	 */
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

	/**
	 * @example "strongpassword"
	 */
  @IsString()
  @IsNotEmpty()
  password!: string;
}