import {
  AbilityId,
  CardRole,
  type CardId,
  type GamePlayerViewV2,
  type PlayerGameAction,
} from '@twofold/shared-types';
import { AlertTriangle, LoaderCircle, RotateCcw } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/classnames';
import {
  DAY_ACTION_ABILITY,
  canStartDayAbility,
  createBloodMoonAction,
  createCouncilAccusationAction,
  createCouncilPassAction,
  createCouncilReactionAction,
  createCouncilReactionPassAction,
  createDayAbilityAction,
  createDayPassAction,
  createDefensePassAction,
  createDefenseProtectAction,
  createFinalGuessAction,
  createNightAbilityAction,
  createNightPassAction,
  createPurgeAction,
  getAbilitySources,
  getDayAbilityTargets,
  getPurgeRuleForRound,
  isLivingCard,
  type DayAbilityActionType,
  type NightAbilityId,
} from '../../features/game/action/game-action-model';
import type { GameSessionError } from '../../features/game/session/game-session-machine';
import {
  formatGamePhaseName,
  formatGameRoleName,
} from '../../features/game/presentation/game-display-labels';

export interface PrototypeGameInteractionProviderProps {
  readonly view: GamePlayerViewV2;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
  readonly canSubmit: boolean;
  readonly onSubmit: (action: PlayerGameAction) => void;
  readonly children: React.ReactNode;
}

type InteractionState =
  | { readonly kind: 'IDLE' }
  | { readonly kind: 'DAY_TARGET'; readonly actionType: DayAbilityActionType; readonly sourceId: CardId }
  | { readonly kind: 'NIGHT_TARGET'; readonly abilityId: NightAbilityId; readonly sourceId: CardId }
  | { readonly kind: 'BLOOD_MOON_TARGET' }
  | { readonly kind: 'DEFENSE_TARGET'; readonly sourceId: CardId }
  | { readonly kind: 'COUNCIL_VOTERS'; readonly voterIds: readonly CardId[] }
  | { readonly kind: 'COUNCIL_TARGET'; readonly voterIds: readonly CardId[] }
  | { readonly kind: 'COUNCIL_GUESS'; readonly voterIds: readonly CardId[]; readonly targetId: CardId }
  | { readonly kind: 'PURGE_OPPONENT'; readonly ownTargetId: CardId };

const DAY_CARD_ACTIONS = ['SHOOT', 'MARK', 'PURIFY', 'REVIVE'] as const;
const NIGHT_CARD_ABILITIES = [
  AbilityId.WEREWOLF_ATTACK,
  AbilityId.SEER_INSPECT,
  AbilityId.WITCH_POISON,
] as const;
const COUNCIL_VOTER_ROLES = new Set<CardRole>([
  CardRole.VILLAGER,
  CardRole.SEER,
  CardRole.GUARD,
  CardRole.WITCH,
  CardRole.SHOOTER,
  CardRole.AVENGER,
  CardRole.PRIEST,
]);
const IDLE_INTERACTION: InteractionState = { kind: 'IDLE' };

interface ScopedInteractionState {
  readonly scope: string;
  readonly interaction: InteractionState;
}

interface GameInteractionContextValue {
  readonly view: GamePlayerViewV2;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
  readonly canSubmit: boolean;
  readonly interaction: InteractionState;
  readonly selectableCardIds: ReadonlySet<CardId>;
  readonly selectedCardIds: ReadonlySet<CardId>;
  readonly selectCard: (cardId: CardId) => void;
  readonly setInteraction: React.Dispatch<React.SetStateAction<InteractionState>>;
  readonly submit: (action: PlayerGameAction) => void;
}

const GameInteractionContext = React.createContext<GameInteractionContextValue | null>(null);

