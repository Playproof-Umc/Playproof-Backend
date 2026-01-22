import {
  Controller,
  Get,
  Path,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { inject, injectable } from 'tsyringe';
import { Result } from '../../../common/types/result.type';
import { VoiceTokenResDto } from '../dtos/voice.res.dto';
import { VoiceService } from '../service/voice.service';

@Route('chat-rooms')
@Tags('Voice')
@injectable()
export class VoiceController extends Controller {
  constructor(@inject(VoiceService) private voiceService: VoiceService) {
    super();
  }

  @SuccessResponse('200', 'OK')
  @Security('jwt')
  @Get('{roomId}/voice-token')
  public async getVoiceToken(
    @Path() roomId: number,
    @Request() req: any,
  ): Promise<Result<VoiceTokenResDto>> {
    const userId = Number(req.user.id);
    const result = await this.voiceService.issueVoiceToken(roomId, userId);
    this.setStatus(result.statusCode);
    return result;
  }
}
