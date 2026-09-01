import {
  AbilityId,
  CardRole,
  type CardId,
  type GamePlayerViewV2,
  type PlayerGameAction,
} from '@twofold/shared-types';
import { AlertTriangle, LoaderCircle, RotateCcw, Shield } from 'lucide-react';
import * as React from 'react';
import {
  DAY_ACTION_ABILITY,
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
  getPurgeRuleForRound,
  isLivingCard,
  type DayAbilityActionType,
  type NightAbilityId,
} from '../../features/game/action/game-action-model';
import type { GameSessionError } from '../../features/game/session/game-session-machine';
import { formatGameRoleName } from '../../features/game/presentation/game-display-labels';

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
  | { readonly kind: 'DAY_SOURCE'; readonly actionType: DayAbilityActionType }
  | { readonly kind: 'DAY_TARGET'; readonly actionType: DayAbilityActionType; readonly sourceId: CardId }
  | { readonly kind: 'NIGHT_SOURCE'; readonly abilityId: NightAbilityId }
  | { readonly kind: 'NIGHT_TARGET'; readonly abilityId: NightAbilityId; readonly sourceId: CardId }
  | { readonly kind: 'BLOOD_MOON_TARGET' }
  | { readonly kind: 'DEFENSE_SOURCE' }
  | { readonly kind: 'DEFENSE_TARGET'; readonly sourceId: CardId }
  | { readonly kind: 'COUNCIL_VOTERS'; readonly voterIds: readonly CardId[] }
  | { readonly kind: 'COUNCIL_TARGET'; readonly voterIds: readonly CardId[] }
  | { readonly kind: 'COUNCIL_GUESS'; readonly voterIds: readonly CardId[]; readonly targetId: CardId }
  | { readonly kind: 'REACTION_SOURCE' }
  | { readonly kind: 'REACTION_TARGET'; readonly sourceId: CardId }
  | { readonly kind: 'PURGE_OWN' }
  | { readonly kind: 'PURGE_OPPONENT'; readonly ownTargetId: CardId };

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
  const [interaction, setInteraction] = React.useState<InteractionState>({ kind: 'IDLE' });
  const submit = React.useCallback((action: PlayerGameAction) => {
    if (!canSubmit) return;
    setInteraction({ kind: 'IDLE' });
    onSubmit(action);
  }, [canSubmit, onSubmit]);
  const selectableCardIds = getSelectableCardIds(view, interaction, canSubmit);
  const selectedCardIds = getSelectedCardIds(interaction);

  const selectCard = React.useCallback((cardId: CardId) => {
    if (!selectableCardIds.has(cardId) || !canSubmit) return;
    switch (interaction.kind) {
      case 'DAY_SOURCE':
        setInteraction({ kind: 'DAY_TARGET', actionType: interaction.actionType, sourceId: cardId });
        return;
      case 'DAY_TARGET':
        submit(createDayAbilityAction(view.self.id, interaction.actionType, interaction.sourceId, cardId));
        return;
      case 'NIGHT_SOURCE':
        setInteraction({ kind: 'NIGHT_TARGET', abilityId: interaction.abilityId, sourceId: cardId });
        return;
      case 'NIGHT_TARGET':
        submit(createNightAbilityAction(view.self.id, interaction.abilityId, interaction.sourceId, cardId));
        return;
      case 'BLOOD_MOON_TARGET':
        submit(createBloodMoonAction(view.self.id, cardId));
        return;
      case 'DEFENSE_SOURCE':
        setInteraction({ kind: 'DEFENSE_TARGET', sourceId: cardId });
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
        setInteraction({ kind: 'COUNCIL_VOTERS', voterIds: selected });
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
      case 'REACTION_SOURCE':
        setInteraction({ kind: 'REACTION_TARGET', sourceId: cardId });
        return;
      case 'REACTION_TARGET':
        submit(createCouncilReactionAction(view.self.id, interaction.sourceId, cardId));
        return;
      case 'PURGE_OWN': {
        const rule = getPurgeRuleForRound(view.round);
        if (rule === 'SWAP') {
          setInteraction({ kind: 'PURGE_OPPONENT', ownTargetId: cardId });
          return;
        }
        if (rule === 'CUT') {
          submit(createPurgeAction(view.self.id, { rule, targetId: cardId }));
          return;
        }
        if (rule === 'REVEAL') {
          submit(createPurgeAction(view.self.id, { rule, targetId: cardId }));
          return;
        }
        submit(createPurgeAction(view.self.id, { rule: 'LOCK', targetId: cardId }));
        return;
      }
      case 'PURGE_OPPONENT':
        submit(createPurgeAction(view.self.id, {
          rule: 'SWAP',
          ownTargetId: interaction.ownTargetId,
          opponentTargetId: cardId,
        }));
        return;
      case 'IDLE':
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
    <section aria-label="Mệnh lệnh hiện tại" className="mx-auto w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-200">Vòng {view.round}</p>
          <h2 className="text-sm font-black text-white">{phaseTitle(view.phase.type)}</h2>
        </div>
        <PhaseControls context={context} />
      </div>
      {error ? (
        <p role="alert" className="mt-2 flex items-center justify-center gap-2 text-xs text-rose-100">
          <AlertTriangle className="h-4 w-4" /> {error.code ?? error.kind}: {error.message}
        </p>
      ) : null}
      {pendingAction ? (
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-indigo-100">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Server đang xác nhận {pendingAction.type}…
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
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text={`Chọn đúng 3 voter trên hàng của bạn · ${interaction.voterIds.length}/3`} />
          <ActionButton label="Chọn mục tiêu" disabled={disabled || interaction.voterIds.length !== 3} onClick={() => setInteraction({ kind: 'COUNCIL_TARGET', voterIds: interaction.voterIds })} />
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
      const actions = [
        ['SHOOT', 'Xạ thủ bắn'], ['MARK', 'Đánh dấu báo thù'],
        ['PURIFY', 'Thanh tẩy'], ['REVIVE', 'Hồi sinh'],
      ] as const;
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text="Chọn kỹ năng, sau đó nhấp source và target đang phát sáng" />
          {actions.map(([actionType, label]) => (
            <ActionButton key={actionType} label={label} disabled={disabled || getAbilitySources(view, DAY_ACTION_ABILITY[actionType]).length === 0} onClick={() => setInteraction({ kind: 'DAY_SOURCE', actionType })} />
          ))}
          <ActionButton label="Bỏ lượt" tone="quiet" disabled={disabled} onClick={() => submit(createDayPassAction(view.self.id))} />
        </div>
      );
    }
    case 'NIGHT_PLAN': {
      const actions = [
        [AbilityId.WEREWOLF_ATTACK, 'Ma sói tấn công'],
        [AbilityId.SEER_INSPECT, 'Tiên tri soi'],
        [AbilityId.WITCH_POISON, 'Phù thủy dùng độc'],
      ] as const;
      const bloodMoon = view.self.specialAbilities.find((ability) => ability.abilityId === 'BLOOD_MOON');
      const bloodMoonReady = Boolean(bloodMoon && view.round >= bloodMoon.unlockRound && view.round >= bloodMoon.readyRound);
      if (view.self.submissions.night) return <Prompt text="Lệnh đêm đã khóa · đang chờ đối thủ" />;
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text="Chọn nguồn lệnh rồi nhấp mục tiêu đối thủ" />
          {actions.map(([abilityId, label]) => (
            <ActionButton key={abilityId} label={label} disabled={disabled || getAbilitySources(view, abilityId).length === 0} onClick={() => setInteraction({ kind: 'NIGHT_SOURCE', abilityId })} />
          ))}
          <ActionButton label="Blood Moon" disabled={disabled || !bloodMoonReady} onClick={() => setInteraction({ kind: 'BLOOD_MOON_TARGET' })} />
          <ActionButton label="Bỏ lượt" tone="quiet" disabled={disabled} onClick={() => submit(createNightPassAction(view.self.id))} />
        </div>
      );
    }
    case 'DUSK_DEFENSE':
      if (view.self.submissions.defense) return <Prompt text="Khiên đã khóa · đang chờ đối thủ" />;
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text="Chọn Bảo vệ rồi nhấp một lá khác bên mình" />
          <ActionButton icon={<Shield className="h-3.5 w-3.5" />} label="Đặt khiên" disabled={disabled || getAbilitySources(view, AbilityId.GUARD_PROTECT).length === 0} onClick={() => setInteraction({ kind: 'DEFENSE_SOURCE' })} />
          <ActionButton label="Không đặt khiên" tone="quiet" disabled={disabled} onClick={() => submit(createDefensePassAction(view.self.id))} />
        </div>
      );
    case 'COUNCIL_PLAN':
      if (!view.self.submissions.council.accusation) {
        return <div className="flex flex-wrap items-center justify-center gap-2"><Prompt text="Lập Hội đồng bằng ba lá phe mình" /><ActionButton label="Chọn 3 người" disabled={disabled} onClick={() => setInteraction({ kind: 'COUNCIL_VOTERS', voterIds: [] })} /><ActionButton label="Bỏ qua Hội đồng" tone="quiet" disabled={disabled} onClick={() => submit(createCouncilPassAction(view.self.id))} /></div>;
      }
      if (!view.self.submissions.council.reaction) {
        const canRescue = getAbilitySources(view, AbilityId.WOLF_GUARD_RESCUE).length > 0;
        return <div className="flex flex-wrap items-center justify-center gap-2"><Prompt text="Phản ứng Sói Hộ Vệ độc lập với cáo buộc" /><ActionButton label="Bảo kê" disabled={disabled || !canRescue} onClick={() => setInteraction({ kind: 'REACTION_SOURCE' })} /><ActionButton label="Không bảo kê" tone="quiet" disabled={disabled} onClick={() => submit(createCouncilReactionPassAction(view.self.id))} /></div>;
      }
      return <Prompt text="Hội đồng đã khóa · đang chờ đối thủ" />;
    case 'PURGE_PLAN': {
      if (view.self.submissions.purge) return <Prompt text="Thanh trừng đã khóa · đang chờ đối thủ" />;
      const rule = getPurgeRuleForRound(view.round);
      const ownTargets = getPurgeOwnTargets(view, rule);
      const canSkip = (rule === 'REVEAL' && ownTargets.length === 0) || (rule === 'SWAP' && (ownTargets.length === 0 || view.opponent.board.every((card) => !isLivingCard(card))));
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Prompt text={`Thanh trừng ${rule} · chọn trực tiếp lá phát sáng`} />
          {canSkip ? <ActionButton label="Xác nhận không có mục tiêu" disabled={disabled} onClick={() => submit(rule === 'SWAP' ? createPurgeAction(view.self.id, { rule, ownTargetId: null, opponentTargetId: null }) : createPurgeAction(view.self.id, { rule: 'REVEAL', targetId: null }))} /> : <ActionButton label="Bắt đầu chọn" disabled={disabled} onClick={() => setInteraction({ kind: 'PURGE_OWN' })} />}
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
      return <Prompt text="Server đang công bố kết quả · thao tác tạm khóa" />;
    case 'SETUP':
      return <Prompt text="Sắp xếp và khóa bộ bài ở khu vực Setup" />;
    case 'ENDED':
      return <Prompt text="Trận đấu đã kết thúc" />;
  }
}

