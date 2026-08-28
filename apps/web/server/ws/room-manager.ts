import { GameEngine } from '@twofold/game-core';
import { PlayerId, CardRole, GameAction, PlayerGameView } from '@twofold/shared-types';

export interface RoomParticipant {
  playerId: PlayerId;
  sessionId: string;
  name: string;
  ws?: any;
  isReady: boolean;
}

export interface GameRoom {
  roomId: string;
  roomCode: string;
  host: RoomParticipant;
  guest?: RoomParticipant;
  engine: GameEngine;
  isStarted: boolean;
  createdAt: number;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  public createRoom(roomCode: string, hostSessionId: string, hostName: string): GameRoom {
    const roomId = `room_${Date.now()}_${roomCode}`;
    const engine = new GameEngine(roomId);

    const room: GameRoom = {
      roomId,
      roomCode,
      host: {
        playerId: PlayerId.PLAYER_A,
        sessionId: hostSessionId,
        name: hostName,
        isReady: false,
      },
      engine,
      isStarted: false,
      createdAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  public getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }

  public joinRoom(roomCode: string, guestSessionId: string, guestName: string): GameRoom {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error(`Không tìm thấy phòng với mã ${roomCode}`);
    }

    if (room.guest && room.guest.sessionId !== guestSessionId) {
      throw new Error('Phòng đấu đã có đủ 2 người chơi!');
    }

    room.guest = {
      playerId: PlayerId.PLAYER_B,
      sessionId: guestSessionId,
      name: guestName,
      isReady: false,
    };

    return room;
  }

  public broadcastGameState(room: GameRoom): void {
    if (room.host.ws) {
      const viewA = room.engine.getPlayerView(PlayerId.PLAYER_A, !!room.guest);
      this.sendToWs(room.host.ws, {
        type: 'GAME_STATE_UPDATE',
        payload: viewA,
      });
    }

    if (room.guest && room.guest.ws) {
      const viewB = room.engine.getPlayerView(PlayerId.PLAYER_B, true);
      this.sendToWs(room.guest.ws, {
        type: 'GAME_STATE_UPDATE',
        payload: viewB,
      });
    }
  }

  private sendToWs(ws: any, data: any): void {
    try {
      if (ws && typeof ws.send === 'function') {
        ws.send(JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error sending message to ws:', err);
    }
  }
}

export const globalRoomManager = new RoomManager();

