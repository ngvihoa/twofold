import {
  AbilityId,
  CardRole,
  type CardId,
  type GamePlayerViewV2,
  type PlayerGameAction,
  type PrivateCardViewV2,
  type PublicCardViewV2,
} from '@twofold/shared-types';
import { AlertTriangle, LoaderCircle, Send, Shield, Swords } from 'lucide-react';
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

export interface PrototypeGameActionPanelProps {
  readonly view: GamePlayerViewV2;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
  readonly canSubmit: boolean;
  readonly onSubmit: (action: PlayerGameAction) => void;
}

interface PhaseFormProps {
  readonly view: GamePlayerViewV2;
  readonly disabled: boolean;
  readonly onSubmit: (action: PlayerGameAction) => void;
}

type SelectableCard = PrivateCardViewV2 | PublicCardViewV2;

const CONTROL_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-40';
const BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40';

function CardSelect({
  cards,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  readonly cards: readonly SelectableCard[];
  readonly value: string;
  readonly onChange: (value: CardId) => void;
  readonly placeholder: string;
  readonly disabled?: boolean;
}) {
  return (
    <select
      className={CONTROL_CLASS}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as CardId)}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {cards.map((card) => {
        const role =
          card.role && typeof card.role === 'object' ? card.role.id : card.role;
        return (
          <option key={card.id} value={card.id}>
            {card.id}{role ? ` · ${role}` : ''}
          </option>
        );
      })}
    </select>
  );
}

/**
 * Command dock mô phỏng prototype; chỉ emit typed command về session actor.
 *
 * Component không resolve rule và không optimistic-update authoritative view.
 */
export function PrototypeGameActionPanel({
  view,
  pendingAction,
  error,
  canSubmit,
  onSubmit,
}: PrototypeGameActionPanelProps) {
  const disabled = !canSubmit;
  return (
    <section
      aria-label="Mệnh lệnh hiện tại"
      className="mx-auto flex w-full max-w-2xl min-h-0 flex-col gap-4 rounded-xl border border-slate-700/70 bg-slate-950/85 p-4 shadow-2xl shadow-black/30"
    >
      <header className="border-b border-slate-800 pb-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
          Mệnh lệnh hiện tại
        </p>
        <h2 className="mt-1 text-base font-bold text-slate-100">{view.phase.type}</h2>
        <p className="mt-1 text-xs text-slate-400">Vòng {view.round}</p>
      </header>

      {error ? (
        <div role="alert" className="flex gap-2 rounded-lg bg-rose-950/40 p-3 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error.code ?? error.kind}: {error.message}</span>
        </div>
      ) : null}

      {pendingAction ? (
        <div className="flex items-center gap-2 rounded-lg bg-indigo-950/50 p-3 text-xs text-indigo-200">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Đang chờ server xác nhận {pendingAction.type}…
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        <PhaseActionForm
          key={view.phase.type}
          view={view}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      </div>
    </section>
  );
}

function PhaseActionForm(props: PhaseFormProps) {
  switch (props.view.phase.type) {
    case 'DAY_A':
    case 'DAY_B':
      return <DayActionForm {...props} />;
    case 'COUNCIL_PLAN':
      return <CouncilActionForm {...props} />;
    case 'NIGHT_PLAN':
      return <NightActionForm {...props} />;
    case 'DUSK_DEFENSE':
      return <DefenseActionForm {...props} />;
    case 'PURGE_PLAN':
      return <PurgeActionForm {...props} />;
    case 'FINAL_DUEL':
      return <FinalDuelActionForm {...props} />;
    case 'SETUP':
      return <WaitingPanel message="Setup dùng panel sắp xếp riêng." />;
    case 'COUNCIL_RESOLUTION':
    case 'NIGHT_RESOLUTION':
    case 'DAWN':
    case 'PURGE_RESOLUTION':
      return <WaitingPanel message="Server đang resolve phase; không có action để submit." />;
    case 'ENDED':
      return <WaitingPanel message="Trận đấu đã kết thúc." />;
  }
}

function DayActionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const [kind, setKind] = React.useState<'PASS' | DayAbilityActionType>('PASS');
  const [sourceId, setSourceId] = React.useState<CardId | ''>('');
  const [targetId, setTargetId] = React.useState<CardId | ''>('');
  const myTurn = view.activePlayer === view.self.id;
  const sources = kind === 'PASS' ? [] : getAbilitySources(view, DAY_ACTION_ABILITY[kind]);
  const targets = kind === 'REVIVE'
    ? view.self.board.filter((card) => !isLivingCard(card))
    : view.opponent.board.filter(
        (card) => isLivingCard(card) && (kind !== 'SHOOT' || card.state.visibility === 'REVEALED')
      );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (kind === 'PASS') return onSubmit(createDayPassAction(view.self.id));
    if (!sourceId || !targetId) return;
    onSubmit(createDayAbilityAction(view.self.id, kind, sourceId, targetId));
  };

  if (!myTurn) return <WaitingPanel message="Đang chờ Day turn của đối thủ." />;
  return (
    <form className="space-y-3" onSubmit={submit}>
      <label className="block text-xs text-slate-400">
        Hành động
        <select
          className={`${CONTROL_CLASS} mt-1`}
          value={kind}
          disabled={disabled}
          onChange={(event) => {
            setKind(event.target.value as 'PASS' | DayAbilityActionType);
            setSourceId('');
            setTargetId('');
          }}
        >
          <option value="PASS">Bỏ lượt</option>
          <option value="SHOOT">Xạ thủ bắn</option>
          <option value="MARK">Đánh dấu báo thù</option>
          <option value="PURIFY">Thanh tẩy</option>
          <option value="REVIVE">Hồi sinh</option>
        </select>
      </label>
      {kind !== 'PASS' ? (
        <>
          <CardSelect cards={sources} value={sourceId} onChange={setSourceId} placeholder="Chọn source" disabled={disabled} />
          <CardSelect cards={targets} value={targetId} onChange={setTargetId} placeholder="Chọn target" disabled={disabled} />
        </>
      ) : null}
      <SubmitButton disabled={disabled || (kind !== 'PASS' && (!sourceId || !targetId))} label="Gửi Day action" />
    </form>
  );
}

function CouncilActionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  return (
    <div className="space-y-5">
      <CouncilAccusationForm view={view} disabled={disabled} onSubmit={onSubmit} />
      <div className="border-t border-slate-800" />
      <CouncilReactionForm view={view} disabled={disabled} onSubmit={onSubmit} />
    </div>
  );
}

function CouncilAccusationForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const [targetId, setTargetId] = React.useState<CardId | ''>('');
  const [guess, setGuess] = React.useState<CardRole>(CardRole.WEREWOLF);
  const [voters, setVoters] = React.useState<readonly [string, string, string]>(['', '', '']);
  const submitted = view.self.submissions.council.accusation !== null;
  const targets = view.opponent.board.filter(isLivingCard);
  const voterOptions = view.self.board.filter(
    (card) => isLivingCard(card) && !card.effects.some((effect) => effect.kind === 'COUNCIL_LOCK' || effect.kind === 'PURGE_LOCK')
  );
  const target = view.opponent.board.find((card) => card.id === targetId);
  const validVoters = voters.every(Boolean) && new Set(voters).size === 3;

  if (submitted) return <SubmittedPanel label="Council accusation đã gửi" />;
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!targetId || !validVoters) return;
        onSubmit(
          createCouncilAccusationAction(
            view.self.id,
            targetId,
            target?.state.visibility === 'REVEALED' ? null : guess,
            voters as readonly CardId[]
          )
        );
      }}
    >
      <h3 className="text-xs font-bold text-slate-200">Cáo buộc</h3>
      <CardSelect cards={targets} value={targetId} onChange={setTargetId} placeholder="Chọn target" disabled={disabled} />
      {target?.state.visibility !== 'REVEALED' ? (
        <RoleSelect value={guess} onChange={setGuess} disabled={disabled} />
      ) : null}
      {voters.map((voterId, index) => (
        <CardSelect
          key={index}
          cards={voterOptions}
          value={voterId}
          onChange={(value) => setVoters((current) => current.map((item, itemIndex) => itemIndex === index ? value : item) as [string, string, string])}
          placeholder={`Voter ${index + 1}`}
          disabled={disabled}
        />
      ))}
      <div className="flex gap-2">
        <button type="button" className={BUTTON_CLASS} disabled={disabled} onClick={() => onSubmit(createCouncilPassAction(view.self.id))}>Pass</button>
        <SubmitButton disabled={disabled || !targetId || !validVoters} label="Gửi cáo buộc" />
      </div>
    </form>
  );
}

function CouncilReactionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const [sourceId, setSourceId] = React.useState<CardId | ''>('');
  const [targetId, setTargetId] = React.useState<CardId | ''>('');
  const submitted = view.self.submissions.council.reaction !== null;
  const sources = getAbilitySources(view, AbilityId.WOLF_GUARD_RESCUE);
  const targets = view.self.board.filter(isLivingCard);

  if (submitted) return <SubmittedPanel label="Council reaction đã gửi" />;
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!sourceId || !targetId) return;
        onSubmit(createCouncilReactionAction(view.self.id, sourceId, targetId));
      }}
    >
      <h3 className="text-xs font-bold text-slate-200">Phản ứng Sói Hộ Vệ</h3>
      <CardSelect cards={sources} value={sourceId} onChange={setSourceId} placeholder="Chọn Sói Hộ Vệ" disabled={disabled} />
      <CardSelect cards={targets} value={targetId} onChange={setTargetId} placeholder="Chọn target phe mình" disabled={disabled} />
      <div className="flex gap-2">
        <button type="button" className={BUTTON_CLASS} disabled={disabled} onClick={() => onSubmit(createCouncilReactionPassAction(view.self.id))}>Pass</button>
        <SubmitButton disabled={disabled || !sourceId || !targetId} label="Gửi phản ứng" />
      </div>
    </form>
  );
}

function NightActionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const [kind, setKind] = React.useState<'PASS' | 'BLOOD_MOON' | NightAbilityId>('PASS');
  const [sourceId, setSourceId] = React.useState<CardId | ''>('');
  const [targetId, setTargetId] = React.useState<CardId | ''>('');
  if (view.self.submissions.night !== null) return <SubmittedPanel label="Night order đã gửi" />;

  const abilitySources = kind === 'PASS' || kind === 'BLOOD_MOON' ? [] : getAbilitySources(view, kind);
  const targets = view.opponent.board.filter(
    (card) => isLivingCard(card) && (kind !== 'BLOOD_MOON' || card.state.visibility === 'REVEALED')
  );
  const bloodMoon = view.self.specialAbilities.find((ability) => ability.abilityId === 'BLOOD_MOON');
  const bloodMoonReady = Boolean(bloodMoon && view.round >= bloodMoon.unlockRound && view.round >= bloodMoon.readyRound);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (kind === 'PASS') return onSubmit(createNightPassAction(view.self.id));
        if (!targetId) return;
        if (kind === 'BLOOD_MOON') return onSubmit(createBloodMoonAction(view.self.id, targetId));
        if (!sourceId) return;
        onSubmit(createNightAbilityAction(view.self.id, kind, sourceId, targetId));
      }}
    >
      <select className={CONTROL_CLASS} value={kind} disabled={disabled} onChange={(event) => { setKind(event.target.value as typeof kind); setSourceId(''); setTargetId(''); }}>
        <option value="PASS">Bỏ lượt</option>
        <option value={AbilityId.WEREWOLF_ATTACK}>Ma sói tấn công</option>
        <option value={AbilityId.SEER_INSPECT}>Tiên tri soi</option>
        <option value={AbilityId.WITCH_POISON}>Phù thủy dùng độc</option>
        <option value="BLOOD_MOON" disabled={!bloodMoonReady}>Blood Moon</option>
      </select>
      {kind !== 'PASS' && kind !== 'BLOOD_MOON' ? (
        <CardSelect cards={abilitySources} value={sourceId} onChange={setSourceId} placeholder="Chọn source" disabled={disabled} />
      ) : null}
      {kind !== 'PASS' ? <CardSelect cards={targets} value={targetId} onChange={setTargetId} placeholder="Chọn target" disabled={disabled} /> : null}
      <SubmitButton disabled={disabled || (kind !== 'PASS' && (!targetId || (kind !== 'BLOOD_MOON' && !sourceId)))} label="Gửi Night order" />
    </form>
  );
}

function DefenseActionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const [sourceId, setSourceId] = React.useState<CardId | ''>('');
  const [targetId, setTargetId] = React.useState<CardId | ''>('');
  if (view.self.submissions.defense !== null) return <SubmittedPanel label="Defense order đã gửi" />;
  const sources = getAbilitySources(view, AbilityId.GUARD_PROTECT);
  const targets = view.self.board.filter((card) => isLivingCard(card) && card.id !== sourceId);
  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (sourceId && targetId) onSubmit(createDefenseProtectAction(view.self.id, sourceId, targetId)); }}>
      <CardSelect cards={sources} value={sourceId} onChange={(value) => { setSourceId(value); if (value === targetId) setTargetId(''); }} placeholder="Chọn Bảo vệ" disabled={disabled} />
      <CardSelect cards={targets} value={targetId} onChange={setTargetId} placeholder="Chọn target phe mình" disabled={disabled} />
      <div className="flex gap-2">
        <button type="button" className={BUTTON_CLASS} disabled={disabled} onClick={() => onSubmit(createDefensePassAction(view.self.id))}>Pass</button>
        <SubmitButton disabled={disabled || !sourceId || !targetId} label="Đặt bảo vệ" icon="shield" />
      </div>
    </form>
  );
}

function PurgeActionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const rule = getPurgeRuleForRound(view.round);
  const [ownTargetId, setOwnTargetId] = React.useState<CardId | ''>('');
  const [opponentTargetId, setOpponentTargetId] = React.useState<CardId | ''>('');
  if (view.self.submissions.purge !== null) return <SubmittedPanel label="Purge order đã gửi" />;
  const ownTargets = view.self.board.filter(
    (card) => isLivingCard(card) && (rule !== 'REVEAL' || card.state.visibility === 'HIDDEN')
  );
  const opponentTargets = view.opponent.board.filter(isLivingCard);
  const canSkip = (rule === 'REVEAL' && ownTargets.length === 0) || (rule === 'SWAP' && (ownTargets.length === 0 || opponentTargets.length === 0));
  const valid = rule === 'SWAP' ? Boolean(ownTargetId && opponentTargetId) : Boolean(ownTargetId) || canSkip;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        if (rule === 'SWAP') return onSubmit(createPurgeAction(view.self.id, { rule, ownTargetId: ownTargetId || null, opponentTargetId: opponentTargetId || null }));
        if (rule === 'REVEAL') return onSubmit(createPurgeAction(view.self.id, { rule, targetId: ownTargetId || null }));
        if (!ownTargetId) return;
        if (rule === 'CUT') {
          return onSubmit(createPurgeAction(view.self.id, { rule, targetId: ownTargetId }));
        }
        onSubmit(createPurgeAction(view.self.id, { rule: 'LOCK', targetId: ownTargetId }));
      }}
    >
      <p className="rounded-lg bg-amber-950/30 p-3 text-xs text-amber-200">Purge rule: <strong>{rule}</strong></p>
      <CardSelect cards={ownTargets} value={ownTargetId} onChange={setOwnTargetId} placeholder="Chọn card phe mình" disabled={disabled} />
      {rule === 'SWAP' ? <CardSelect cards={opponentTargets} value={opponentTargetId} onChange={setOpponentTargetId} placeholder="Chọn card đối thủ" disabled={disabled} /> : null}
      <SubmitButton disabled={disabled || !valid} label={canSkip && !ownTargetId ? 'Bỏ qua Purge' : `Gửi ${rule}`} />
    </form>
  );
}

function FinalDuelActionForm({ view, disabled, onSubmit }: PhaseFormProps) {
  const [guess, setGuess] = React.useState<CardRole>(CardRole.WEREWOLF);
  if (view.self.submissions.finalGuess !== null) return <SubmittedPanel label="Final guess đã gửi" />;
  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onSubmit(createFinalGuessAction(view.self.id, guess)); }}>
      <RoleSelect value={guess} onChange={setGuess} disabled={disabled} />
      <SubmitButton disabled={disabled} label="Gửi dự đoán cuối" icon="swords" />
    </form>
  );
}

function RoleSelect({ value, onChange, disabled }: { readonly value: CardRole; readonly onChange: (role: CardRole) => void; readonly disabled: boolean }) {
  return (
    <select className={CONTROL_CLASS} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as CardRole)} aria-label="Chọn role">
      {Object.values(CardRole).map((role) => <option key={role} value={role}>{role}</option>)}
    </select>
  );
}

function SubmitButton({ disabled, label, icon = 'send' }: { readonly disabled: boolean; readonly label: string; readonly icon?: 'send' | 'shield' | 'swords' }) {
  const Icon = icon === 'shield' ? Shield : icon === 'swords' ? Swords : Send;
  return <button type="submit" disabled={disabled} className={BUTTON_CLASS}><Icon className="h-4 w-4" />{label}</button>;
}

function WaitingPanel({ message }: { readonly message: string }) {
  return <p className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 text-xs leading-relaxed text-slate-400">{message}</p>;
}

function SubmittedPanel({ label }: { readonly label: string }) {
  return <p className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-300">{label}. Đang chờ đối thủ/server.</p>;
}
