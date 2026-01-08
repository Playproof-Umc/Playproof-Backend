// src/modules/user/dtos/user.req.dto.ts
export class UserSignUpResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phone!: string | null;

  /**
   * @example "홍길동"
   */
  nickname!: string | null;
}

export class UserUpdateResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phone!: string | null;

  /**
   * @example "이순신"
   */
  nickname!: string | null;
}

export class UserGetResDto {
  /** 
   * @example 1
   */
  id!: number;

  /**
   * @example "010-1234-5678"
   */
  phone!: string | null;

  /**
   * @example "홍길동"
   */
  nickname!: string | null;
}