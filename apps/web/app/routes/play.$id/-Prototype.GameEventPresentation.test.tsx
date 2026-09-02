import { CardRole, Faction, PlayerId, type GamePresentationEventV2 } from '@twofold/shared-types';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PrototypeGameEventPresentationCard } from './-Prototype.GameEventPresentation';

describe('PrototypeGameEventPresentationCard', () => {
  it('renders formatted structured-event wording and queue controls', () => {
    const event: GamePresentationEventV2 = {
      id: 'event-7',
      sequence: 7,
      round: 2,
      phase: 'NIGHT_RESOLUTION',
      type: 'CARD_REVEALED',
      cardId: 'B4',
      instanceId: 'B:4',
      owner: PlayerId.PLAYER_B,
      role: CardRole.WEREWOLF,
      faction: Faction.WEREWOLF,
    };
    const html = renderToStaticMarkup(
      <PrototypeGameEventPresentationCard
        current={event}
        kind="NIGHT"
        queuedCount={3}
        onSkipCurrent={vi.fn()}
        onSkipAll={vi.fn()}
      />
    );

    expect(html).toContain('data-presentation-kind="NIGHT"');
    expect(html).toContain('data-presentation-sequence="7"');
    expect(html).toContain('Diễn biến mới · Vòng 2');
    expect(html).toContain('B4');
    expect(html).toContain('Bỏ qua tất cả (3)');
    expect(html).not.toContain('CARD_REVEALED');
  });
});
