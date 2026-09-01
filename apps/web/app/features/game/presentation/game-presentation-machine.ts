import type { GameEventV2 } from '@twofold/shared-types';
import { assign, setup, type SnapshotFrom } from 'xstate';

/** Nhóm animation/presentation được derive từ phase của current event. */
export type GamePresentationKind =
  | 'DAY'
  | 'COUNCIL'
  | 'DEFENSE'
  | 'NIGHT'
  | 'DAWN'
  | 'PURGE'
  | 'FINAL_DUEL'
  | 'GENERIC';

/** UI-only cursor và queue state của presentation actor. */
export interface GamePresentationContext {
  /** Sequence cao nhất đã nhận từ live snapshot hoặc hydrate. */
  readonly lastSeenSequence: number;
  /** Sequence cao nhất đã complete/skip hoặc được baseline bằng hydrate. */
  readonly lastPresentedSequence: number;
  /** Event duy nhất UI được phép animate tại một thời điểm. */
  readonly current: GameEventV2 | null;
  /** Event đã dedupe và sort đang chờ sau `current`. */
  readonly queue: readonly GameEventV2[];
}

/**
 * Commands được caller gửi vào presentation actor.
 *
 * `HYDRATE` đặt reconnect/initial baseline mà không replay; `INGEST` thêm live
 * events; complete/skip điều khiển current animation; `RESET` xóa cursor khi
 * actor được tái sử dụng cho game khác.
 */
export type GamePresentationEvent =
  | { readonly type: 'HYDRATE'; readonly events: readonly GameEventV2[] }
  | { readonly type: 'INGEST'; readonly events: readonly GameEventV2[] }
  | { readonly type: 'PRESENTATION_COMPLETED' }
  | { readonly type: 'SKIP_CURRENT' }
  | { readonly type: 'SKIP_ALL' }
  | { readonly type: 'RESET' };

/** Context rỗng của một presentation actor chưa nhận snapshot. */
const INITIAL_CONTEXT: GamePresentationContext = {
  lastSeenSequence: 0,
  lastPresentedSequence: 0,
  current: null,
  queue: [],
};

/**
 * Tìm event sequence lớn nhất trong một snapshot history.
 *
 * @param events - Structured events đã được server lọc cho viewer.
 * @returns Sequence lớn nhất, hoặc `0` nếu history rỗng.
 */
function highestSequence(events: readonly GameEventV2[]): number {
  let highest = 0;
  for (const event of events) highest = Math.max(highest, event.sequence);
  return highest;
}

/**
 * Nối các event live chưa từng thấy vào cuối presentation queue.
 *
 * Hàm bỏ sequence cũ/trùng, sort batch mới theo sequence và không thay đổi
 * `current`, nhờ đó snapshot đến giữa animation không cắt presentation hiện tại.
 *
 * @param context - Presentation context trước khi nhận snapshot.
 * @param events - Full hoặc partial event history từ live snapshot.
 * @returns Context mới với queue/cursor đã reconcile; trả lại context cũ nếu
 * không có event mới.
 */
function appendFreshEvents(
  context: GamePresentationContext,
  events: readonly GameEventV2[]
): GamePresentationContext {
  const bySequence = new Map<number, GameEventV2>();
  for (const event of events) {
    if (event.sequence > context.lastSeenSequence && !bySequence.has(event.sequence)) {
      bySequence.set(event.sequence, event);
    }
  }
  const freshEvents = [...bySequence.values()].sort(
    (left, right) => left.sequence - right.sequence
  );
  if (freshEvents.length === 0) return context;

  return {
    ...context,
    lastSeenSequence: freshEvents.at(-1)?.sequence ?? context.lastSeenSequence,
    queue: [...context.queue, ...freshEvents],
  };
}

/**
 * Đánh dấu current event đã complete/skip và promote queue head tiếp theo.
 *
 * @param context - Context đang ở state `presenting`.
 * @returns Context với `lastPresentedSequence` đã tiến và current mới, hoặc giữ
 * nguyên nếu không có current event.
 */
function advancePresentation(context: GamePresentationContext): GamePresentationContext {
  if (context.current === null) return context;
  const [next = null, ...remaining] = context.queue;
  return {
    ...context,
    lastPresentedSequence: Math.max(
      context.lastPresentedSequence,
      context.current.sequence
    ),
    current: next,
    queue: remaining,
  };
}

/**
 * UI-only event queue. It sequences already-filtered structured events and
 * never owns or mutates authoritative gameplay state.
 *
 * Machine có hai state: `idle` khi không có animation và `presenting` khi
 * `current` đang được UI xử lý. Root handlers (`HYDRATE`, `SKIP_ALL`, `RESET`)
 * dùng được từ cả hai state; chúng chỉ chạy khi caller gửi event, không tự chạy
 * lúc actor khởi tạo.
 */
