import {
  CardRole,
  type CardId,
  type PrivateCardViewV2,
  type PublicCardViewV2,
} from '@twofold/shared-types';
import { Eye, EyeOff, Shield, Skull } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  formatGameRoleName,
  getGameRoleTooltipContent,
} from '../../features/game/presentation/game-display-labels';

export type PrototypeGameCardProps =
  | ({ readonly kind: 'self'; readonly card: PrivateCardViewV2 } & CardInteractionProps)
  | ({ readonly kind: 'opponent'; readonly card: PublicCardViewV2 } & CardInteractionProps);

interface CardInteractionProps {
  readonly selectable: boolean;
  readonly selected: boolean;
  readonly onSelect: (cardId: CardId) => void;
}

const ROLE_ART: Record<CardRole, string> = {
  [CardRole.VILLAGER]: '/characters/dan-lang.png',
  [CardRole.WEREWOLF]: '/characters/ma-soi-thuong.png',
  [CardRole.SEER]: '/characters/tien-tri.png',
  [CardRole.GUARD]: '/characters/bao-ve.png',
  [CardRole.WITCH]: '/characters/phu-thuy.webp',
  [CardRole.SHOOTER]: '/characters/xa-thu.webp',
  [CardRole.AVENGER]: '/characters/ke-bao-thu.png',
  [CardRole.PRIEST]: '/characters/muc-su.png',
  [CardRole.SUBSTITUTE]: '/characters/soi-ho-ve.webp',
  [CardRole.WOLF_GUARD]: '/characters/soi-ho-ve.webp',
};

interface TooltipPosition {
  readonly left: number;
  readonly top: number;
  readonly placement: 'top' | 'bottom';
}

const TOOLTIP_WIDTH = 288;

