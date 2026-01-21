export class VoiceRoomStore {
  private members = new Map<number, Map<number, number>>();

  addMember(roomId: number, userId: number) {
    const members = this.members.get(roomId) ?? new Map<number, number>();
    const current = members.get(userId) ?? 0;
    members.set(userId, current + 1);
    this.members.set(roomId, members);
  }

  removeMember(roomId: number, userId: number) {
    const members = this.members.get(roomId);
    if (!members) return;
    const current = members.get(userId) ?? 0;
    if (current <= 1) {
      members.delete(userId);
    } else {
      members.set(userId, current - 1);
    }
    if (members.size === 0) {
      this.members.delete(roomId);
    }
  }

  listParticipants(roomId: number) {
    const members = this.members.get(roomId);
    return members ? Array.from(members.keys()) : [];
  }
}
