import { z } from 'zod';
import { PlayerId, CardRole } from './enums';
import {
  GameActionSchema,
  PlayerGameActionSchema,
  PlayerGameViewSchema,
} from './schemas';
import { GamePlayerViewV2Schema } from './game-v2';

/** @deprecated WebSocket contract v0.1, chỉ giữ cho legacy adapter. */
export const LegacyClientWsMessageSchema = z.discriminatedUnion('type', [
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

export type LegacyClientWsMessage = z.infer<typeof LegacyClientWsMessageSchema>;

/** @deprecated WebSocket contract v0.1, chỉ giữ cho legacy adapter. */
export const LegacyServerWsMessageSchema = z.discriminatedUnion('type', [
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

export type LegacyServerWsMessage = z.infer<typeof LegacyServerWsMessageSchema>;

/**
 * Gameplay messages cho ruleset v0.2.
 *
 * Đây là default contract mới. Consumer v0.1 phải import schema `Legacy*`
 * tường minh cho tới khi hoàn tất migration.
 */
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
