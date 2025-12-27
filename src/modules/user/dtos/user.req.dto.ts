import { IsEmail, IsPhoneNumber, IsString, MinLength } from "class-validator";

export class UserSignUpReqDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsPhoneNumber("KR")
  phoneNumber!: string;
  // 혹은 010-0000-0000 형태로 하고싶다면 아래처럼 !
  //   @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
  //   message: '전화번호 형식이 올바르지 않습니다',
  // })
  // phoneNumber!: string;
}
