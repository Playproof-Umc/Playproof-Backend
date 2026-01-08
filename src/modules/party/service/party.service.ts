import { injectable, inject } from "tsyringe";
import { PartyRepository } from "../repository/party.repository";
import { Result, ok } from "../../../common/types/result.type";

@injectable()
export class PartyService {
  constructor(
    @inject(PartyRepository) private partyRepository: PartyRepository
  ) {}

  async createParty(dto: any): Promise<Result<void>> {
    return ok(undefined);
  }

  async getParty(id: number): Promise<Result<any>> {
    return ok({});
  }
}

