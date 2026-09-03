import type {
  CardId,
  CardRuntimeStateV2,
  GamePresentationEventV2,
  GamePlayerViewV2,
  PlayerGameAction,
} from '@twofold/shared-types';
import { History, Moon, Shield, Skull, Sun, Trophy } from 'lucide-react';
import * as React from 'react';
import {
  formatGamePhaseName,
  formatGamePlayerName,
} from '../../features/game/presentation/game-display-labels';
import { formatGameHistoryMessage } from '../../features/game/presentation/game-history-message';
import { getPresentationEvents } from '../../features/game/presentation/game-presentation-machine';
import type { GameSessionError } from '../../features/game/session/game-session-machine';
import {
  PrototypeGameActionPanel,
  PrototypeGameInteractionProvider,
  usePrototypeCardInteraction,
} from './-Prototype.GameActionPanel';
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
  const previousOpponentVisibilityRef = React.useRef(
    createOpponentVisibilitySnapshot(props.view.opponent.board)
  );
  const newlyRevealedOpponentCardIds = getNewlyRevealedOpponentCardIds(
    previousOpponentVisibilityRef.current,
    props.view.opponent.board
  );

  React.useEffect(() => {
    previousOpponentVisibilityRef.current = createOpponentVisibilitySnapshot(
      props.view.opponent.board
    );
  }, [props.view.opponent.board]);

  return (
    <PrototypeGameInteractionProvider
      view={props.view}
      pendingAction={props.pendingAction}
      error={props.error}
      canSubmit={props.canSubmit}
      onSubmit={props.onSubmit}
    >
      <PrototypeGameArena
        view={props.view}
        newlyRevealedOpponentCardIds={newlyRevealedOpponentCardIds}
      />
    </PrototypeGameInteractionProvider>
  );
}

function PrototypeGameArena({
  view,
  newlyRevealedOpponentCardIds,
}: {
  readonly view: GamePlayerViewV2;
  readonly newlyRevealedOpponentCardIds: ReadonlySet<CardId>;
}) {
  const scene = getPrototypeScene(view.phase.type);
  const selfAlive = countLivingCards(view.self.board);
  const opponentAlive = countLivingCards(view.opponent.board);
  const interaction = usePrototypeCardInteraction();

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
            hint="Vai trò công khai được nhấn sáng"
            alive={opponentAlive}
            icon={<Skull className="h-4 w-4 text-rose-400" />}
          >
            {view.opponent.board.map((card) => (
              <PrototypeGameCard
                key={card.id}
                kind="opponent"
                card={card}
                animateReveal={newlyRevealedOpponentCardIds.has(card.id)}
                selectable={interaction.selectableCardIds.has(card.id)}
                selected={interaction.selectedCardIds.has(card.id)}
                onSelect={interaction.selectCard}
              />
            ))}
          </PrototypeBoardSection>

          <section className={`relative flex min-h-0 items-center justify-center overflow-y-auto rounded-xl border p-3 sm:p-5 ${getBattlefieldClass(scene)}`}>
            <div className="pointer-events-none absolute inset-x-6 top-1/2 border-t border-dashed border-white/10" />
            <div className="relative z-10 w-full">
              {view.result ? <PrototypeResult view={view} /> : null}
              <PrototypeGameActionPanel />
            </div>
          </section>

          <PrototypeBoardSection
            title={`Tay của bạn · ${view.self.id}`}
            hint="Thông tin vai trò chỉ hiện với bạn"
            alive={selfAlive}
            icon={<Shield className="h-4 w-4 text-sky-300" />}
          >
            {view.self.board.map((card) => (
              <PrototypeGameCard
                key={card.id}
                kind="self"
                card={card}
                selectable={interaction.selectableCardIds.has(card.id)}
                selected={interaction.selectedCardIds.has(card.id)}
                onSelect={interaction.selectCard}
              />
            ))}
          </PrototypeBoardSection>
        </main>

        <PrototypeHistoryRail events={getPresentationEvents(view)} />
      </div>
    </div>
  );
}

type OpponentVisibilitySnapshot = ReadonlyMap<
  CardId,
  CardRuntimeStateV2['visibility']
>;

