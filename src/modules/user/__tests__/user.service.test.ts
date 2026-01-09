import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { UserSignUpReqDto } from '../dtos/user.req.dto';
import { UserErrorCode } from '../../../common/constants/error-code';
import { isSuccess } from '../../../common/types/result.type';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      findByPhoneNumber: jest.fn(),
      createUser: jest.fn(),
    } as any;

    userService = new UserService(userRepository);
  });

  describe('signUp', () => {
    const validSignUpDto: UserSignUpReqDto = {
      password: 'password123',
      name: 'Test User',
      phoneNumber: '010-1234-5678',
    };

    it('should successfully create a new user', async () => {
      userRepository.findByPhoneNumber.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue({
        id: BigInt(1),
        name: validSignUpDto.name,
        password: validSignUpDto.password,
        phoneNumber: validSignUpDto.phoneNumber,
        avatarImg: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await userService.signUp(validSignUpDto);

      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      if (isSuccess(result)) {
        expect(result.data.phoneNumber).toBe(validSignUpDto.phoneNumber);
        expect(result.data.name).toBe(validSignUpDto.name);
      }
    });

    it('should return conflict error when phoneNumber already exists', async () => {
      const existingUser = {
        id: BigInt(1),
        phoneNumber: validSignUpDto.phoneNumber,
        name: 'Existing User',
        password: 'password',
        avatarImg: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      userRepository.findByPhoneNumber.mockResolvedValue(existingUser as any);

      const result = await userService.signUp(validSignUpDto);

      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
      if (!isSuccess(result)) {
        expect(result.error.message).toBe('이미 존재하는 전화번호입니다.');
        expect(result.error.code).toBe(UserErrorCode.DUPLICATE_PHONE_NUMBER);
      }
    });
  });
});
