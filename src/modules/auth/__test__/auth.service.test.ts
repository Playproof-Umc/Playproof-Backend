import "reflect-metadata"; 
import { AuthService } from "../service/auth.service";
import { UserRepository } from "../../user/user.repository";
import { SendCertificationReqDto } from "../dtos/auth.req.dto";
import { isSuccess, ok, internalServerError } from "../../../common/types/result.type";

const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();
jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock_token"),
  })),
}));

jest.mock("../../../common/config/database", () => ({
  redisClient: {
    set: (key: string, value: string, option: any) => mockRedisSet(key, value, option),
    del: (key: string) => mockRedisDel(key),
  },
}));

const mockSendVerificationSms = jest.fn();
jest.mock("../../../common/utils/sms", () => ({
  sendVerificationSms: (phone: string, code: string) => mockSendVerificationSms(phone, code),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      findByPhoneNumber: jest.fn(),
      findByName: jest.fn(),
      createUser: jest.fn(),
    } as any;

    authService = new AuthService(userRepository);

    jest.clearAllMocks();
  });

  describe("sendCertification", () => {
    const dto: SendCertificationReqDto = { phone: "010-1234-5678" };

    // 이미 가입된 전화번호 테스트
    it("이미 가입된 전화번호라면 409 Conflict 에러를 반환해야 한다", async () => {
      // Given: 이미 유저가 존재함
      userRepository.findByPhoneNumber.mockResolvedValue({ id: BigInt(1) } as any);

      // When
      const result = await authService.sendCertification(dto);

      // Then
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
      
      // Redis 저장이나 SMS 발송이 호출되지 않아야 함
      expect(mockRedisSet).not.toHaveBeenCalled();
      expect(mockSendVerificationSms).not.toHaveBeenCalled();
    });

    // 정상 케이스 테스트
    it("정상적인 경우 Redis에 저장하고 SMS를 발송한 뒤 200 OK를 반환해야 한다", async () => {
      // Given: 유저 없음 (신규 가입 가능)
      userRepository.findByPhoneNumber.mockResolvedValue(null);
      
      // SMS 발송 성공 모킹
      mockSendVerificationSms.mockResolvedValue(ok(true));

      // When
      const result = await authService.sendCertification(dto);

      // Then
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);

      // Redis 저장 검증
      expect(mockRedisSet).toHaveBeenCalledWith(
        `sms:${dto.phone}`, 
        expect.any(String), 
        { EX: 300 }
      );

      // SMS 발송 호출 검증
      expect(mockSendVerificationSms).toHaveBeenCalledWith(
        dto.phone, 
        expect.any(String)
      );
    });
    
    // 롤백 테스트
    it("SMS 발송 실패 시(500 에러), Redis 데이터를 삭제하고 에러를 반환해야 한다 (롤백 테스트)", async () => {
      // Given: 유저 없음
      userRepository.findByPhoneNumber.mockResolvedValue(null);

      // SMS 발송 실패
      mockSendVerificationSms.mockResolvedValue(
        internalServerError({ message: "SMS 전송 실패", errorCode: "SMS_FAIL", errors: [] })
      );

      // When
      const result = await authService.sendCertification(dto);

      // Then
      expect(isSuccess(result)).toBe(false); 
      expect(result.statusCode).toBe(500);   

      //Redis 저장 환인
      expect(mockRedisSet).toHaveBeenCalled();

      //실패시 Redis 삭제
      expect(mockRedisDel).toHaveBeenCalledWith(`sms:${dto.phone}`);
    });
  });
});