/** Owns the prototype's click-through card selection flow for one phase. */
export function PrototypeGameInteractionProvider({
  view,
  pendingAction,
  error,
  canSubmit,
  onSubmit,
  children,
}: PrototypeGameInteractionProviderProps) {
  const interactionScope = `${view.round}:${view.phase.type}`;
  const [scopedInteraction, setScopedInteraction] =
    React.useState<ScopedInteractionState>(() => ({
      scope: interactionScope,
      interaction: IDLE_INTERACTION,
    }));
  const interaction =
    scopedInteraction.scope === interactionScope
      ? scopedInteraction.interaction
      : IDLE_INTERACTION;
  const setInteraction = React.useCallback<
    React.Dispatch<React.SetStateAction<InteractionState>>
  >(
    (nextInteraction) => {
      setScopedInteraction((current) => {
        const currentInteraction =
          current.scope === interactionScope
            ? current.interaction
            : IDLE_INTERACTION;
        return {
          scope: interactionScope,
          interaction:
            typeof nextInteraction === 'function'
              ? nextInteraction(currentInteraction)
              : nextInteraction,
        };
      });
    },
    [interactionScope]
  );
  const submit = React.useCallback((action: PlayerGameAction) => {
    if (!canSubmit) return;
    setInteraction({ kind: 'IDLE' });
    onSubmit(action);
  }, [canSubmit, onSubmit, setInteraction]);
  const selectableCardIds = getSelectableCardIds(view, interaction, canSubmit);
  const selectedCardIds = getSelectedCardIds(interaction);

  const selectCard = React.useCallback((cardId: CardId) => {
    if (!selectableCardIds.has(cardId) || !canSubmit) return;
    switch (interaction.kind) {
      case 'DAY_TARGET':
        submit(createDayAbilityAction(view.self.id, interaction.actionType, interaction.sourceId, cardId));
        return;
      case 'NIGHT_TARGET':
        submit(createNightAbilityAction(view.self.id, interaction.abilityId, interaction.sourceId, cardId));
        return;
      case 'BLOOD_MOON_TARGET':
        submit(createBloodMoonAction(view.self.id, cardId));
        return;
      case 'DEFENSE_TARGET':
        submit(createDefenseProtectAction(view.self.id, interaction.sourceId, cardId));
        return;
      case 'COUNCIL_VOTERS': {
        const selected = interaction.voterIds.includes(cardId)
          ? interaction.voterIds.filter((id) => id !== cardId)
          : interaction.voterIds.length < 3
            ? [...interaction.voterIds, cardId]
            : interaction.voterIds;
        setInteraction(
          getCouncilVotePower(view, selected) >= 3
            ? { kind: 'COUNCIL_TARGET', voterIds: selected }
            : { kind: 'COUNCIL_VOTERS', voterIds: selected }
        );
        return;
      }
      case 'COUNCIL_TARGET': {
        const target = view.opponent.board.find((card) => card.id === cardId);
        if (target?.state.visibility === 'REVEALED') {
          submit(createCouncilAccusationAction(view.self.id, cardId, null, interaction.voterIds));
        } else {
          setInteraction({ kind: 'COUNCIL_GUESS', voterIds: interaction.voterIds, targetId: cardId });
        }
        return;
      }
      case 'PURGE_OPPONENT':
        submit(createPurgeAction(view.self.id, {
          rule: 'SWAP',
          ownTargetId: interaction.ownTargetId,
          opponentTargetId: cardId,
        }));
        return;
      case 'IDLE': {
        const selection = getCardFirstSelection(view, cardId);
        if (selection?.kind === 'ACTION') submit(selection.action);
        else if (selection) setInteraction(selection.interaction);
        return;
      }
      case 'COUNCIL_GUESS':
        return;
    }
  }, [canSubmit, interaction, selectableCardIds, submit, view]);

  return (
    <GameInteractionContext.Provider value={{
      view, pendingAction, error, canSubmit, interaction,
      selectableCardIds, selectedCardIds, selectCard, setInteraction, submit,
    }}>
      {children}
    </GameInteractionContext.Provider>
  );
}

/** Card-facing selection state shared by both board rows. */
export function usePrototypeCardInteraction() {
  const context = useGameInteraction();
  return {
    selectableCardIds: context.selectableCardIds,
    selectedCardIds: context.selectedCardIds,
    selectCard: context.selectCard,
  };
}

