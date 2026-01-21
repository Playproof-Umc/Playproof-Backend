const CHAT_ROOM_PREFIX = "chatRoom:";

// 채팅 방 키 생성
export const getRoomKey = (roomId: number) => `${CHAT_ROOM_PREFIX}${roomId}`;