function getSelectableCardIds(view: GamePlayerViewV2, interaction: InteractionState, canSubmit: boolean): ReadonlySet<CardId> {
  if (!canSubmit) return new Set();
  switch (interaction.kind) {
    case 'DAY_SOURCE': return cardIdSet(getAbilitySources(view, DAY_ACTION_ABILITY[interaction.actionType]));
    case 'DAY_TARGET': return cardIdSet(interaction.actionType === 'REVIVE' ? view.self.board.filter((card) => !isLivingCard(card)) : view.opponent.board.filter((card) => isLivingCard(card) && (interaction.actionType !== 'SHOOT' || card.state.visibility === 'REVEALED')));
    case 'NIGHT_SOURCE': return cardIdSet(getAbilitySources(view, interaction.abilityId));
    case 'NIGHT_TARGET': return cardIdSet(view.opponent.board.filter(isLivingCard));
    case 'BLOOD_MOON_TARGET': return cardIdSet(view.opponent.board.filter((card) => isLivingCard(card) && card.state.visibility === 'REVEALED'));
    case 'DEFENSE_SOURCE': return cardIdSet(getAbilitySources(view, AbilityId.GUARD_PROTECT));
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
    case 'COUNCIL_VOTERS': return cardIdSet(view.self.board.filter((card) => isLivingCard(card) && !card.effects.some((effect) => effect.kind === 'COUNCIL_LOCK' || effect.kind === 'PURGE_LOCK')));
    case 'COUNCIL_TARGET': return cardIdSet(view.opponent.board.filter(isLivingCard));
    case 'REACTION_SOURCE': return cardIdSet(getAbilitySources(view, AbilityId.WOLF_GUARD_RESCUE));
    case 'REACTION_TARGET': return cardIdSet(view.self.board.filter(isLivingCard));
    case 'PURGE_OWN': return cardIdSet(getPurgeOwnTargets(view, getPurgeRuleForRound(view.round)));
    case 'PURGE_OPPONENT': return cardIdSet(view.opponent.board.filter(isLivingCard));
    case 'IDLE':
    case 'COUNCIL_GUESS': return new Set();
  }
}

