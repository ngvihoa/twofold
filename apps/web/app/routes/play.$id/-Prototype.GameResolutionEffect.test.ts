import {
  AbilityId,
  CardRole,
  Faction,
  PlayerId,
  type GamePresentationEventPayloadV2,
  type GamePresentationEventV2,
} from '@twofold/shared-types';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  getPresentationDurationMs,
  isSilentCardOutcomePresentation,
} from './-Prototype.GameEventPresentation';
import {
  getGameResolutionEffect,
  isCardInGameResolution,
  ResolutionEffectMarkup,
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
      kind: 'saved',
      sourceCardId: null,
      targetCardId: 'B2',
    });
  });

  it('does not replay guard placement when night resolution emits the ability event', () => {
    const guardResolution = event({
      type: 'ABILITY_RESOLVED',
      abilityId: AbilityId.GUARD_PROTECT,
      sourceCardId: 'A4',
      targetCardId: 'A2',
    });

    expect(getGameResolutionEffect(guardResolution)).toBeNull();
    expect(getPresentationDurationMs(guardResolution)).toBe(2_200);
  });

  it('keeps ordinary structured notifications on the shorter presentation beat', () => {
    const pass = event({ type: 'COUNCIL_PASSED', playerId: PlayerId.PLAYER_A });
    expect(getGameResolutionEffect(pass)).toBeNull();
    expect(getPresentationDurationMs(pass)).toBe(2_200);
  });

  it('advances reveal/elimination on the board without duplicate effect markup', () => {
    const eliminated = event({
      type: 'CARD_ELIMINATED',
      cardId: 'B2',
      instanceId: 'B:2',
      owner: PlayerId.PLAYER_B,
      role: null,
      faction: null,
    });

    expect(getGameResolutionEffect(eliminated)).toBeNull();
    expect(isSilentCardOutcomePresentation(eliminated)).toBe(true);
    expect(getPresentationDurationMs(eliminated)).toBe(900);
  });

  it('shows reveal markup only when the revealed card belongs to the viewer', () => {
    const selfReveal = event({
      type: 'CARD_REVEALED',
      cardId: 'A2',
      instanceId: 'A:2',
      owner: PlayerId.PLAYER_A,
      role: CardRole.PRIEST,
      faction: Faction.VILLAGE,
    });

    expect(isSilentCardOutcomePresentation(selfReveal, PlayerId.PLAYER_A)).toBe(false);
    expect(getGameResolutionEffect(selfReveal, PlayerId.PLAYER_A)).toMatchObject({
      kind: 'revealed',
      targetCardId: 'A2',
    });
    expect(getPresentationDurationMs(selfReveal, PlayerId.PLAYER_A)).toBe(4_200);
    expect(isSilentCardOutcomePresentation(selfReveal, PlayerId.PLAYER_B)).toBe(true);
    expect(getGameResolutionEffect(selfReveal, PlayerId.PLAYER_B)).toBeNull();
    expect(getPresentationDurationMs(selfReveal, PlayerId.PLAYER_B)).toBe(900);
  });

  it('keeps a dedicated healing presentation for revived cards', () => {
    const revived = event({
      type: 'CARD_REVIVED',
      cardId: 'A5',
      instanceId: 'A:5',
      owner: PlayerId.PLAYER_A,
      role: CardRole.VILLAGER,
      faction: Faction.VILLAGE,
    });

    expect(isSilentCardOutcomePresentation(revived, PlayerId.PLAYER_A)).toBe(false);
    expect(getGameResolutionEffect(revived, PlayerId.PLAYER_A)).toMatchObject({
      kind: 'revived',
      targetCardId: 'A5',
    });
    expect(getPresentationDurationMs(revived, PlayerId.PLAYER_A)).toBe(4_200);

    const html = renderToStaticMarkup(createElement(ResolutionEffectMarkup, {
      effect: { kind: 'revived', sourceCardId: null, targetCardId: 'A5' },
    }));
    expect(html).toContain('game-fx-healing-aura');
    expect(html.match(/>\+<\/b>/gu)).toHaveLength(12);
  });
});
