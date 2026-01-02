// src/modules/user/dtos/user.req.dto.ts
export class UserSignUpResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phoneNumber!: string;

  /**
   * @example "홍길동"
   */
  name!: string;
}

export class UserUpdateResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phoneNumber!: string;

  /**
   * @example "이순신"
   */
  name!: string;
}

export class UserGetResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phoneNumber!: string;

  /**
   * @example "홍길동"
   */
  name!: string;
}