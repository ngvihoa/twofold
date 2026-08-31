import type {
  GameEventV2,
  GamePlayerViewV2,
  PlayerGameAction,
} from '@twofold/shared-types';
import { History, Moon, Shield, Skull, Sun, Trophy } from 'lucide-react';
import type { GameSessionError } from '../../features/game/session/game-session-machine';
import { PrototypeGameActionPanel } from './-Prototype.GameActionPanel';
import { PrototypeGameCard } from './-Prototype.GameCard';

export interface PrototypeGameBoardProps {
  readonly view: GamePlayerViewV2;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
  readonly canSubmit: boolean;
  readonly onSubmit: (action: PlayerGameAction) => void;
}

type PrototypeScene = 'day' | 'dusk' | 'night' | 'dawn' | 'purge';

/**
 * Render gameplay bằng information architecture của PO prototype.
 *
 * Đây là presentation tạm: opponent board và self board kẹp battlefield ở
 * giữa, còn side rail giữ vị trí history. Snapshot v0.2 vẫn là nguồn dữ liệu
 * duy nhất và component không resolve gameplay rule.
 */
export function PrototypeGameBoard(props: PrototypeGameBoardProps) {
  const { view } = props;
  const scene = getPrototypeScene(view.phase.type);
  const selfAlive = countLivingCards(view.self.board);
  const opponentAlive = countLivingCards(view.opponent.board);

  return (
    <div
      data-prototype-layout="arena-side-rail"
      data-prototype-scene={scene}
      className={`relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4 ${getSceneClass(scene)}`}
    >
      <PrototypeTopbar view={view} scene={scene} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <main className="grid min-w-0 grid-rows-[auto_minmax(17rem,1fr)_auto] gap-2">
          <PrototypeBoardSection
            title={`Đối thủ · ${view.opponent.id}`}
            hint="Role công khai được nhấn sáng"
            alive={opponentAlive}
            icon={<Skull className="h-4 w-4 text-rose-400" />}
          >
            {view.opponent.board.map((card) => (
              <PrototypeGameCard key={card.id} kind="opponent" card={card} />
            ))}
          </PrototypeBoardSection>

          <section className="relative flex min-h-0 items-center justify-center overflow-y-auto rounded-xl border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.12),_transparent_34%),linear-gradient(90deg,transparent_49.8%,rgba(255,255,255,0.07)_50%,transparent_50.2%),linear-gradient(180deg,rgba(30,41,59,0.75),rgba(2,6,23,0.92))] p-3 sm:p-5">
            <div className="pointer-events-none absolute inset-x-6 top-1/2 border-t border-dashed border-white/10" />
            <div className="relative z-10 w-full">
              {view.result ? <PrototypeResult view={view} /> : null}
              <PrototypeGameActionPanel
                view={view}
                pendingAction={props.pendingAction}
                error={props.error}
                canSubmit={props.canSubmit}
                onSubmit={props.onSubmit}
              />
            </div>
          </section>

          <PrototypeBoardSection
            title={`Tay của bạn · ${view.self.id}`}
            hint="Thông tin role chỉ hiện với bạn"
            alive={selfAlive}
            icon={<Shield className="h-4 w-4 text-sky-300" />}
          >
            {view.self.board.map((card) => (
              <PrototypeGameCard key={card.id} kind="self" card={card} />
            ))}
          </PrototypeBoardSection>
        </main>

        <PrototypeHistoryRail events={view.events} />
      </div>
    </div>
  );
}

function PrototypeTopbar({
  view,
  scene,
}: {
  readonly view: GamePlayerViewV2;
  readonly scene: PrototypeScene;
}) {
  const daylight = scene === 'day' || scene === 'dawn';
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/15 px-2 pb-3">
      <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-300 font-serif text-[10px] font-black tracking-tighter">
        TF
      </div>
      <div>
        <p className="text-xs font-black tracking-[0.18em] text-slate-100">TWOFOLD</p>
        <p className="text-[10px] text-slate-400">Prototype presentation · Vòng {view.round}</p>
      </div>
      <div className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-widest">
        {daylight ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-indigo-300" />}
        {view.phase.type}
      </div>
      <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[9px] text-slate-400">
        {view.activePlayer ? `Active · ${view.activePlayer}` : 'Simultaneous / resolution'}
      </span>
    </header>
  );
}

