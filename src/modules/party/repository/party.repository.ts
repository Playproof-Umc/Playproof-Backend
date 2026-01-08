import { singleton } from "tsyringe";

@singleton()
export class PartyRepository {
  async createParty(data: any): Promise<void> {}

  async findById(id: number): Promise<any> {
    return null;
  }

  async findAll(): Promise<any[]> {
    return [];
  }
}