/** Compact phase prompt; all source/target picking happens directly on cards. */
export function PrototypeGameActionPanel() {
  const context = useGameInteraction();
  const { view, pendingAction, error } = context;
  return (
    <section aria-label="Mệnh lệnh hiện tại" className="mx-auto w-full max-w-3xl rounded-xl border border-rose-200/20 bg-slate-950/75 px-4 py-3 shadow-xl shadow-slate-950/25 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-200">Mệnh lệnh hiện tại</p>
          <h2 className="text-sm font-black text-white">{formatGamePhaseName(view.phase.type)}</h2>
        </div>
        <PhaseControls context={context} />
      </div>
      {error ? (
        <p role="alert" className="mt-2 flex items-center justify-center gap-2 text-xs text-rose-100">
          <AlertTriangle className="h-4 w-4" /> {error.code ?? error.kind}: {error.message}
        </p>
      ) : null}
      {pendingAction ? (
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-rose-100">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Đang xác nhận lựa chọn…
        </p>
      ) : null}
    </section>
  );
}

function PhaseControls({ context }: { readonly context: GameInteractionContextValue }) {
  const { view, interaction, canSubmit, submit, setInteraction } = context;
  const disabled = !canSubmit;
  const cancel = () => setInteraction({ kind: 'IDLE' });

  if (interaction.kind !== 'IDLE') {
    if (interaction.kind === 'COUNCIL_GUESS') {
      return (
        <div className="flex max-w-2xl flex-wrap items-center justify-center gap-1.5">
          <Prompt text={`Đoán vai trò của ${interaction.targetId}`} />
          {Object.values(CardRole).map((role) => (
            <ActionButton key={role} label={formatGameRoleName(role)} disabled={disabled} onClick={() => submit(
              createCouncilAccusationAction(view.self.id, interaction.targetId, role, interaction.voterIds)
            )} />
          ))}
          <CancelButton onClick={cancel} />
        </div>
      );
    }
    if (interaction.kind === 'COUNCIL_VOTERS') {
      const votePower = getCouncilVotePower(view, interaction.voterIds);
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text={`Chọn tối đa 3 voter · tổng trọng số ${votePower}/3`} />
          <CancelButton onClick={cancel} />
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Prompt text={interactionPrompt(interaction)} />
        <CancelButton onClick={cancel} />
      </div>
    );
  }

  switch (view.phase.type) {
    case 'DAY_A':
    case 'DAY_B': {
      if (view.activePlayer !== view.self.id) return <Prompt text="Đang chờ lượt Ban ngày của đối thủ" />;
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text="Chọn lá đang phát sáng để dùng kỹ năng" />
          <ActionButton label="Bỏ lượt" tone="quiet" disabled={disabled} onClick={() => submit(createDayPassAction(view.self.id))} />
        </div>
      );
    }
    case 'NIGHT_PLAN': {
      const bloodMoon = view.self.specialAbilities.find((ability) => ability.abilityId === 'BLOOD_MOON');
      const bloodMoonReady = Boolean(bloodMoon && view.round >= bloodMoon.unlockRound && view.round >= bloodMoon.readyRound);
      if (view.self.submissions.night) return <Prompt text="Lệnh đêm đã khóa · đang chờ đối thủ" />;
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text="Chọn lá đang phát sáng để khóa lệnh đêm" />
          <ActionButton label="Huyết Nguyệt" disabled={disabled || !bloodMoonReady} onClick={() => setInteraction({ kind: 'BLOOD_MOON_TARGET' })} />
          <ActionButton label="Bỏ lượt" tone="quiet" disabled={disabled} onClick={() => submit(createNightPassAction(view.self.id))} />
        </div>
      );
    }
    case 'DUSK_DEFENSE':
      if (view.self.submissions.defense) return <Prompt text="Khiên đã khóa · đang chờ đối thủ" />;
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text="Chọn Bảo vệ đang phát sáng để đặt khiên" />
          <ActionButton label="Không đặt khiên" tone="quiet" disabled={disabled} onClick={() => submit(createDefensePassAction(view.self.id))} />
        </div>
      );
    case 'COUNCIL_PLAN':
      if (!view.self.submissions.council.accusation) {
        return <div className="flex flex-wrap items-center justify-center gap-2"><Prompt text="Chọn trực tiếp voter đang phát sáng · đủ 3 phiếu sẽ chọn mục tiêu" /><ActionButton label="Bỏ qua Hội đồng" tone="quiet" disabled={disabled} onClick={() => submit(createCouncilPassAction(view.self.id))} /></div>;
      }
      return <Prompt text="Hội đồng đã khóa · đang chờ đối thủ" />;
    case 'COUNCIL_REACTION': {
      if (view.self.submissions.council.pendingTargetId === null) {
        return <Prompt text="Đang chờ đối thủ quyết định phản ứng" />;
      }
      if (view.self.submissions.council.reaction) {
        return <Prompt text="Phản ứng đã khóa · đang chờ phân giải" />;
      }
      const canSacrifice = getAbilitySources(view, AbilityId.SUBSTITUTE_SACRIFICE)
        .some((card) => card.id !== view.self.submissions.council.pendingTargetId);
      return <div className="flex flex-wrap items-center justify-center gap-2"><Prompt text={canSacrifice ? 'Chọn trực tiếp Kẻ Thế Mạng đang phát sáng để chết thay' : 'Không có Kẻ Thế Mạng hợp lệ để chết thay'} /><ActionButton label="Từ chối" tone="quiet" disabled={disabled} onClick={() => submit(createCouncilReactionPassAction(view.self.id))} /></div>;
    }
    case 'PURGE_PLAN': {
      if (view.self.submissions.purge) return <Prompt text="Thanh trừng đã khóa · đang chờ đối thủ" />;
      const rule = getPurgeRuleForRound(view.round);
      const ownTargets = getPurgeOwnTargets(view, rule);
      const canSkip = (rule === 'REVEAL' && ownTargets.length === 0) || (rule === 'SWAP' && (ownTargets.length === 0 || view.opponent.board.every((card) => !isLivingCard(card))));
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text={`Thanh trừng ${rule} · chọn trực tiếp lá phát sáng`} />
          {canSkip ? <ActionButton label="Xác nhận không có mục tiêu" disabled={disabled} onClick={() => submit(rule === 'SWAP' ? createPurgeAction(view.self.id, { rule, ownTargetId: null, opponentTargetId: null }) : createPurgeAction(view.self.id, { rule: 'REVEAL', targetId: null }))} /> : null}
        </div>
      );
    }
    case 'FINAL_DUEL':
      if (view.self.submissions.finalGuess) return <Prompt text="Dự đoán đã khóa · đang chờ kết quả" />;
      return <div className="flex max-w-2xl flex-wrap items-center justify-center gap-1.5"><Prompt text="Đoán vai trò cuối của đối thủ" />{Object.values(CardRole).map((role) => <ActionButton key={role} label={formatGameRoleName(role)} disabled={disabled} onClick={() => submit(createFinalGuessAction(view.self.id, role))} />)}</div>;
    case 'COUNCIL_RESOLUTION':
    case 'NIGHT_RESOLUTION':
    case 'DAWN':
    case 'PURGE_RESOLUTION':
      return <Prompt text="Kết quả đang được công bố · thao tác tạm khóa" />;
    case 'SETUP':
      return <Prompt text="Sắp xếp và khóa bộ bài ở khu vực Setup" />;
    case 'ENDED':
      return <Prompt text="Trận đấu đã kết thúc" />;
  }
}

