import { z } from 'zod';
import { PlayerId, CardRole } from './enums';
import { GameActionSchema, PlayerGameViewSchema } from './schemas';

// Client gửi lên Server qua WebSocket
export const ClientWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('JOIN_ROOM'),
    payload: z.object({
      roomId: z.string(),
      playerName: z.string(),
      reconnectSessionId: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('CONFIRM_ROLES'),
    payload: z.object({
      roles: z.array(z.nativeEnum(CardRole)).length(10),
    }),
  }),
  z.object({
    type: z.literal('SUBMIT_ACTION'),
    payload: GameActionSchema,
  }),
  z.object({
    type: z.literal('SURRENDER'),
    payload: z.object({}),
  }),
  z.object({
    type: z.literal('REMATCH_REQUEST'),
    payload: z.object({}),
  }),
  z.object({
    type: z.literal('PING'),
    payload: z.object({ timestamp: z.number() }),
  }),
]);

export type ClientWsMessage = z.infer<typeof ClientWsMessageSchema>;

// Server gửi xuống Client qua WebSocket
export const ServerWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ROOM_JOINED'),
    payload: z.object({
      roomId: z.string(),
      assignedPlayerId: z.nativeEnum(PlayerId),
      sessionId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('GAME_STATE_UPDATE'),
    payload: PlayerGameViewSchema,
  }),
  z.object({
    type: z.literal('ERROR'),
    payload: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
  z.object({
    type: z.literal('PONG'),
    payload: z.object({ timestamp: z.number() }),
  }),
]);

export type ServerWsMessage = z.infer<typeof ServerWsMessageSchema>;

