import "reflect-metadata";
import { BanService } from "../services/ban.service";
import { BanRepository } from "../repositories/ban.repository";
import { UserRepository } from "../../user/user.repository";
import { CreateBanReqDto } from "../dtos/ban.req.dto";
import { isSuccess } from "../../../common/types/result.type";
import { BanErrorCode } from "../../../common/constants/error-code";
import { UserErrorCode } from "../../../common/constants/error-code";

describe("BanService", () => {
  let banService: BanService;
  let banRepository: jest.Mocked<BanRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    banRepository = {
      createBan: jest.fn(),
    } as any;

    userRepository = {
      findById: jest.fn(),
    } as any;

    banService = new BanService(banRepository, userRepository);

    jest.clearAllMocks();
  });

  describe("createBan", () => {
    const validDto: CreateBanReqDto = {
      userId: 1,
      targetId: 2,
    };

    it("자기 자신을 차단하려고 하면 400 에러를 반환해야 한다", async () => {
      const dto: CreateBanReqDto = {
        userId: 1,
        targetId: 1,
      };

      const result = await banService.createBan(dto);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(400);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(BanErrorCode.BAD_REQUEST.SELF_BAN_NOT_ALLOWED);
      }

      expect(userRepository.findById).not.toHaveBeenCalled();
      expect(banRepository.createBan).not.toHaveBeenCalled();
    });

    it("존재하지 않는 사용자를 차단하려고 하면 404 에러를 반환해야 한다", async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await banService.createBan(validDto);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      if (!isSuccess(result)) {
        expect(result.error.code).toBe(BanErrorCode.NOT_FOUND.TARGET_USER_NOT_FOUND);
      }

      expect(userRepository.findById).toHaveBeenCalledWith(validDto.targetId);
      expect(banRepository.createBan).not.toHaveBeenCalled();
    });

    it("정상적인 경우 차단을 생성하고 201을 반환해야 한다", async () => {
      userRepository.findById.mockResolvedValue({
        id: BigInt(2),
        nickname: "target_user",
      } as any);

      const mockBanResult = {
        id: 1,
        userId: 1,
        targetId: 2,
        banAt: new Date("2026-02-10T00:00:00.000Z"),
      };

      banRepository.createBan.mockResolvedValue(mockBanResult);

      const result = await banService.createBan(validDto);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data).toEqual(mockBanResult);
      }

      expect(userRepository.findById).toHaveBeenCalledWith(validDto.targetId);
      expect(banRepository.createBan).toHaveBeenCalledWith(validDto);
    });

    it("Repository에서 에러 발생 시 에러를 전파해야 한다", async () => {
      userRepository.findById.mockResolvedValue({
        id: BigInt(2),
        nickname: "target_user",
      } as any);

      banRepository.createBan.mockRejectedValue(new Error("Database Connection Error"));

      await expect(banService.createBan(validDto))
        .rejects.toThrow("Database Connection Error");

      expect(userRepository.findById).toHaveBeenCalledWith(validDto.targetId);
      expect(banRepository.createBan).toHaveBeenCalledWith(validDto);
    });
  });
});