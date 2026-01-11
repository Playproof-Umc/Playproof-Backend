// src/modules/auth/dtos/auth.res.dto.ts
export class SignUpResDto {
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

export class LoginResDto {
  /**
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  accessToken!: string;
}

export class SendCertificationResDto {
  /**
   * @example "OK"
   */
  status!: string;
}

export class VerifyCertificationResDto {
  /**
   * @example "VERIFIED"
   */
  status!: string;
}