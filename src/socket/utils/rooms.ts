const CHAT_ROOM_PREFIX = 'chatRoom:';
const USER_ROOM_PREFIX = 'user:';

// 채팅 방 키 생성
export const getRoomKey = (roomId: number) => `${CHAT_ROOM_PREFIX}${roomId}`;

// 유저 개인 룸 키 생성
export const getUserRoomKey = (userId: number) => `${USER_ROOM_PREFIX}${userId}`;