function createOpponentVisibilitySnapshot(
  cards: GamePlayerViewV2['opponent']['board']
): OpponentVisibilitySnapshot {
  return new Map(cards.map((card) => [card.id, card.state.visibility]));
}

export function getNewlyRevealedOpponentCardIds(
  previous: OpponentVisibilitySnapshot,
  cards: GamePlayerViewV2['opponent']['board']
): ReadonlySet<CardId> {
  return new Set(
    cards
      .filter(
        (card) =>
          previous.get(card.id) === 'HIDDEN' &&
          card.state.visibility === 'REVEALED'
      )
      .map((card) => card.id)
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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/15 px-2 py-2 rounded-lg">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-widest">
        {daylight ? <Sun className="h-3.5 w-3.5 text-amber-300" /> : <Moon className="h-3.5 w-3.5 text-indigo-300" />}
        {formatGamePhaseName(view.phase.type)}
      </div>
      <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-400">
        {view.activePlayer
          ? `Đang hành động · ${formatGamePlayerName(view.activePlayer)}`
          : 'Hai bên cùng chọn / đang phân giải'}
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
        <span className="text-right text-xs text-slate-400">{hint} · {alive}/10 sống</span>
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

function PrototypeHistoryRail({ events }: { readonly events: readonly GamePresentationEventV2[] }) {
  const recentEvents = events.slice(-12).reverse();
  return (
    <aside className="flex min-h-52 flex-col rounded-xl border border-white/10 bg-slate-950/80 p-4 lg:min-h-0">
      <header className="border-b border-white/10 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <History className="h-4 w-4 text-amber-300" /> Lịch sử trận đấu
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Những diễn biến gần nhất được ghi lại theo thứ tự thời gian.
        </p>
      </header>
      <ol className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {recentEvents.length > 0 ? recentEvents.map((event) => {
          const message = formatGameHistoryMessage(event);
          return (
            <li key={event.id} className="border-l-2 border-slate-700 pl-2 text-xs leading-relaxed text-slate-400">
              <span className="font-mono text-slate-500">#{event.sequence} · V{event.round}</span>
              <strong className="block text-slate-200">{message.title}</strong>
              <span className="block text-slate-400">{message.detail}</span>
            </li>
          );
        }) : (
          <li className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-xs text-slate-500">
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
      return 'bg-[radial-gradient(circle_at_50%_-10%,#ad4d59_0%,#552531_42%,#1d0d15_88%)]';
    case 'dusk':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#a66475_0%,#51405f_42%,#171b31_88%)]';
    case 'night':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#426fa8_0%,#213b68_42%,#0a1830_88%)]';
    case 'dawn':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#efc16f_0%,#936c43_40%,#293947_88%)]';
    case 'day':
      return 'bg-[radial-gradient(circle_at_50%_-10%,#d5b36e_0%,#71613c_40%,#25313b_88%)]';
  }
}

function getBattlefieldClass(scene: PrototypeScene): string {
  switch (scene) {
    case 'purge':
      return 'border-rose-200/20 bg-[radial-gradient(circle_at_center,rgba(221,84,93,.3)_0_18%,transparent_19%),linear-gradient(180deg,rgba(103,37,47,.76),rgba(39,15,23,.88))]';
    case 'dusk':
      return 'border-fuchsia-100/15 bg-[radial-gradient(circle_at_center,rgba(202,128,175,.24)_0_18%,transparent_19%),linear-gradient(180deg,rgba(85,62,95,.76),rgba(29,28,53,.88))]';
    case 'night':
      return 'border-blue-100/15 bg-[radial-gradient(circle_at_center,rgba(90,139,218,.28)_0_18%,transparent_19%),linear-gradient(180deg,rgba(39,67,113,.82),rgba(10,25,51,.9))]';
    case 'dawn':
      return 'border-amber-100/30 bg-[radial-gradient(circle_at_center,rgba(255,224,151,.42)_0_18%,transparent_19%),linear-gradient(180deg,rgba(141,104,65,.78),rgba(42,56,67,.88))]';
    case 'day':
      return 'border-amber-100/20 bg-[radial-gradient(circle_at_center,rgba(244,206,119,.32)_0_18%,transparent_19%),linear-gradient(180deg,rgba(111,96,60,.76),rgba(37,49,59,.88))]';
  }
}
