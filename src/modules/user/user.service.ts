// src/modules/user/user.service.ts
import { injectable, inject } from "tsyringe";
import { UserRepository } from "./user.repository";
import { UserSignUpReqDto, UserUpdateReqDto, UserGetReqDto } from "./dtos/user.req.dto";
import { UserSignUpResDto, UserUpdateResDto, UserGetResDto } from "./dtos/user.res.dto"; 
import { Result, created, ok, conflict, notFound } from "../../common/types/result.type";
import { UserErrorCode } from "../../common/constants/error-code";

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async signUp(dto: UserSignUpReqDto): Promise<Result<UserSignUpResDto>> {
    const exists = await this.userRepository.findByPhoneNumber(dto.phoneNumber);
    
    if (exists) {
      return conflict({ 
        message: "이미 존재하는 전화번호입니다.", 
        errorCode: UserErrorCode.DUPLICATE_PHONE_NUMBER
      });
    }

    const newUser = await this.userRepository.createUser(dto);

    return created({ 
      id: newUser.id, 
      phoneNumber: newUser.phoneNumber, 
      name: newUser.name 
    });
  }

  async getUserById(dto: UserGetReqDto): Promise<Result<UserGetResDto>> {
    const user = await this.userRepository.findById(dto.id);

    if (!user) {
      return notFound({ 
        message: "유저를 찾을 수 없습니다.", 
        errorCode: UserErrorCode.NOT_FOUND 
      });
    }

    return ok({
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name
    });
  }
}