// src/modules/auth/dtos/auth.req.dto.ts
import { IsString, IsNotEmpty, Matches, MinLength, IsPhoneNumber, IsArray, IsJSON, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { TermDto, GameInfoDto } from "./signup.req.dto";

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

/**
   * @example [
   * { "id": 1, "agree": true },
   * { "id": 2, "agree": true },
   * { "id": 3, "agree": false }
   * ]
   */
  @IsArray()
  @IsNotEmpty({ message: "약관 카테고리는 필수입니다."})
  @ValidateNested({ each: true }) 
  @Type(() => TermDto) 
  terms!: TermDto[];

  /**
   * @example { 
   * "gameId": 1,
   * "gameName": "League of Legends", 
   * "gameNickname": "honggildong123", 
   * "accountId": "example-account-id-12345", 
   * "playStyle": "manner", 
   * "positionId": "101", 
   * "tierId": "101" 
   * }
   */
  @IsNotEmpty({ message: "유저의 게임 정보는 필수입니다."})
  @ValidateNested({ each: true }) 
  @Type(() => GameInfoDto)
  gameInfo!: GameInfoDto;

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

export class VerifiyDuplicateNicknameReqDto {
  /**
   * @example "홍길동"
   */
  @IsString()
  @IsNotEmpty()
  nickname!: string;
}