function getSelectedCardIds(interaction: InteractionState): ReadonlySet<CardId> {
  switch (interaction.kind) {
    case 'DAY_TARGET':
    case 'NIGHT_TARGET':
    case 'DEFENSE_TARGET':
    case 'REACTION_TARGET': return new Set([interaction.sourceId]);
    case 'COUNCIL_VOTERS':
    case 'COUNCIL_TARGET': return new Set(interaction.voterIds);
    case 'COUNCIL_GUESS': return new Set([...interaction.voterIds, interaction.targetId]);
    case 'PURGE_OPPONENT': return new Set([interaction.ownTargetId]);
    default: return new Set();
  }
}

function getPurgeOwnTargets(view: GamePlayerViewV2, rule: ReturnType<typeof getPurgeRuleForRound>) {
  return view.self.board.filter((card) => isLivingCard(card) && (rule !== 'REVEAL' || card.state.visibility === 'HIDDEN'));
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
    case 'DAY_SOURCE':
    case 'NIGHT_SOURCE': return 'Bước 1 · Chọn lá nguồn đang phát sáng';
    case 'DAY_TARGET':
    case 'NIGHT_TARGET': return `Bước 2 · ${interaction.sourceId} đã chọn, nhấp lá mục tiêu`;
    case 'BLOOD_MOON_TARGET': return 'Chọn một role đối thủ đã lộ';
    case 'DEFENSE_SOURCE': return 'Bước 1 · Chọn Bảo vệ đang phát sáng';
    case 'DEFENSE_TARGET': return `Bước 2 · Chọn lá nhận khiên từ ${interaction.sourceId}`;
    case 'COUNCIL_TARGET': return 'Đủ 3 voter · chọn một lá đối thủ';
    case 'REACTION_SOURCE': return 'Chọn Sói Hộ Vệ đang phát sáng';
    case 'REACTION_TARGET': return `Chọn lá được ${interaction.sourceId} bảo kê`;
    case 'PURGE_OWN': return 'Chọn một lá phe mình đang phát sáng';
    case 'PURGE_OPPONENT': return `${interaction.ownTargetId} đã chọn · chọn lá đối thủ để SWAP`;
    default: return '';
  }
}

