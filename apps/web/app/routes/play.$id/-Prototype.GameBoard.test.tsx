import { CardRole, GamePlayerViewV2Schema, PlayerId } from '@twofold/shared-types';
import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
} from '@twofold/game-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PrototypeGameActionPanel } from './-Prototype.GameActionPanel';
import { PrototypeGameBoard } from './-Prototype.GameBoard';
import { PrototypeGameCard } from './-Prototype.GameCard';

function createView() {
  const playerA = createInitialPlayerState(
    PlayerId.PLAYER_A,
    STANDARD_DECK.map((role, index) => createInitialCard(PlayerId.PLAYER_A, index + 1, role))
  );
  const playerB = createInitialPlayerState(
    PlayerId.PLAYER_B,
    STANDARD_DECK.map((role, index) => createInitialCard(PlayerId.PLAYER_B, index + 1, role))
  );
  return GamePlayerViewV2Schema.parse(
    serializePlayerView(
      createInitialGameState('board-render', 'board-render-seed', {
        [PlayerId.PLAYER_A]: playerA,
        [PlayerId.PLAYER_B]: playerB,
      }),
      PlayerId.PLAYER_A
    )
  );
}

describe('PrototypeGameBoard', () => {
  it('renders both ten-card boards from the filtered player view', () => {
    const html = renderToStaticMarkup(
      <PrototypeGameBoard
        view={{ ...createView(), phase: { type: 'DAY_A' }, activePlayer: PlayerId.PLAYER_A }}
        pendingAction={null}
        error={null}
        canSubmit
        onSubmit={vi.fn()}
      />
    );

    expect(html.match(/data-card-id=/gu)).toHaveLength(20);
    expect(html).toContain('data-prototype-layout="arena-side-rail"');
    expect(html).toContain('Mệnh lệnh hiện tại');
    expect(html).toContain('Lịch sử trận đấu');
    expect(html.indexOf('Đối thủ')).toBeLessThan(html.indexOf('Mệnh lệnh hiện tại'));
    expect(html.indexOf('Mệnh lệnh hiện tại')).toBeLessThan(html.indexOf('Tay của bạn'));
  });

  it('does not infer the role of a dead hidden opponent card', () => {
    const base = createView().opponent.board[0];
    const html = renderToStaticMarkup(
      <PrototypeGameCard
        kind="opponent"
        card={{
          ...base,
          state: { life: 'DEAD', visibility: 'HIDDEN' },
          role: null,
        }}
      />
    );

    expect(html).toContain('role ẩn');
    expect(html).toContain('DEAD');
    expect(html).toContain('HIDDEN');
    expect(html).not.toContain(CardRole.WEREWOLF);
  });

  it.each([
    ['DAY_A', 1, 'Gửi Day action'],
    ['COUNCIL_PLAN', 2, 'Cáo buộc'],
    ['NIGHT_PLAN', 2, 'Gửi Night order'],
    ['DUSK_DEFENSE', 2, 'Đặt bảo vệ'],
    ['PURGE_PLAN', 6, 'Purge rule'],
    ['FINAL_DUEL', 6, 'Gửi dự đoán cuối'],
    ['DAWN', 2, 'không có action để submit'],
  ] as const)('renders the %s phase action surface', (phase, round, expected) => {
    const view = GamePlayerViewV2Schema.parse({
      ...createView(),
      round,
      phase: { type: phase },
      activePlayer: phase === 'DAY_A' ? PlayerId.PLAYER_A : null,
    });
    const html = renderToStaticMarkup(
      <PrototypeGameActionPanel
        view={view}
        pendingAction={null}
        error={null}
        canSubmit
        onSubmit={vi.fn()}
      />
    );
    expect(html).toContain(expected);
  });
});
