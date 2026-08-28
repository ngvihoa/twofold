import { os } from '@orpc/server';
import {
  CreateRoomInputSchema,
  CreateRoomOutputSchema,
  GetRoomInfoInputSchema,
  GetRoomInfoOutputSchema,
  PlayerId,
} from '@twofold/shared-types';
import { globalRoomManager } from '../ws/room-manager';

export const appRouter = {
  createRoom: os
    .input(CreateRoomInputSchema)
    .output(CreateRoomOutputSchema)
    .handler(async ({ input }) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const hostSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const room = globalRoomManager.createRoom(roomCode, hostSessionId, input.hostName);

      return {
        roomId: room.roomId,
        roomCode,
        hostSessionId,
        assignedPlayerId: PlayerId.PLAYER_A,
      };
    }),

  getRoomInfo: os
    .input(GetRoomInfoInputSchema)
    .output(GetRoomInfoOutputSchema)
    .handler(async ({ input }) => {
      const room = globalRoomManager.getRoom(input.roomCode);
      if (!room) {
        throw new Error(`Không tìm thấy phòng: ${input.roomCode}`);
      }

      return {
        roomId: room.roomId,
        roomCode: room.roomCode,
        isHostConnected: !!room.host.ws,
        isGuestConnected: !!room.guest?.ws,
        isGameStarted: room.isStarted,
      };
    }),
};

export type AppRouter = typeof appRouter;

