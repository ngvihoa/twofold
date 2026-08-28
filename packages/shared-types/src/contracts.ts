import { z } from 'zod';
import { PlayerId } from './enums.js';

// Schema tạo phòng qua RPC
export const CreateRoomInputSchema = z.object({
  hostName: z.string().min(1).max(20).default('Player A'),
});

export const CreateRoomOutputSchema = z.object({
  roomId: z.string(),
  roomCode: z.string(),
  hostSessionId: z.string(),
  assignedPlayerId: z.literal(PlayerId.PLAYER_A),
});

// Schema tra cứu trạng thái phòng trước khi join
export const GetRoomInfoInputSchema = z.object({
  roomCode: z.string().min(4).max(10),
});

export const GetRoomInfoOutputSchema = z.object({
  roomId: z.string(),
  roomCode: z.string(),
  isHostConnected: z.boolean(),
  isGuestConnected: z.boolean(),
  isGameStarted: z.boolean(),
});