/** Render card theo visual prototype mà không suy diễn hidden role. */
export function PrototypeGameCard(props: PrototypeGameCardProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const tooltipId = React.useId();
  const [tooltipPosition, setTooltipPosition] =
    React.useState<TooltipPosition | null>(null);
  const { card } = props;
  const dead = card.state.life === 'DEAD';
  const revealed = card.state.visibility === 'REVEALED';
  const role =
    props.kind === 'self' ? props.card.role.id : props.card.role;
  const roleName = role ? formatGameRoleName(role) : 'Vai trò ẩn';
  const tooltip = role ? getGameRoleTooltipContent(role) : null;
  const protectedCard = card.effects.some((effect) => effect.kind === 'PROTECTION');
  const abilityResources =
    props.kind === 'self'
      ? props.card.role.abilities
          .filter((ability) => 'remainingUses' in ability)
          .map((ability) => `${ability.abilityId}: ${ability.remainingUses}`)
      : [];

  const showTooltip = React.useCallback(() => {
    if (!tooltip || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const halfWidth = TOOLTIP_WIDTH / 2;
    const left = Math.min(
      window.innerWidth - halfWidth - 8,
      Math.max(halfWidth + 8, rect.left + rect.width / 2)
    );
    const placement = rect.top >= 180 ? 'top' : 'bottom';
    setTooltipPosition({
      left,
      top: placement === 'top' ? rect.top - 10 : rect.bottom + 10,
      placement,
    });
  }, [tooltip]);

  const hideTooltip = React.useCallback(() => setTooltipPosition(null), []);

  React.useEffect(() => {
    if (!tooltipPosition) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideTooltip();
    };
    window.addEventListener('resize', hideTooltip);
    window.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', hideTooltip);
      window.removeEventListener('scroll', hideTooltip, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hideTooltip, tooltipPosition]);

  return (
    <div
      ref={wrapperRef}
      className="relative min-w-0"
      role={!props.selectable && tooltip ? 'group' : undefined}
      tabIndex={!props.selectable && tooltip ? 0 : undefined}
      aria-label={!props.selectable && tooltip ? `${card.id} · ${roleName}` : undefined}
      aria-describedby={!props.selectable && tooltip ? tooltipId : undefined}
      onPointerEnter={showTooltip}
      onPointerLeave={() => {
        if (!wrapperRef.current?.contains(document.activeElement)) hideTooltip();
      }}
      onFocus={showTooltip}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hideTooltip();
      }}
    >
      <button
        type="button"
        data-card-id={card.id}
        aria-label={`${card.id} · ${roleName}`}
        aria-describedby={tooltip ? tooltipId : undefined}
        aria-pressed={props.selected}
        disabled={!props.selectable}
        onClick={() => props.onSelect(card.id)}
        className={`group relative flex min-h-36 w-full flex-col overflow-hidden rounded-lg border p-1.5 text-left shadow-lg shadow-black/25 transition-[transform,box-shadow,opacity,filter] ${
          props.selectable ? 'cursor-pointer ring-2 ring-amber-200/80 hover:-translate-y-2 hover:brightness-110' : 'cursor-default'
        } ${props.selected ? 'z-10 -translate-y-1 ring-4 ring-cyan-200 shadow-cyan-200/40' : ''} ${
          dead
            ? 'border-slate-700 bg-slate-950/80 opacity-45 grayscale'
            : props.kind === 'self'
              ? 'border-amber-600/60 bg-gradient-to-br from-amber-900/70 to-slate-950'
              : revealed
                ? 'border-amber-400/80 bg-gradient-to-br from-amber-900/50 to-slate-950 shadow-amber-500/10'
                : 'border-slate-600/70 bg-[radial-gradient(circle_at_center,_#1f2937_0_18%,_#0f172a_19%_38%,_#111827_39%)]'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>{card.id}</span>
          <span className="flex items-center gap-1">
            {revealed ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {dead ? <Skull className="h-3.5 w-3.5 text-rose-400" /> : null}
          </span>
        </div>

        <div className="relative my-1.5 flex min-h-20 flex-1 overflow-hidden rounded border border-black/35 bg-black/20 text-center">
          {role ? (
            <img
              src={ROLE_ART[role]}
              alt={`Minh họa ${roleName}`}
              loading="lazy"
              decoding="async"
              className="h-full min-h-20 w-full object-cover object-top"
            />
          ) : (
            <div className="grid min-h-20 w-full place-items-center bg-[radial-gradient(circle,#334155_0_18%,#172033_19%_40%,#101827_41%)] font-serif text-3xl text-slate-300">
              TF
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pb-1 pt-5">
            {role ? (
              <strong className="block truncate text-[10px] leading-tight text-amber-50">{roleName}</strong>
            ) : null}
            <span className="font-mono text-[8px] text-slate-300">{card.instanceId}</span>
          </div>
        </div>

        <div className="space-y-1 text-[8px] text-slate-400">
          <div className="flex flex-wrap gap-1">
            <span className="rounded bg-slate-900/70 px-1.5 py-0.5">{card.state.life}</span>
            <span className="rounded bg-slate-900/70 px-1.5 py-0.5">
              {card.state.visibility}
            </span>
            {protectedCard ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 px-1.5 py-0.5 text-emerald-300">
                <Shield className="h-3 w-3" /> PROTECTION
              </span>
            ) : null}
          </div>
          {/* {abilityResources.length > 0 ? (
            <p className="truncate" title={abilityResources.join(' · ')}>
              {abilityResources.join(' · ')}
            </p>
          ) : null} */}
        </div>
      </button>

      {tooltip ? (
        <span id={tooltipId} className="sr-only">
          {tooltip.name}. {tooltip.faction}. {tooltip.description}
        </span>
      ) : null}

      {tooltip && tooltipPosition && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="tooltip"
              aria-hidden="true"
              className="pointer-events-none fixed z-[100]"
              style={{
                left: tooltipPosition.left,
                top: tooltipPosition.top,
                transform:
                  tooltipPosition.placement === 'top'
                    ? 'translate(-50%, -100%)'
                    : 'translateX(-50%)',
              }}
            >
              <div
                data-card-tooltip={card.id}
                data-placement={tooltipPosition.placement}
                className={`w-72 rounded-xl border border-amber-300/25 bg-slate-950/95 p-3 text-left shadow-2xl shadow-black/60 backdrop-blur-md ${
                  tooltipPosition.placement === 'top'
                    ? 'card-tooltip-enter-top'
                    : 'card-tooltip-enter-bottom'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-amber-100">{tooltip.name}</strong>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {tooltip.faction}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
                  {tooltip.description}
                </p>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
