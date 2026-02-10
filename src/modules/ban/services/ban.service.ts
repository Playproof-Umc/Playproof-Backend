// src/modules/ban/services/ban.service.ts

import { inject, injectable } from "tsyringe";
import { BanRepository } from "../repositories/ban.repository";
import { CreateBanReqDto } from "../dtos/ban.req.dto";
import { CreateBanResDto } from "../dtos/ban.res.dto";
import { created } from "../../../common/types/result.type";
import { checkSameUser, checkTargetUserExists } from "../utills/ban.validator";
import { ResultChain } from "../../../common/types/result.chain";
import { UserRepository } from "../../../modules/user/user.repository";
import { Result } from "../../../common/types/result.type";

@injectable()
export class BanService {
  constructor(
    @inject(BanRepository) private banRepository: BanRepository,
    @inject(UserRepository) private userRepository: UserRepository
  ) {}

  async createBan(dto: CreateBanReqDto): Promise<Result<CreateBanResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkSameUser())
      .flatThenAsync(checkTargetUserExists(this.userRepository))
      .flatThenAsync(async (data) => {
        const result = await this.banRepository.createBan(data);
        return created(result);
      })
      .getResult();
  }
}