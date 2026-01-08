import { injectable } from "tsyringe";
import { Result, ok } from "../../../common/types/result.type";

@injectable()
export class PartyCommentService {
  async addComment(partyId: number, content: string): Promise<Result<void>> {
    return ok(undefined);
  }
}
