import type { GamePresentationEventV2 } from '@twofold/shared-types';
import { useEffect, useRef } from 'react';
import { GamePresentationActorContext } from './game-presentation-context';

export interface GamePresentationSyncProps {
  readonly gameId: string;
  readonly events: readonly GamePresentationEventV2[];
}

/**
 * Đồng bộ public outcomes và private feedback đã project vào presentation actor.
 * Snapshot đầu tiên chỉ tạo baseline để reconnect không phát lại toàn bộ lịch sử;
 * các snapshot sau mới được đưa vào animation queue.
 */
export function GamePresentationSync({
  gameId,
  events,
}: GamePresentationSyncProps) {
  const actor = GamePresentationActorContext.useActorRef();
  const hydratedGameId = useRef<string | null>(null);

  useEffect(() => {
    if (hydratedGameId.current !== gameId) {
      actor.send({ type: 'RESET' });
      actor.send({ type: 'HYDRATE', events });
      hydratedGameId.current = gameId;
      return;
    }

    actor.send({ type: 'INGEST', events });
  }, [actor, events, gameId]);

  return null;
}
