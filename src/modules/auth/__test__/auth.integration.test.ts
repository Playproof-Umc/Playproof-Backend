import "reflect-metadata";
import { AuthService } from "../service/auth.service";
import { UserRepository } from "../../user/user.repository";
import { redisClient } from "../../../common/config/database"; // 진짜 Redis 가져오기
import { ok } from "../../../common/types/result.type";

const mockSendVerificationSms = jest.fn();
jest.mock("../../../common/utils/sms.util", () => ({
  sendVerificationSms: (phone: string, code: string) => mockSendVerificationSms(phone, code),
}));

jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock_token"),
  })),
}));

// Integration Test with Real Redis
describe("AuthService Integration Test (Real Redis)", () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  beforeEach(() => {
    userRepository = {
      findByPhoneNumber: jest.fn(),
    } as any;

    authService = new AuthService(userRepository);
    jest.clearAllMocks();
  });
  // 실제 Redis에 인증번호 저장 테스트
  it("실제 Redis에 인증번호가 저장되어야 한다", async () => {
    // Given
    const phone = "010-9999-8888"; 
    userRepository.findByPhoneNumber.mockResolvedValue(null); // 신규 유저
    mockSendVerificationSms.mockResolvedValue(ok(true)); // SMS 성공

    // When
    await authService.sendCertification({ phone });

    // Then
    const savedCode = await redisClient.get(`sms:${phone}`);
    console.log("실제 Redis에서 가져온 값:", savedCode);

    expect(savedCode).toBeDefined();
    expect(savedCode?.length).toBe(6);
    
    await redisClient.del(`sms:${phone}`);
  });
});