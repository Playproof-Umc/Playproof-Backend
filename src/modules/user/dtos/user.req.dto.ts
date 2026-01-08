// src/modules/user/dtos/user.req.dto.ts
import { Type } from "class-transformer";
import { IsEmail, IsNumber, isNumber, IsPhoneNumber, IsString, MinLength } from "class-validator";

export class UserUpdateReqDto {
  /**
   * @example "strongpassword"
   */
  @IsString()
  password!: string;

  /**
   * @example "이순신"
   */
  @IsString()
  @MinLength(2)
  nickname!: string;

  /**
   * @example "010-1234-5678"
   */
  @IsPhoneNumber("KR")
  phone!: string;
  // 혹은 010-0000-0000 형태로 하고싶다면 아래처럼 !
  //   @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
  //   message: '전화번호 형식이 올바르지 않습니다',
  // })
  // phoneNumber!: string;
}


