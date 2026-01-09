// src/modules/user/user.service.ts
import { injectable, inject } from "tsyringe";
import { UserRepository } from "./user.repository";
import { UserUpdateReqDto} from "./dtos/user.req.dto";
import { UserSignUpResDto, UserUpdateResDto, UserGetResDto } from "./dtos/user.res.dto"; 
import { Result, created, ok, conflict, notFound } from "../../common/types/result.type";
import { UserErrorCode } from "../../common/constants/error-code";

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async getUserById(id: number): Promise<Result<UserGetResDto>> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      return notFound({ 
        message: "유저를 찾을 수 없습니다.", 
        errorCode: UserErrorCode.NOT_FOUND 
      });
    }

    return ok({
      id: Number(user.id),
      phone: user.phone,
      nickname: user.nickname
    });
  }
}