import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  SuccessResponse,
} from 'tsoa/dist';
import { inject, injectable } from 'tsyringe';
import { FriendService } from './friend.service';

@Route('friends')
@Tags('Friend')
@injectable()
export class FriendController extends Controller {
  constructor(
    @inject(FriendService) private readonly friendService: FriendService,
  ) {
    super();
  }
}
