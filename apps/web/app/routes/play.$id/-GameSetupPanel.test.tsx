import { GamePlayerViewV2Schema, PlayerId } from '@twofold/shared-types';
import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
} from '@twofold/game-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GameSetupPanel } from './-GameSetupPanel';
import { formatGameRoleName } from '../../features/game/presentation/game-display-labels';

function createPlayerView() {
  const playerA = createInitialPlayerState(
    PlayerId.PLAYER_A,
    STANDARD_DECK.map((role, index) =>
      createInitialCard(PlayerId.PLAYER_A, index + 1, role)
    )
  );
  const playerB = createInitialPlayerState(
    PlayerId.PLAYER_B,
    STANDARD_DECK.map((role, index) =>
      createInitialCard(PlayerId.PLAYER_B, index + 1, role)
    )
  );
  const game = createInitialGameState('setup-render-test', 'setup-render-seed', {
    [PlayerId.PLAYER_A]: playerA,
    [PlayerId.PLAYER_B]: playerB,
  });
  return GamePlayerViewV2Schema.parse(
    serializePlayerView(game, PlayerId.PLAYER_A)
  );
}

describe('GameSetupPanel', () => {
  it('renders all ten private cards from the authoritative player view', () => {
    const view = createPlayerView();
    const html = renderToStaticMarkup(
      <GameSetupPanel
        player={view.self}
        pendingAction={null}
        error={null}
        canSubmit
        onSubmit={vi.fn()}
      />
    );

    expect(html.match(/data-setup-card=/gu)).toHaveLength(10);
    for (const card of view.self.board) {
      expect(html).toContain(`data-setup-card="${card.instanceId}"`);
      expect(html).toContain(formatGameRoleName(card.role.id));
    }
  });
});
