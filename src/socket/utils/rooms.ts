const CHAT_ROOM_PREFIX = "chatRoom:";
const VOICE_ROOM_PREFIX = "voiceRoom:";

// 채팅 방 키 생성
export const getRoomKey = (roomId: number) => `${CHAT_ROOM_PREFIX}${roomId}`;
// 음성 방 키 생성
export const getVoiceRoomKey = (roomId: number) => `${VOICE_ROOM_PREFIX}${roomId}`;