function getSelectableCardIds(view: GamePlayerViewV2, interaction: InteractionState, canSubmit: boolean): ReadonlySet<CardId> {
  if (!canSubmit) return new Set();
  switch (interaction.kind) {
    case 'DAY_TARGET': return cardIdSet(getDayAbilityTargets(view, interaction.actionType));
    case 'NIGHT_TARGET': return cardIdSet(view.opponent.board.filter(isLivingCard));
    case 'BLOOD_MOON_TARGET': return cardIdSet(view.opponent.board.filter((card) => isLivingCard(card) && card.state.visibility === 'REVEALED'));
    case 'DEFENSE_TARGET': {
      const source = view.self.board.find((card) => card.id === interaction.sourceId);
      const guard = source?.role.abilities.find((ability) => ability.abilityId === AbilityId.GUARD_PROTECT);
      const lastTarget = guard && 'lastTarget' in guard ? guard.lastTarget?.instanceId : null;
      return cardIdSet(view.self.board.filter((card) =>
        isLivingCard(card)
        && card.id !== interaction.sourceId
        && card.instanceId !== lastTarget
      ));
    }
    case 'COUNCIL_VOTERS': return cardIdSet(getCouncilEligibleVoters(view));
    case 'COUNCIL_TARGET': return cardIdSet(view.opponent.board.filter(isLivingCard));
    case 'PURGE_OPPONENT': return cardIdSet(view.opponent.board.filter(isLivingCard));
    case 'IDLE': return getIdleSelectableCardIds(view);
    case 'COUNCIL_GUESS': return new Set();
  }
}

