import {
  AbilityId,
  CardRole,
  PlayerGameActionSchema,
  PlayerId,
} from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import {
  createBloodMoonAction,
  createCouncilAccusationAction,
  createCouncilPassAction,
  createCouncilReactionAction,
  createCouncilReactionPassAction,
  createDayAbilityAction,
  createDayPassAction,
  createDefensePassAction,
  createDefenseProtectAction,
  createFinalGuessAction,
  createNightAbilityAction,
  createNightPassAction,
  createPurgeAction,
  getPurgeRuleForRound,
} from './game-action-model';

describe('v0.2 web action builders', () => {
  it('builds every post-Setup action variant accepted by shared-types', () => {
    const actions = [
      createDayPassAction(PlayerId.PLAYER_A),
      createDayAbilityAction(PlayerId.PLAYER_A, 'SHOOT', 'A6', 'B1'),
      createCouncilPassAction(PlayerId.PLAYER_A),
      createCouncilAccusationAction(
        PlayerId.PLAYER_A,
        'B1',
        CardRole.WEREWOLF,
        ['A1', 'A2', 'A3']
      ),
      createCouncilReactionPassAction(PlayerId.PLAYER_A),
      createCouncilReactionAction(PlayerId.PLAYER_A, 'A10'),
      createNightPassAction(PlayerId.PLAYER_A),
      createNightAbilityAction(
        PlayerId.PLAYER_A,
        AbilityId.WEREWOLF_ATTACK,
        'A2',
        'B1'
      ),
      createBloodMoonAction(PlayerId.PLAYER_A, 'B1'),
      createDefensePassAction(PlayerId.PLAYER_A),
      createDefenseProtectAction(PlayerId.PLAYER_A, 'A5', 'A1'),
      createPurgeAction(PlayerId.PLAYER_A, { rule: 'CUT', targetId: 'A1' }),
      createPurgeAction(PlayerId.PLAYER_A, {
        rule: 'SWAP',
        ownTargetId: 'A1',
        opponentTargetId: 'B1',
      }),
      createPurgeAction(PlayerId.PLAYER_A, { rule: 'REVEAL', targetId: null }),
      createPurgeAction(PlayerId.PLAYER_A, { rule: 'LOCK', targetId: 'A1' }),
      createFinalGuessAction(PlayerId.PLAYER_A, CardRole.SEER),
    ];

    for (const action of actions) {
      expect(PlayerGameActionSchema.safeParse(action).success).toBe(true);
    }
    expect(actions.map((action) => action.type)).toEqual([
      'DAY_SUBMIT',
      'DAY_SUBMIT',
      'COUNCIL_ACCUSATION_SUBMIT',
      'COUNCIL_ACCUSATION_SUBMIT',
      'COUNCIL_REACTION_SUBMIT',
      'COUNCIL_REACTION_SUBMIT',
      'NIGHT_SUBMIT',
      'NIGHT_SUBMIT',
      'NIGHT_SUBMIT',
      'DEFENSE_SUBMIT',
      'DEFENSE_SUBMIT',
      'PURGE_SUBMIT',
      'PURGE_SUBMIT',
      'PURGE_SUBMIT',
      'PURGE_SUBMIT',
      'FINAL_GUESS_SUBMIT',
    ]);
  });

  it('rejects duplicate Council voters before dispatch', () => {
    expect(() =>
      createCouncilAccusationAction(
        PlayerId.PLAYER_A,
        'B1',
        CardRole.WEREWOLF,
        ['A1', 'A1', 'A2']
      )
    ).toThrow(/voter khác nhau/u);
  });

  it('derives the four-rule Purge cycle from round six', () => {
    expect([6, 7, 8, 9, 10].map(getPurgeRuleForRound)).toEqual([
      'CUT', 'SWAP', 'REVEAL', 'LOCK', 'CUT',
    ]);
    expect(() => getPurgeRuleForRound(5)).toThrow(/Vòng 6/u);
  });
});
