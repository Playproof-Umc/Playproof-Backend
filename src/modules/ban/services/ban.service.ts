// src/modules/ban/services/ban.service.ts

import { inject, injectable } from 'tsyringe';
import { BanRepository, BanWithTarget } from '../repositories/ban.repository';
import { UserRepository } from '../../../modules/user/user.repository';
import { ResultChain } from '../../../common/types/result.chain';
import {
  Result,
  ok,
  created,
  success,
} from '../../../common/types/result.type';
import {
  CreateBanReqDto,
  GetBanListReqDto,
  DeleteBanReqDto,
  SearchBanReqDto,
} from '../dtos/ban.req.dto';
import {
  CreateBanResDto,
  GetBanListResDto,
  DeleteBanResDto,
  SearchBanResDto,
  BanItemResDto,
} from '../dtos/ban.res.dto';
import {
  checkSameUser,
  checkTargetUserExists,
  checkBanExists,
} from '../utills/ban.validator';
import { checkUserExists } from '../../user/utills/user.validator';

@injectable()
export class BanService {
  constructor(
    @inject(BanRepository) private banRepository: BanRepository,
    @inject(UserRepository) private userRepository: UserRepository,
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

  async getBanList(dto: GetBanListReqDto): Promise<Result<GetBanListResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkUserExists(this.userRepository))
      .flatThenAsync(async (data): Promise<Result<GetBanListResDto>> => {
        const bans = await this.banRepository.getBanList(data.userId);
        return ok({ bans: bans.map((ban) => this.toBanItemResDto(ban)) });
      })
      .getResult();
  }

  async deleteBan(dto: DeleteBanReqDto): Promise<Result<DeleteBanResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkUserExists(this.userRepository))
      .flatThenAsync(checkBanExists(this.banRepository))
      .flatThenAsync(async (data): Promise<Result<DeleteBanResDto>> => {
        await this.banRepository.deleteBan(data.userId, data.targetId);
        return ok({ message: '차단이 해제되었습니다.' });
      })
      .getResult();
  }

  async searchBan(dto: SearchBanReqDto): Promise<Result<SearchBanResDto>> {
    return await ResultChain.of(dto)
      .flatThenAsync(checkUserExists(this.userRepository))
      .flatThenAsync(async (data): Promise<Result<SearchBanResDto>> => {
        const bans = await this.banRepository.searchBanByNickname(
          data.userId,
          data.q,
        );
        return ok({ bans: bans.map((ban) => this.toBanItemResDto(ban)) });
      })
      .getResult();
  }

  private toBanItemResDto(ban: BanWithTarget): BanItemResDto {
    return {
      banId: Number(ban.id),
      targetUser: {
        userId: Number(ban.target.id),
        nickname: ban.target.nickname ?? '',
        statusMessage: ban.target.statusMessage ?? null,
        avatarUrl: ban.target.userAvatars[0]?.avatar.avatarUrl ?? null,
      },
      banAt: ban.banAt,
    };
  }
}