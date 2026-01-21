export type SocketAuthData = {
  userId: number;
  // 현재 참여중인 모임 ID 목록
  voiceRooms?: Set<number>;
};

export type JoinRoomPayload = {
  roomId: number;
};

export type SendMessagePayload = {
  roomId: number;
  content: string;
};
