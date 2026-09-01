import type { GameEventV2 } from '@twofold/shared-types';
import {
  Eye,
  Moon,
  Shield,
  SkipForward,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { GamePresentationActorContext } from '../../features/game/presentation/game-presentation-context';
import { formatGameHistoryMessage } from '../../features/game/presentation/game-history-message';
import {
  selectCurrentPresentation,
  selectPresentationKind,
  selectQueuedPresentationCount,
  type GamePresentationKind,
} from '../../features/game/presentation/game-presentation-machine';

const PRESENTATION_DURATION_MS = 2_200;

const PRESENTATION_CLASS = {
  DAY: 'border-amber-300/40 bg-amber-950/95 text-amber-50',
  COUNCIL: 'border-violet-300/40 bg-violet-950/95 text-violet-50',
  DEFENSE: 'border-sky-300/40 bg-sky-950/95 text-sky-50',
  NIGHT: 'border-indigo-300/40 bg-indigo-950/95 text-indigo-50',
  DAWN: 'border-orange-200/50 bg-orange-950/95 text-orange-50',
  PURGE: 'border-rose-300/40 bg-rose-950/95 text-rose-50',
  FINAL_DUEL: 'border-yellow-200/50 bg-slate-950/95 text-yellow-50',
  GENERIC: 'border-slate-300/30 bg-slate-950/95 text-slate-50',
} as const satisfies Record<GamePresentationKind, string>;

/** Phát tuần tự event hiện tại rồi báo actor chuyển sang event kế tiếp. */
export function PrototypeGameEventPresentation() {
  const actor = GamePresentationActorContext.useActorRef();
  const current = GamePresentationActorContext.useSelector(
    selectCurrentPresentation
  );
  const kind = GamePresentationActorContext.useSelector(selectPresentationKind);
  const queuedCount = GamePresentationActorContext.useSelector(
    selectQueuedPresentationCount
  );

  useEffect(() => {
    if (current === null) return;
    const timeoutId = window.setTimeout(() => {
      actor.send({ type: 'PRESENTATION_COMPLETED' });
    }, PRESENTATION_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [actor, current]);

  if (current === null || kind === null) return null;

  return (
    <PrototypeGameEventPresentationCard
      current={current}
      kind={kind}
      queuedCount={queuedCount}
      onSkipCurrent={() => actor.send({ type: 'SKIP_CURRENT' })}
      onSkipAll={() => actor.send({ type: 'SKIP_ALL' })}
    />
  );
}

export interface PrototypeGameEventPresentationCardProps {
  readonly current: GameEventV2;
  readonly kind: GamePresentationKind;
  readonly queuedCount: number;
  readonly onSkipCurrent: () => void;
  readonly onSkipAll: () => void;
}

/** Markup thuần của một event để render test không cần khởi tạo actor React. */
export function PrototypeGameEventPresentationCard({
  current,
  kind,
  queuedCount,
  onSkipCurrent,
  onSkipAll,
}: PrototypeGameEventPresentationCardProps) {
  const message = formatGameHistoryMessage(current);

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-4 z-50 flex justify-center sm:top-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <section
        key={current.id}
        role="status"
        data-presentation-kind={kind}
        data-presentation-sequence={current.sequence}
        className={`game-presentation-event pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${PRESENTATION_CLASS[kind]}`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-current/20 bg-black/20">
            <PresentationIcon kind={kind} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-60">
              Diễn biến mới · Vòng {current.round}
            </p>
            <strong className="mt-0.5 block text-sm">{message.title}</strong>
            <p className="mt-0.5 text-xs leading-relaxed opacity-75">
              {message.detail}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-current/15 p-2 opacity-60 transition hover:bg-white/10 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={onSkipCurrent}
            aria-label="Bỏ qua diễn biến hiện tại"
            title="Bỏ qua"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
        {queuedCount > 1 ? (
          <button
            type="button"
            className="mt-2 text-[9px] font-semibold uppercase tracking-wider opacity-55 transition hover:opacity-100"
            onClick={onSkipAll}
          >
            Bỏ qua tất cả ({queuedCount})
          </button>
        ) : null}
        <span className="game-presentation-progress absolute inset-x-0 bottom-0 h-0.5 bg-current/70" />
      </section>
    </div>
  );
}

function PresentationIcon({ kind }: { readonly kind: GamePresentationKind }) {
  const className = 'h-4 w-4';
  switch (kind) {
    case 'DAY':
      return <Sun className={className} />;
    case 'COUNCIL':
      return <Users className={className} />;
    case 'DEFENSE':
      return <Shield className={className} />;
    case 'NIGHT':
      return <Moon className={className} />;
    case 'DAWN':
      return <Eye className={className} />;
    case 'PURGE':
    case 'FINAL_DUEL':
    case 'GENERIC':
      return <Sparkles className={className} />;
  }
}
