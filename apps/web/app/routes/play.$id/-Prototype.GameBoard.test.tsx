import {
  AbilityId,
  CardRole,
  GamePlayerViewV2Schema,
  PlayerId,
} from '@twofold/shared-types';
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
import {
  PrototypeGameBoard,
  PrototypeHistorySheet,
  getNewlyRevealedOpponentCardIds,
  getPrivateCardIntentIndicators,
} from './-Prototype.GameBoard';
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
    expect(html).toContain('h-full min-h-0');
    expect(html).toContain('grid-rows-[auto_minmax(7rem,1fr)_auto]');
    expect(html).toContain('Mệnh lệnh hiện tại');
    expect(html).toContain('Lịch sử trận đấu');
    expect(html).toContain('data-history-rail="true"');
    expect(html).toContain('max-h-[calc(100dvh-7rem)]');
    expect(html).toContain('data-history-sheet-trigger="true"');
    expect(html).toContain('Ban ngày · Người chơi A hành động');
    expect(html).not.toContain('DAY_A');
    expect(html).toContain('/characters/dan-lang.png');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('<select');
    expect(html.indexOf('Đối thủ')).toBeLessThan(html.indexOf('Mệnh lệnh hiện tại'));
    expect(html.indexOf('Mệnh lệnh hiện tại')).toBeLessThan(html.indexOf('Tay của bạn'));
  });

  it('renders mobile history as a scrollable right-side sheet', () => {
    const html = renderToStaticMarkup(
      <PrototypeHistorySheet events={[]} open onClose={vi.fn()} />
    );

    expect(html).toContain('data-history-sheet="true"');
    expect(html).toContain('z-[100]');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('data-side="right"');
    expect(html).toContain('inset-y-0 right-0');
    expect(html).toContain('w-[85vw] max-w-sm');
    expect(html).toContain('h-dvh max-h-dvh min-h-0');
    expect(html).toContain('data-history-scroll="true"');
    expect(html).toContain('touch-pan-y');
    expect(html).toContain('overflow-y-auto');
    expect(html).toContain('aria-label="Đóng lịch sử trận đấu"');
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
    expect(html).not.toContain('Chết');
    expect(html).not.toContain('Ẩn');
    expect(html).not.toContain('lucide-eye-off');
    expect(html).not.toContain('>DEAD<');
    expect(html).not.toContain('>HIDDEN<');
    expect(html).not.toContain(CardRole.WEREWOLF);
    expect(html).not.toContain('trọng số 2 phiếu');
  });

  it('renders private effects supplied by the self card view', () => {
    const card = createView().self.board[0];
    const html = renderToStaticMarkup(
      <PrototypeGameCard
        kind="self"
        card={{
          ...card,
          effects: [
            {
              kind: 'PROTECTION',
              appliedRound: 2,
              expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 2 },
            },
            {
              kind: 'PURGE_LOCK',
              appliedRound: 6,
              expires: { type: 'PERMANENT' },
            },
          ],
        }}
        selectable={false}
        selected={false}
        onSelect={vi.fn()}
      />
    );

    expect(html).toContain('data-card-effect="PROTECTION"');
    expect(html).toContain('aria-label="Được bảo vệ"');
    expect(html).toContain('data-card-effect="PURGE_LOCK"');
  });

  it('renders only effects present in the filtered opponent card view', () => {
    const card = createView().opponent.board[0];
    const html = renderToStaticMarkup(
      <PrototypeGameCard
        kind="opponent"
        card={{
          ...card,
          effects: [
            {
              kind: 'PROTECTION',
              appliedRound: 2,
              expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 2 },
            },
            {
              kind: 'REVENGE_MARK',
              appliedRound: 2,
              expires: { type: 'WHEN_TRIGGERED' },
            },
          ],
        }}
        selectable={false}
        selected={false}
        onSelect={vi.fn()}
      />
    );

    expect(html).toContain('data-card-effect="REVENGE_MARK"');
    expect(html).toContain('aria-label="Bị đánh dấu báo thù"');
    expect(html).not.toContain('data-card-effect="PROTECTION"');
    expect(html).not.toContain('Được bảo vệ');
  });

  it('shows a private protection target from the pending defense action', () => {
    const view = createView();
    const sourceId = view.self.board[0].id;
    const targetId = view.self.board[1].id;
    const indicators = getPrivateCardIntentIndicators(view, {
      type: 'DEFENSE_SUBMIT',
      playerId: view.self.id,
      order: { type: 'PROTECT', sourceId, targetId },
    });

    expect(indicators.get(targetId)).toEqual(['PENDING_PROTECTION']);
    expect(indicators.get(sourceId)).toBeUndefined();
  });

  it('shows the hanging icon on the pending council accusation target', () => {
    const view = createView();
    const targetId = view.opponent.board[0].id;
    const voterId = view.self.board[0].id;
    const indicators = getPrivateCardIntentIndicators(view, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: view.self.id,
      order: {
        type: 'ACCUSE',
        targetId,
        guessedRole: view.opponent.board[0].role,
        voterIds: [voterId],
      },
    });

    expect(indicators.get(targetId)).toEqual(['PENDING_HANGING']);
  });

  it('keeps the hanging icon while the target waits for a council reaction', () => {
    const view = createView();
    const targetId = view.self.board[0].id;
    const indicators = getPrivateCardIntentIndicators(
      {
        ...view,
        self: {
          ...view.self,
          submissions: {
            ...view.self.submissions,
            council: {
              ...view.self.submissions.council,
              pendingTargetId: targetId,
            },
          },
        },
      },
      null
    );

    expect(indicators.get(targetId)).toEqual(['PENDING_HANGING']);
  });

  it.each([
    [AbilityId.WEREWOLF_ATTACK, 'PENDING_ATTACK'],
    [AbilityId.SEER_INSPECT, 'PENDING_INSPECTION'],
    [AbilityId.WITCH_POISON, 'PENDING_POISON'],
  ] as const)('shows the private %s target from the pending night action', (
    abilityId,
    expectedIndicator
  ) => {
    const view = createView();
    const sourceId = view.self.board[0].id;
    const targetId = view.opponent.board[0].id;
    const indicators = getPrivateCardIntentIndicators(view, {
      type: 'NIGHT_SUBMIT',
      playerId: view.self.id,
      order: { type: 'USE_ABILITY', abilityId, sourceId, targetId },
    });

    expect(indicators.get(targetId)).toEqual([expectedIndicator]);
  });

  it('keeps the private target icon after the server stores the submission', () => {
    const view = createView();
    const sourceId = view.self.board[0].id;
    const targetId = view.opponent.board[0].id;
    const html = renderToStaticMarkup(
      <PrototypeGameBoard
        view={{
          ...view,
          phase: { type: 'NIGHT_PLAN' },
          self: {
            ...view.self,
            submissions: {
              ...view.self.submissions,
              night: {
                type: 'USE_ABILITY',
                abilityId: AbilityId.SEER_INSPECT,
                sourceId,
                targetId,
              },
            },
          },
        }}
        pendingAction={null}
        error={null}
        canSubmit
        onSubmit={vi.fn()}
      />
    );

    expect(html).toContain('data-card-intent="PENDING_INSPECTION"');
    expect(html).toContain('Mục tiêu đang được Tiên tri soi');
  });

  it('does not derive private targets from opponent submission locks', () => {
    const view = createView();
    const indicators = getPrivateCardIntentIndicators(
      {
        ...view,
        opponent: {
          ...view.opponent,
          submissionLocks: {
            ...view.opponent.submissionLocks,
            night: true,
            defense: true,
            councilAccusation: true,
          },
        },
      },
      null
    );

    expect(indicators.size).toBe(0);
  });

  it('detects an opponent reveal across a phase-driven board remount', () => {
    const opponentBoard = createView().opponent.board;
    const revealedCard = opponentBoard[0];
    const previous = new Map(
      opponentBoard.map((card) => [card.id, card.state.visibility])
    );
    const nextBoard = opponentBoard.map((card) =>
      card.id === revealedCard.id
        ? {
            ...card,
            state: { ...card.state, visibility: 'REVEALED' as const },
          }
        : card
    );

    const newlyRevealed = getNewlyRevealedOpponentCardIds(previous, nextBoard);

    expect(newlyRevealed.has(revealedCard.id)).toBe(true);
    expect(newlyRevealed.size).toBe(1);
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
