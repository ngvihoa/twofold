import { defineWebSocketHandler } from 'crossws';
import { globalRoomManager } from './room-manager';
import { ClientWsMessageSchema, PlayerId } from '@twofold/shared-types';

export default defineWebSocketHandler({
  open(peer) {
    console.log(`[WS] Peer connected: ${peer.id}`);
  },

  message(peer, message) {
    try {
      const raw = message.text();
      const parsed = JSON.parse(raw);
      const data = ClientWsMessageSchema.parse(parsed);

      if (data.type === 'JOIN_ROOM') {
        const { roomId: roomCode, playerName, reconnectSessionId } = data.payload;
        const sessionId = reconnectSessionId || peer.id;

        let room = globalRoomManager.getRoom(roomCode);
        if (!room) {
          // Tạo phòng nếu chưa có
          room = globalRoomManager.createRoom(roomCode, sessionId, playerName);
          room.host.ws = peer;
          peer.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              payload: {
                roomId: room.roomId,
                assignedPlayerId: PlayerId.PLAYER_A,
                sessionId,
              },
            })
          );
        } else {
          // Join với tư cách Guest B
          room = globalRoomManager.joinRoom(roomCode, sessionId, playerName);
          if (room.guest) room.guest.ws = peer;
          peer.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              payload: {
                roomId: room.roomId,
                assignedPlayerId: PlayerId.PLAYER_B,
                sessionId,
              },
            })
          );
        }

        // Broadcast game state sau khi join
        globalRoomManager.broadcastGameState(room);
      }

      if (data.type === 'SUBMIT_ACTION') {
        // Xử lý action từ game engine
        console.log(`[WS] Action received from peer ${peer.id}:`, data.payload);
      }
    } catch (err: any) {
      console.error('[WS] Message error:', err);
      peer.send(
        JSON.stringify({
          type: 'ERROR',
          payload: {
            code: 'INVALID_MESSAGE',
            message: err?.message || 'Gói tin không hợp lệ',
          },
        })
      );
    }
  },

  close(peer, details) {
    console.log(`[WS] Peer disconnected: ${peer.id}`, details);
  },

  error(peer, error) {
    console.error(`[WS] Peer error: ${peer.id}`, error);
  },
});

