// src/modules/user/user.service.ts
import { injectable, inject } from "tsyringe";
import { UserRepository } from "./user.repository";
import { UserSignUpReqDto } from "./dtos/user.req.dto";
import { UserSignUpResDto } from "./dtos/user.res.dto";
import { Result, created, conflict } from "../../common/types/result.type";
import { UserErrorCode } from "../../common/constants/error-code";

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async signUp(dto: UserSignUpReqDto): Promise<Result<UserSignUpResDto>> {
    const exists = await this.userRepository.findByEmail(dto.email);

    if (exists) {
      return conflict({
        message: "이미 존재하는 이메일입니다.",
        errorCode: UserErrorCode.DUPLICATE_EMAIL,
      });
    }

    const newUser = await this.userRepository.createUser(dto);

    return created({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });
  }
}
