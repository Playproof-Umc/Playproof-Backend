import 'reflect-metadata';
import { FriendService } from '../services/friend.service';
import { FriendRepository, FriendWithUsers } from '../repositories/friend.repository';
import { UserRepository } from '../../user/user.repository';
import { FriendRequestReqDto } from '../dto/friend.req.dto';
import { isSuccess } from '../../../common/types/result.type';

describe('FriendService', () => {
  let friendService: FriendService;
  let friendRepository: jest.Mocked<FriendRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  const createMockFriendWithUsers = (
    requestId: number,
    fromUserId: number,
    toUserId: number,
    fromUserNickname: string,
  ): FriendWithUsers =>
    ({
      id: BigInt(requestId),
      fromUserId: BigInt(fromUserId),
      toUserId: BigInt(toUserId),
      friendAt: new Date(),
      fromUser: {
        id: BigInt(fromUserId),
        nickname: fromUserNickname,
        trustScore: 100,
        userAvatars: [{ avatar: { avatarUrl: 'https://avatar.com/1.png' } }],
      },
      toUser: {
        id: BigInt(toUserId),
        nickname: '받는사람',
        trustScore: 0,
        userAvatars: [],
      },
    }) as FriendWithUsers;

  beforeEach(() => {
    friendRepository = {
      friendRequest: jest.fn(),
      findExistingRelation: jest.fn(),
      getReceivedRequestList: jest.fn(),
    } as any;

    userRepository = {
      findById: jest.fn(),
    } as any;

    friendService = new FriendService(friendRepository, userRepository);
    jest.clearAllMocks();
  });

  describe('friendRequest (친구 신청)', () => {
    const dto: FriendRequestReqDto = { toUserId: 2 };

    it('정상적으로 친구 신청이 성공해야 한다', async () => {
      // Given: 본인과 대상 유저가 존재하고, 기존 관계 없음
      userRepository.findById.mockResolvedValueOnce({ id: BigInt(1) } as any);
      userRepository.findById.mockResolvedValueOnce({ id: BigInt(2) } as any);
      friendRepository.findExistingRelation.mockResolvedValue(null);
      friendRepository.friendRequest.mockResolvedValue({
        toUserId: 2,
        friendStatus: 'PENDING',
        friendAt: new Date(),
        createdAt: new Date(),
      });

      // When
      const result = await friendService.friendRequest(1, dto);

      // Then
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data).toMatchObject({
        toUserId: 2,
        friendStatus: 'PENDING',
      });
      expect(friendRepository.friendRequest).toHaveBeenCalledWith(1, dto);
    });

    it('존재하지 않는 유저에게 신청하면 404를 반환해야 한다', async () => {
      // Given: 대상 유저가 없음
      userRepository.findById.mockResolvedValueOnce({ id: BigInt(1) } as any);
      userRepository.findById.mockResolvedValueOnce(null);

      // When
      const result = await friendService.friendRequest(1, dto);

      // Then
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(friendRepository.friendRequest).not.toHaveBeenCalled();
    });

    it('이미 친구인 경우 409를 반환해야 한다', async () => {
      // Given: 이미 친구 관계
      userRepository.findById.mockResolvedValue({ id: BigInt(1) } as any);
      friendRepository.findExistingRelation.mockResolvedValue({
        friendStatus: 'ACCEPTED',
      } as any);

      // When
      const result = await friendService.friendRequest(1, dto);

      // Then
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(friendRepository.friendRequest).not.toHaveBeenCalled();
    });

    it('이미 친구 요청을 보낸 경우 409를 반환해야 한다', async () => {
      // Given: 이미 PENDING 요청 보냄
      userRepository.findById.mockResolvedValue({ id: BigInt(1) } as any);
      friendRepository.findExistingRelation.mockResolvedValue({
        fromUserId: BigInt(1),
        toUserId: BigInt(2),
        friendStatus: 'PENDING',
      } as any);

      // When
      const result = await friendService.friendRequest(1, dto);

      // Then
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(friendRepository.friendRequest).not.toHaveBeenCalled();
    });
  });

  describe('getReceivedFriendList (나에게 도착한 친구 신청 목록)', () => {
    it('받은 친구 신청 목록을 정상적으로 반환해야 한다', async () => {
      // Given: userId가 2인 유저가 받은 신청 목록 (userId 1이 2에게 신청)
      const receivedList = [
        createMockFriendWithUsers(10, 1, 2, '신청자1'),
        createMockFriendWithUsers(11, 3, 2, '신청자2'),
      ];

      userRepository.findById.mockResolvedValue({ id: BigInt(2) } as any);
      friendRepository.getReceivedRequestList.mockResolvedValue(receivedList);

      // When
      const result = await friendService.getReceivedFriendList(2);

      // Then
      expect(isSuccess(result)).toBe(true);
      expect(result.statusCode).toBe(200);
      const data = isSuccess(result) ? result.data : null;
      expect(data).not.toBeNull();
      expect(data!.friends).toHaveLength(2);
      // 받은 친구 신청이므로 sender(fromUser) 정보가 표시되어야 함
      expect(data!.friends[0].requestId).toBe(10);
      expect(data!.friends[0].userId).toBe(1);
      expect(data!.friends[0].nickname).toBe('신청자1');
      expect(data!.friends[1].requestId).toBe(11);
      expect(data!.friends[1].userId).toBe(3);
      expect(data!.friends[1].nickname).toBe('신청자2');
      expect(friendRepository.getReceivedRequestList).toHaveBeenCalledWith(2);
    });

    it('받은 친구 신청이 없으면 빈 배열을 반환해야 한다', async () => {
      // Given: 받은 신청 없음
      userRepository.findById.mockResolvedValue({ id: BigInt(2) } as any);
      friendRepository.getReceivedRequestList.mockResolvedValue([]);

      // When
      const result = await friendService.getReceivedFriendList(2);

      // Then
      expect(isSuccess(result)).toBe(true);
      const data = isSuccess(result) ? result.data : null;
      expect(data).not.toBeNull();
      expect(data!.friends).toEqual([]);
    });

    it('존재하지 않는 유저가 조회하면 404를 반환해야 한다', async () => {
      // Given: 유저 없음
      userRepository.findById.mockResolvedValue(null);

      // When
      const result = await friendService.getReceivedFriendList(999);

      // Then
      expect(isSuccess(result)).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(friendRepository.getReceivedRequestList).not.toHaveBeenCalled();
    });
  });
});
