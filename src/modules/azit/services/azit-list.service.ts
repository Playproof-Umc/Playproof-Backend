// src/modules/azit/services/azit-list.service.ts
import { injectable, inject } from "tsyringe";
import { AzitUserRepository } from "../repositories/azit-user.repository";
import { AzitListResDto } from "../dtos/azit.res.dto";
import { Result, ok } from "../../../common/types/result.type";

@injectable()
export class AzitListService {
  constructor(@inject(AzitUserRepository) private azitUserRepository: AzitUserRepository) {}

  async getAzitsByUserId(userId: bigint): Promise<Result<AzitListResDto>> {
    const azits = await this.azitUserRepository.findAzitsByUserId(userId);

    return ok({
      azits: azits.map((azit) => ({
        azit_id: Number(azit.id),
        azit_name: azit.azitName,
        azit_icon_url: azit.imageUrl,
      })),
    });
  }
}

