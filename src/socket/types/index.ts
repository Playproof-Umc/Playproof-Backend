export type SocketAuthData = {
  userId: number;
};

export type JoinRoomPayload = {
  roomId: number;
};

export type SendMessagePayload = {
  roomId: number;
  content: string;
};