export const gamePresentationMachine = setup({
  types: {
    context: {} as GamePresentationContext,
    events: {} as GamePresentationEvent,
  },
  guards: {
    hasQueuedEvents: ({ context }) => context.queue.length > 0,
    hasNextEvent: ({ context }) => context.queue.length > 0,
  },
}).createMachine({
  id: 'gamePresentation',
  initial: 'idle',
  context: INITIAL_CONTEXT,
  on: {
    HYDRATE: {
      target: '.idle',
      actions: assign(({ context, event }) => {
        const baseline = Math.max(
          context.lastSeenSequence,
          highestSequence(event.events)
        );
        return {
          lastSeenSequence: baseline,
          lastPresentedSequence: baseline,
          current: null,
          queue: [],
        };
      }),
    },
    SKIP_ALL: {
      target: '.idle',
      actions: assign(({ context }) => ({
        ...context,
        lastPresentedSequence: Math.max(
          context.lastPresentedSequence,
          context.lastSeenSequence
        ),
        current: null,
        queue: [],
      })),
    },
    RESET: {
      target: '.idle',
      actions: assign(INITIAL_CONTEXT),
    },
  },
  states: {
    idle: {
      on: {
        INGEST: {
          actions: assign(({ context, event }) =>
            appendFreshEvents(context, event.events)
          ),
        },
      },
      always: {
        guard: 'hasQueuedEvents',
        target: 'presenting',
        actions: assign(({ context }) => {
          const [current = null, ...remaining] = context.queue;
          return { ...context, current, queue: remaining };
        }),
      },
    },
    presenting: {
      on: {
        INGEST: {
          actions: assign(({ context, event }) =>
            appendFreshEvents(context, event.events)
          ),
        },
        PRESENTATION_COMPLETED: [
          {
            guard: 'hasNextEvent',
            actions: assign(({ context }) => advancePresentation(context)),
          },
          {
            target: 'idle',
            actions: assign(({ context }) => advancePresentation(context)),
          },
        ],
        SKIP_CURRENT: [
          {
            guard: 'hasNextEvent',
            actions: assign(({ context }) => advancePresentation(context)),
          },
          {
            target: 'idle',
            actions: assign(({ context }) => advancePresentation(context)),
          },
        ],
      },
    },
  },
});

export type GamePresentationSnapshot = SnapshotFrom<
  typeof gamePresentationMachine
>;

/**
 * Derive presentation lane từ authoritative event phase.
 *
 * @param event - Current structured event, hoặc `null` khi actor idle.
 * @returns Nhóm presentation mà UI nên render; không lưu state trùng với phase.
 */
export function getPresentationKind(
  event: GameEventV2 | null
): GamePresentationKind | null {
  if (event === null) return null;
  switch (event.phase) {
    case 'DAY_A':
    case 'DAY_B':
      return 'DAY';
    case 'COUNCIL_PLAN':
    case 'COUNCIL_RESOLUTION':
    case 'COUNCIL_REACTION':
      return 'COUNCIL';
    case 'DUSK_DEFENSE':
      return 'DEFENSE';
    case 'NIGHT_PLAN':
    case 'NIGHT_RESOLUTION':
      return 'NIGHT';
    case 'DAWN':
      return 'DAWN';
    case 'PURGE_PLAN':
    case 'PURGE_RESOLUTION':
      return 'PURGE';
    case 'FINAL_DUEL':
      return 'FINAL_DUEL';
    case 'SETUP':
    case 'ENDED':
      return 'GENERIC';
  }
}

/** @returns Structured event đang được UI trình bày, hoặc `null`. */
export const selectCurrentPresentation = (snapshot: GamePresentationSnapshot) =>
  snapshot.context.current;

/** @returns Presentation kind derive từ current event, hoặc `null`. */
export const selectPresentationKind = (snapshot: GamePresentationSnapshot) =>
  getPresentationKind(snapshot.context.current);

/** @returns `true` khi actor đang chờ UI complete hoặc skip current event. */
export const selectIsPresenting = (snapshot: GamePresentationSnapshot) =>
  snapshot.matches('presenting');

/** @returns Tổng số event còn phải trình bày, bao gồm `current`. */
export const selectQueuedPresentationCount = (
  snapshot: GamePresentationSnapshot
) => snapshot.context.queue.length + (snapshot.context.current === null ? 0 : 1);

/** @returns Sequence cao nhất đã complete, skip hoặc baseline bằng hydrate. */
export const selectLastPresentedSequence = (
  snapshot: GamePresentationSnapshot
) => snapshot.context.lastPresentedSequence;