function phaseTitle(phase: GamePlayerViewV2['phase']['type']): string {
  return ({ SETUP: 'Chuẩn bị đội hình', DAY_A: 'Ban ngày · lượt A', DAY_B: 'Ban ngày · lượt B', COUNCIL_PLAN: 'Hội đồng treo cổ', COUNCIL_RESOLUTION: 'Công bố Hội đồng', NIGHT_PLAN: 'Khóa lệnh đêm', DUSK_DEFENSE: 'Chạng vạng · đặt khiên', NIGHT_RESOLUTION: 'Phán xét trong đêm', DAWN: 'Bình minh hé lộ', PURGE_PLAN: 'Thanh trừng', PURGE_RESOLUTION: 'Công bố Thanh trừng', FINAL_DUEL: 'Final Duel', ENDED: 'Kết thúc' } as const)[phase];
}

function Prompt({ text }: { readonly text: string }) {
  return <strong className="text-xs leading-relaxed text-white">{text}</strong>;
}

function ActionButton({ label, onClick, disabled, tone = 'primary', icon }: { readonly label: string; readonly onClick: () => void; readonly disabled: boolean; readonly tone?: 'primary' | 'quiet'; readonly icon?: React.ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${tone === 'primary' ? 'border-amber-200/35 bg-amber-300/20 text-amber-50 hover:bg-amber-300/30' : 'border-white/15 bg-black/15 text-slate-200 hover:bg-white/10'}`}>{icon}{label}</button>;
}

function CancelButton({ onClick }: { readonly onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold text-slate-200 hover:bg-white/10"><RotateCcw className="h-3 w-3" /> Chọn lại</button>;
}
