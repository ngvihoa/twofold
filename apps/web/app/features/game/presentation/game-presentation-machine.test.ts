import type { GameEventV2 } from '@twofold/shared-types';
import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import {
  gamePresentationMachine,
  getPresentationKind,
  selectIsPresenting,
  selectQueuedPresentationCount,
} from './game-presentation-machine';

function event(
  sequence: number,
  phase: GameEventV2['phase'] = 'DAY_A'
): GameEventV2 {
  return {
    id: `event-${sequence}`,
    sequence,
    round: 1,
    phase,
    visibility: { type: 'PUBLIC' },
    type: 'CARD_REVEALED',
    cardId: 'A1',
  };
}

function startPresentation() {
  const actor = createActor(gamePresentationMachine);
  actor.start();
  return actor;
}

describe('gamePresentationMachine', () => {
  it('hydrates an existing history without replaying it', () => {
    const actor = startPresentation();

    actor.send({ type: 'HYDRATE', events: [event(1), event(3), event(2)] });

    expect(actor.getSnapshot().matches('idle')).toBe(true);
    expect(actor.getSnapshot().context).toMatchObject({
      lastSeenSequence: 3,
      lastPresentedSequence: 3,
      current: null,
      queue: [],
    });
    actor.stop();
  });

  it('sorts and deduplicates live events by sequence', () => {
    const actor = startPresentation();
    actor.send({ type: 'HYDRATE', events: [event(1)] });

    actor.send({
      type: 'INGEST',
      events: [event(3, 'NIGHT_RESOLUTION'), event(2, 'DUSK_DEFENSE'), event(2)],
    });

    expect(selectIsPresenting(actor.getSnapshot())).toBe(true);
    expect(actor.getSnapshot().context.current?.sequence).toBe(2);
    expect(actor.getSnapshot().context.queue.map(({ sequence }) => sequence)).toEqual([
      3,
    ]);

    actor.send({ type: 'INGEST', events: [event(1), event(2), event(3)] });
    expect(selectQueuedPresentationCount(actor.getSnapshot())).toBe(2);
    actor.stop();
  });

  it('keeps the current animation when newer events arrive', () => {
    const actor = startPresentation();
    actor.send({ type: 'INGEST', events: [event(1), event(2)] });
    expect(actor.getSnapshot().context.current?.sequence).toBe(1);

    actor.send({ type: 'INGEST', events: [event(3), event(4)] });

    expect(actor.getSnapshot().context.current?.sequence).toBe(1);
    expect(actor.getSnapshot().context.queue.map(({ sequence }) => sequence)).toEqual([
      2, 3, 4,
    ]);
    actor.stop();
  });

  it('advances one event at a time on complete or skip current', () => {
    const actor = startPresentation();
    actor.send({ type: 'INGEST', events: [event(1), event(2), event(3)] });

    actor.send({ type: 'PRESENTATION_COMPLETED' });
    expect(actor.getSnapshot().context).toMatchObject({
      lastPresentedSequence: 1,
      current: { sequence: 2 },
    });

    actor.send({ type: 'SKIP_CURRENT' });
    expect(actor.getSnapshot().context).toMatchObject({
      lastPresentedSequence: 2,
      current: { sequence: 3 },
    });

    actor.send({ type: 'PRESENTATION_COMPLETED' });
    expect(actor.getSnapshot().matches('idle')).toBe(true);
    expect(actor.getSnapshot().context).toMatchObject({
      lastPresentedSequence: 3,
      current: null,
      queue: [],
    });
    actor.stop();
  });

  it('fast-forwards the queue and resets for another game', () => {
    const actor = startPresentation();
    actor.send({ type: 'INGEST', events: [event(1), event(2), event(3)] });
    actor.send({ type: 'SKIP_ALL' });

    expect(actor.getSnapshot().matches('idle')).toBe(true);
    expect(actor.getSnapshot().context).toMatchObject({
      lastSeenSequence: 3,
      lastPresentedSequence: 3,
      current: null,
      queue: [],
    });

    actor.send({ type: 'RESET' });
    expect(actor.getSnapshot().context).toEqual({
      lastSeenSequence: 0,
      lastPresentedSequence: 0,
      current: null,
      queue: [],
    });
    actor.stop();
  });

  it('reconciles during presentation without replaying the reconnect snapshot', () => {
    const actor = startPresentation();
    actor.send({ type: 'INGEST', events: [event(1), event(2)] });
    expect(actor.getSnapshot().matches('presenting')).toBe(true);

    actor.send({
      type: 'HYDRATE',
      events: [event(1), event(2), event(3), event(4)],
    });

    expect(actor.getSnapshot().matches('idle')).toBe(true);
    expect(actor.getSnapshot().context).toMatchObject({
      lastSeenSequence: 4,
      lastPresentedSequence: 4,
      current: null,
      queue: [],
    });
    actor.stop();
  });

  it('derives the presentation lane from the authoritative event phase', () => {
    expect(getPresentationKind(event(1, 'DAY_B'))).toBe('DAY');
    expect(getPresentationKind(event(2, 'COUNCIL_RESOLUTION'))).toBe('COUNCIL');
    expect(getPresentationKind(event(3, 'DUSK_DEFENSE'))).toBe('DEFENSE');
    expect(getPresentationKind(event(4, 'NIGHT_RESOLUTION'))).toBe('NIGHT');
    expect(getPresentationKind(event(5, 'DAWN'))).toBe('DAWN');
    expect(getPresentationKind(event(6, 'PURGE_RESOLUTION'))).toBe('PURGE');
    expect(getPresentationKind(event(7, 'FINAL_DUEL'))).toBe('FINAL_DUEL');
    expect(getPresentationKind(event(8, 'ENDED'))).toBe('GENERIC');
    expect(getPresentationKind(null)).toBeNull();
  });
});