function PrototypeBoardSection({
  title,
  hint,
  alive,
  icon,
  children,
}: {
  readonly title: string;
  readonly hint: string;
  readonly alive: number;
  readonly icon: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-white/[0.07] bg-black/15 px-2 py-2">
      <header className="mb-1 flex items-end justify-between gap-3 px-1 text-xs">
        <h2 className="flex items-center gap-2 font-black uppercase tracking-[0.12em] text-slate-200">
          {icon}{title}
        </h2>
        <span className="text-right text-[9px] text-slate-400">{hint} · {alive}/10 sống</span>
      </header>
      <div className="overflow-x-auto px-1 py-2">
        <div className="grid min-w-[680px] grid-cols-10 gap-1.5">{children}</div>
      </div>
    </section>
  );
}

function PrototypeResult({ view }: { readonly view: GamePlayerViewV2 }) {
  if (!view.result) return null;
  return (
    <div className="mx-auto mb-3 flex max-w-2xl items-center justify-center gap-3 rounded-lg border border-amber-500/30 bg-amber-950/60 p-3 text-sm text-amber-100">
      <Trophy className="h-5 w-5 text-amber-300" />
      Winner: {view.result.winner ?? 'DRAW'} · {view.result.reason}
    </div>
  );
}

function PrototypeHistoryRail({ events }: { readonly events: readonly GameEventV2[] }) {
  const recentEvents = events.slice(-12).reverse();
  return (
    <aside className="flex min-h-52 flex-col rounded-xl border border-white/10 bg-slate-950/80 p-4 lg:min-h-0">
      <header className="border-b border-white/10 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <History className="h-4 w-4 text-amber-300" /> Lịch sử trận đấu
        </h2>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
          Prototype rail · wording và animation hoàn chỉnh thuộc PR 4.5.
        </p>
      </header>
      <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {recentEvents.length > 0 ? recentEvents.map((event) => (
          <li key={event.id} className="border-l-2 border-slate-700 pl-2 text-[10px] leading-relaxed text-slate-400">
            <span className="font-mono text-slate-500">#{event.sequence} · V{event.round}</span>
            <strong className="block text-slate-300">{event.type}</strong>
          </li>
        )) : (
          <li className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-[10px] text-slate-500">
            Chưa có structured event.
          </li>
        )}
      </ol>
    </aside>
  );
}

function countLivingCards(cards: readonly { readonly state: { readonly life: string } }[]): number {
  return cards.filter((card) => card.state.life === 'ALIVE').length;
}

function getPrototypeScene(phase: GamePlayerViewV2['phase']['type']): PrototypeScene {
  switch (phase) {
    case 'PURGE_PLAN':
    case 'PURGE_RESOLUTION':
      return 'purge';
    case 'DUSK_DEFENSE':
      return 'dusk';
    case 'NIGHT_PLAN':
    case 'NIGHT_RESOLUTION':
      return 'night';
    case 'DAWN':
      return 'dawn';
    default:
      return 'day';
  }
}

function getSceneClass(scene: PrototypeScene): string {
  switch (scene) {
    case 'purge':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#5c1f27_0%,#241218_38%,#09070a_82%)]';
    case 'dusk':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#4a3547_0%,#1d1c28_38%,#090b12_82%)]';
    case 'night':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#1e3154_0%,#101725_38%,#05070c_82%)]';
    case 'dawn':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#8b6b3d_0%,#332a22_38%,#0d1015_82%)]';
    case 'day':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#60543b_0%,#24231f_38%,#0d0f12_82%)]';
  }
}
