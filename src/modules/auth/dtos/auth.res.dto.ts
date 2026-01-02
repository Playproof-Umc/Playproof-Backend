// src/modules/auth/dtos/auth.res.dto.ts
export class SignUpResDto {
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

export class LoginResDto {
  /**
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  accessToken!: string;
}