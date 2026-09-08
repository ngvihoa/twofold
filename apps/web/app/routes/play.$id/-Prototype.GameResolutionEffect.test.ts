import {
  AbilityId,
  PlayerId,
  type GamePresentationEventPayloadV2,
  type GamePresentationEventV2,
} from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import { getPresentationDurationMs } from './-Prototype.GameEventPresentation';
import {
  getGameResolutionEffect,
  isCardInGameResolution,
} from './-Prototype.GameResolutionEffect';

function event(payload: GamePresentationEventPayloadV2): GamePresentationEventV2 {
  return {
    id: 'effect:4',
    sequence: 4,
    round: 2,
    phase: 'NIGHT_RESOLUTION',
    ...payload,
  } as GamePresentationEventV2;
}

describe('prototype game resolution effect', () => {
  it('maps the authoritative seer source and target to prototype scan motion', () => {
    const seer = event({
      type: 'ABILITY_RESOLVED',
      abilityId: AbilityId.SEER_INSPECT,
      sourceCardId: 'A3',
      targetCardId: 'B4',
    });

    expect(getGameResolutionEffect(seer)).toEqual({
      kind: 'inspect',
      sourceCardId: 'A3',
      targetCardId: 'B4',
    });
    expect(isCardInGameResolution(seer, 'A3')).toBe(true);
    expect(isCardInGameResolution(seer, 'B4')).toBe(true);
    expect(isCardInGameResolution(seer, 'B5')).toBe(false);
    expect(getPresentationDurationMs(seer)).toBe(4_200);
  });

  it('animates a public save as a shield without inventing its hidden source', () => {
    const saved = event({
      type: 'CARD_SAVED',
      cardId: 'B2',
      instanceId: 'B:2',
      owner: PlayerId.PLAYER_B,
    });

    expect(getGameResolutionEffect(saved)).toEqual({
      kind: 'defend',
      sourceCardId: null,
      targetCardId: 'B2',
    });
  });

  it('keeps ordinary structured notifications on the shorter presentation beat', () => {
    const pass = event({ type: 'COUNCIL_PASSED', playerId: PlayerId.PLAYER_A });
    expect(getGameResolutionEffect(pass)).toBeNull();
    expect(getPresentationDurationMs(pass)).toBe(2_200);
  });
});
