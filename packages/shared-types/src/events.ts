import { z } from 'zod';
import { PlayerId } from './enums';
import { PlayerGameActionSchema } from './schemas';
import { GamePlayerViewV2Schema } from './game-v2';

/** Gameplay messages duy nhất cho ruleset v0.2. */
export const ClientWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('JOIN_ROOM'),
    payload: z.object({
      roomId: z.string().min(1),
      playerName: z.string().min(1),
      reconnectSessionId: z.string().optional(),
    }),
  }),
  z.object({ type: z.literal('SUBMIT_ACTION'), payload: PlayerGameActionSchema }),
  z.object({ type: z.literal('SURRENDER'), payload: z.object({}) }),
  z.object({ type: z.literal('REMATCH_REQUEST'), payload: z.object({}) }),
  z.object({ type: z.literal('PING'), payload: z.object({ timestamp: z.number() }) }),
]);
export type ClientWsMessage = z.infer<typeof ClientWsMessageSchema>;

/** Server snapshot v0.2 chứa filtered view và structured event stream. */
export const ServerWsMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ROOM_JOINED'),
    payload: z.object({
      roomId: z.string().min(1),
      assignedPlayerId: z.nativeEnum(PlayerId),
      sessionId: z.string().min(1),
    }),
  }),
  z.object({ type: z.literal('GAME_STATE_UPDATE'), payload: GamePlayerViewV2Schema }),
  z.object({
    type: z.literal('ACTION_REJECTED'),
    payload: z.object({ code: z.string().min(1), message: z.string().min(1) }),
  }),
  z.object({
    type: z.literal('ERROR'),
    payload: z.object({ code: z.string().min(1), message: z.string().min(1) }),
  }),
  z.object({ type: z.literal('PONG'), payload: z.object({ timestamp: z.number() }) }),
]);
export type ServerWsMessage = z.infer<typeof ServerWsMessageSchema>;
