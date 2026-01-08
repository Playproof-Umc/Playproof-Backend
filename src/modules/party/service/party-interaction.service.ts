import { injectable } from "tsyringe";
import { Result, ok } from "../../../common/types/result.type";

@injectable()
export class PartyInteractionService {
  async likeParty(partyId: number, userId: number): Promise<Result<void>> {
    return ok(undefined);
  }
}