function getIdleSelectableCardIds(view: GamePlayerViewV2): ReadonlySet<CardId> {
  switch (view.phase.type) {
    case 'DAY_A':
    case 'DAY_B':
      if (view.activePlayer !== view.self.id) return new Set();
      return cardIdSet(DAY_CARD_ACTIONS.flatMap((actionType) =>
        canStartDayAbility(view, actionType)
          ? getAbilitySources(view, DAY_ACTION_ABILITY[actionType])
          : []
      ));
    case 'NIGHT_PLAN':
      if (view.self.submissions.night) return new Set();
      return cardIdSet(NIGHT_CARD_ABILITIES.flatMap((abilityId) =>
        getAbilitySources(view, abilityId)
      ));
    case 'DUSK_DEFENSE':
      if (view.self.submissions.defense) return new Set();
      return cardIdSet(getAbilitySources(view, AbilityId.GUARD_PROTECT));
    case 'COUNCIL_PLAN':
      if (view.self.submissions.council.accusation) return new Set();
      return cardIdSet(getCouncilEligibleVoters(view));
    case 'COUNCIL_REACTION':
      if (
        view.self.submissions.council.pendingTargetId === null
        || view.self.submissions.council.reaction
      ) return new Set();
      return cardIdSet(getAvailableSubstitutes(view));
    case 'PURGE_PLAN':
      if (view.self.submissions.purge) return new Set();
      return cardIdSet(getPurgeOwnTargets(view, getPurgeRuleForRound(view.round)));
    default:
      return new Set();
  }
}

type CardFirstSelection =
  | { readonly kind: 'INTERACTION'; readonly interaction: InteractionState }
  | { readonly kind: 'ACTION'; readonly action: PlayerGameAction };

export function getCardFirstSelection(
  view: GamePlayerViewV2,
  sourceId: CardId
): CardFirstSelection | null {
  switch (view.phase.type) {
    case 'DAY_A':
    case 'DAY_B': {
      const actionType = DAY_CARD_ACTIONS.find((candidate) =>
        canStartDayAbility(view, candidate)
        && getAbilitySources(view, DAY_ACTION_ABILITY[candidate]).some((card) => card.id === sourceId)
      );
      return actionType
        ? { kind: 'INTERACTION', interaction: { kind: 'DAY_TARGET', actionType, sourceId } }
        : null;
    }
    case 'NIGHT_PLAN': {
      const abilityId = NIGHT_CARD_ABILITIES.find((candidate) =>
        getAbilitySources(view, candidate).some((card) => card.id === sourceId)
      );
      return abilityId
        ? { kind: 'INTERACTION', interaction: { kind: 'NIGHT_TARGET', abilityId, sourceId } }
        : null;
    }
    case 'DUSK_DEFENSE':
      return getAbilitySources(view, AbilityId.GUARD_PROTECT).some((card) => card.id === sourceId)
        ? { kind: 'INTERACTION', interaction: { kind: 'DEFENSE_TARGET', sourceId } }
        : null;
    case 'COUNCIL_PLAN':
      return getCouncilEligibleVoters(view).some((card) => card.id === sourceId)
        ? {
            kind: 'INTERACTION',
            interaction: getCouncilVotePower(view, [sourceId]) >= 3
              ? { kind: 'COUNCIL_TARGET', voterIds: [sourceId] }
              : { kind: 'COUNCIL_VOTERS', voterIds: [sourceId] },
          }
        : null;
    case 'COUNCIL_REACTION':
      return getAvailableSubstitutes(view).some((card) => card.id === sourceId)
        ? {
            kind: 'ACTION',
            action: createCouncilReactionAction(view.self.id, sourceId),
          }
        : null;
    case 'PURGE_PLAN': {
      const rule = getPurgeRuleForRound(view.round);
      if (!getPurgeOwnTargets(view, rule).some((card) => card.id === sourceId)) {
        return null;
      }
      if (rule === 'SWAP') {
        return {
          kind: 'INTERACTION',
          interaction: { kind: 'PURGE_OPPONENT', ownTargetId: sourceId },
        };
      }
      if (rule === 'CUT') {
        return {
          kind: 'ACTION',
          action: createPurgeAction(view.self.id, { rule, targetId: sourceId }),
        };
      }
      if (rule === 'REVEAL') {
        return {
          kind: 'ACTION',
          action: createPurgeAction(view.self.id, { rule, targetId: sourceId }),
        };
      }
      return {
        kind: 'ACTION',
        action: createPurgeAction(view.self.id, { rule: 'LOCK', targetId: sourceId }),
      };
    }
    default:
      return null;
  }
}

