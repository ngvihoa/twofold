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
import {
  PrototypeGameActionPanel,
  PrototypeGameInteractionProvider,
} from './-Prototype.GameActionPanel';
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
  it('adds an accessible function tooltip to a known player card', () => {
    const card = createView().self.board[0];
    const html = renderToStaticMarkup(
      <PrototypeGameCard
        kind="self"
        card={card}
        selectable={false}
        selected={false}
        onSelect={vi.fn()}
      />
    );

    expect(html).toContain('aria-describedby=');
    expect(html).toContain('Phe Dân làng');
    expect(html).toContain('trọng số 2 phiếu');
  });

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
    expect(html).toContain('data-prototype-scene="day"');
    expect(html).toContain('Mệnh lệnh hiện tại');
    expect(html).toContain('Lịch sử trận đấu');
    expect(html).toContain('Ban ngày · Người chơi A hành động');
    expect(html).not.toContain('DAY_A');
    expect(html).toContain('/characters/dan-lang.png');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('<select');
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
        selectable={false}
        selected={false}
        onSelect={vi.fn()}
      />
    );

    expect(html).toContain('Vai trò ẩn');
    expect(html).toContain('Đã chết');
    expect(html).toContain('Đang ẩn');
    expect(html).not.toContain(CardRole.WEREWOLF);
    expect(html).not.toContain('trọng số 2 phiếu');
  });

  it.each([
    ['DAY_A', 1, 'Xạ thủ bắn'],
    ['COUNCIL_PLAN', 2, 'Chọn voter'],
    ['NIGHT_PLAN', 2, 'Ma sói tấn công'],
    ['DUSK_DEFENSE', 2, 'Đặt khiên'],
    ['PURGE_PLAN', 6, 'Thanh trừng CUT'],
    ['FINAL_DUEL', 6, 'Ma sói'],
    ['DAWN', 2, 'thao tác tạm khóa'],
  ] as const)('renders the %s phase action surface', (phase, round, expected) => {
    const view = GamePlayerViewV2Schema.parse({
      ...createView(),
      round,
      phase: { type: phase },
      activePlayer: phase === 'DAY_A' ? PlayerId.PLAYER_A : null,
    });
    const html = renderToStaticMarkup(
      <PrototypeGameInteractionProvider
        view={view}
        pendingAction={null}
        error={null}
        canSubmit
        onSubmit={vi.fn()}
      >
        <PrototypeGameActionPanel />
      </PrototypeGameInteractionProvider>
    );
    expect(html).toContain(expected);
  });
});
