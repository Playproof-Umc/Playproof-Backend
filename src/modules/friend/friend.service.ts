import { inject, injectable } from 'tsyringe';
import { FriendRepository } from './friend.repository';

@injectable()
export class FriendService {
  constructor(
    @inject(FriendRepository)
    private readonly friendRepository: FriendRepository,
  ) {}
}
