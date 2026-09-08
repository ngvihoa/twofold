import type {
  GamePlayerViewV2,
  GamePresentationEventV2,
} from '@twofold/shared-types';
import { useLayoutEffect, useRef, useState } from 'react';

type CardOutcomeEvent = Extract<
  GamePresentationEventV2,
  { type: 'CARD_REVEALED' | 'CARD_ELIMINATED' | 'CARD_REVIVED' }
>;

/** Áp dụng đúng một outcome card lên board đang trình diễn, không đổi phase sớm. */
export function applyCardOutcomeToPresentedView(
  presented: GamePlayerViewV2,
  authoritative: GamePlayerViewV2,
  event: GamePresentationEventV2
): GamePlayerViewV2 {
  if (
    event.type !== 'CARD_REVEALED' &&
    event.type !== 'CARD_ELIMINATED' &&
    event.type !== 'CARD_REVIVED'
  ) {
    return presented;
  }

  return {
    ...presented,
    self: {
      ...presented.self,
      board: presented.self.board.map((card) => {
        if (card.id !== event.cardId) return card;
        const latest = authoritative.self.board.find((item) => item.id === card.id);
        if (!latest) return card;
        return {
          ...card,
          state: patchCardState(card.state, latest.state, event),
        };
      }),
    },
    opponent: {
      ...presented.opponent,
      board: presented.opponent.board.map((card) => {
        if (card.id !== event.cardId) return card;
        const latest = authoritative.opponent.board.find((item) => item.id === card.id);
        if (!latest) return card;
        return {
          ...card,
          role: event.type === 'CARD_REVEALED' ? latest.role : card.role,
          state: patchCardState(card.state, latest.state, event),
        };
      }),
    },
  };
}

function patchCardState(
  current: GamePlayerViewV2['self']['board'][number]['state'],
  latest: GamePlayerViewV2['self']['board'][number]['state'],
  event: CardOutcomeEvent
) {
  switch (event.type) {
    case 'CARD_REVEALED':
      return { ...current, visibility: latest.visibility };
    case 'CARD_ELIMINATED':
    case 'CARD_REVIVED':
      return { ...current, life: latest.life };
  }
}

interface PresentationCursor {
  readonly gameId: string;
  readonly sequence: number;
}

/**
 * Giữ snapshot cuối khỏi xuất hiện tức thì và tiến board theo current event.
 * History/authoritative view vẫn nguyên vẹn; đây chỉ là projection cho render.
 */
export function usePresentedGameView({
  current,
  events,
  isPresenting,
  lastPresentedSequence,
  view,
}: {
  readonly current: GamePresentationEventV2 | null;
  readonly events: readonly GamePresentationEventV2[];
  readonly isPresenting: boolean;
  readonly lastPresentedSequence: number;
  readonly view: GamePlayerViewV2 | null;
}): GamePlayerViewV2 | null {
  const highestSequence = events.at(-1)?.sequence ?? 0;
  const [presented, setPresented] = useState<GamePlayerViewV2 | null>(view);
  const cursorRef = useRef<PresentationCursor | null>(
    view ? { gameId: view.gameId, sequence: highestSequence } : null
  );

  useLayoutEffect(() => {
    if (!view) {
      setPresented(null);
      cursorRef.current = null;
      return;
    }
    const cursor = cursorRef.current;
    if (!cursor || cursor.gameId !== view.gameId) {
      cursorRef.current = { gameId: view.gameId, sequence: highestSequence };
      setPresented(view);
      return;
    }

    if (current && current.sequence > cursor.sequence) {
      setPresented((previous) =>
        previous
          ? applyCardOutcomeToPresentedView(previous, view, current)
          : view
      );
      return;
    }

    if (
      !isPresenting &&
      (highestSequence <= cursor.sequence ||
        lastPresentedSequence >= highestSequence)
    ) {
      cursorRef.current = { gameId: view.gameId, sequence: highestSequence };
      setPresented(view);
    }
  }, [current, highestSequence, isPresenting, lastPresentedSequence, view]);

  if (view && cursorRef.current?.gameId !== view.gameId) return view;
  return presented ?? view;
}