function getSelectedCardIds(interaction: InteractionState): ReadonlySet<CardId> {
  switch (interaction.kind) {
    case 'DAY_TARGET':
    case 'NIGHT_TARGET':
    case 'DEFENSE_TARGET': return new Set([interaction.sourceId]);
    case 'COUNCIL_VOTERS':
    case 'COUNCIL_TARGET': return new Set(interaction.voterIds);
    case 'COUNCIL_GUESS': return new Set([...interaction.voterIds, interaction.targetId]);
    case 'PURGE_OPPONENT': return new Set([interaction.ownTargetId]);
    default: return new Set();
  }
}

function getCouncilVotePower(
  view: GamePlayerViewV2,
  voterIds: readonly CardId[]
): number {
  const voterIdSet = new Set(voterIds);
  return view.self.board.reduce(
    (total, card) =>
      voterIdSet.has(card.id)
        ? total + (card.role.id === CardRole.VILLAGER ? 2 : 1)
        : total,
    0
  );
}

function getPurgeOwnTargets(view: GamePlayerViewV2, rule: ReturnType<typeof getPurgeRuleForRound>) {
  return view.self.board.filter((card) => isLivingCard(card) && (rule !== 'REVEAL' || card.state.visibility === 'HIDDEN'));
}

function getCouncilEligibleVoters(view: GamePlayerViewV2) {
  return view.self.board.filter((card) =>
    isLivingCard(card)
    && COUNCIL_VOTER_ROLES.has(card.role.id)
    && !card.effects.some((effect) =>
      effect.kind === 'COUNCIL_LOCK'
      || effect.kind === 'PURGE_LOCK'
      || effect.kind === 'ROUND_EXHAUSTED'
    )
  );
}

function getAvailableSubstitutes(view: GamePlayerViewV2) {
  return getAbilitySources(view, AbilityId.SUBSTITUTE_SACRIFICE)
    .filter((card) => card.id !== view.self.submissions.council.pendingTargetId);
}

function cardIdSet(cards: readonly { readonly id: CardId }[]): ReadonlySet<CardId> {
  return new Set(cards.map((card) => card.id));
}

function useGameInteraction(): GameInteractionContextValue {
  const context = React.useContext(GameInteractionContext);
  if (!context) throw new Error('Prototype game interaction requires its provider.');
  return context;
}

function interactionPrompt(interaction: InteractionState): string {
  switch (interaction.kind) {
    case 'DAY_TARGET':
    case 'NIGHT_TARGET': return `Bước 2 · ${interaction.sourceId} đã chọn, nhấp lá mục tiêu`;
    case 'BLOOD_MOON_TARGET': return 'Chọn một role đối thủ đã lộ';
    case 'DEFENSE_TARGET': return `Bước 2 · Chọn lá nhận khiên từ ${interaction.sourceId}`;
    case 'COUNCIL_TARGET': return 'Đủ trọng số · chọn một lá đối thủ';
    case 'PURGE_OPPONENT': return `${interaction.ownTargetId} đã chọn · chọn lá đối thủ để SWAP`;
    default: return '';
  }
}

function Prompt({ text }: { readonly text: string }) {
  return <strong className="text-xs leading-relaxed text-white">{text}</strong>;
}

function ActionButton({ label, onClick, disabled, tone = 'primary', icon }: { readonly label: string; readonly onClick: () => void; readonly disabled: boolean; readonly tone?: 'primary' | 'quiet'; readonly icon?: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 ${tone === 'primary' ? 'border-rose-200/35 bg-rose-400/15 text-rose-50 hover:bg-rose-400/25' : 'border-white/15 bg-black/15 text-slate-200 hover:bg-white/10'}`}>{icon}{label}</button>;
}

function CancelButton({ onClick }: { readonly onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-[10px] font-bold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98]"><RotateCcw className="h-3 w-3" /> Chọn lại</button>;
}
