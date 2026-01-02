import { UserService } from '../user.service';
import { UserRepository } from '../user.repository';
import { UserSignUpReqDto } from '../dtos/user.req.dto';
import { UserErrorCode } from '../../../common/constants/error-code';

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
        id: 1,
        name: validSignUpDto.name,
        password: validSignUpDto.password,
        phoneNumber: validSignUpDto.phoneNumber,
        avatarImg: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await userService.signUp(validSignUpDto);

      expect(result.type).toBe('success');
      expect(result.statusCode).toBe(201);
      if (result.type === 'success') {
        expect(result.data.phoneNumber).toBe(validSignUpDto.phoneNumber);
        expect(result.data.name).toBe(validSignUpDto.name);
      }
    });

    it('should return conflict error when phoneNumber already exists', async () => {
      const existingUser = {
        id: 1,
        phoneNumber: validSignUpDto.phoneNumber,
        name: 'Existing User',
        password: 'password',
        avatarImg: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      userRepository.findByPhoneNumber.mockResolvedValue(existingUser);

      const result = await userService.signUp(validSignUpDto);

      expect(result.type).toBe('failed');
      expect(result.statusCode).toBe(409);
      if (result.type === 'failed') {
        expect(result.message).toBe('이미 존재하는 전화번호입니다.');
        expect(result.errorCode).toBe(UserErrorCode.DUPLICATE_PHONE_NUMBER);
      }
    });
  });
});