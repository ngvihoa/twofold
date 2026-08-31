import type {
  PrivateCardViewV2,
  PublicCardViewV2,
} from '@twofold/shared-types';
import { Eye, EyeOff, Shield, Skull } from 'lucide-react';

export type PrototypeGameCardProps =
  | { readonly kind: 'self'; readonly card: PrivateCardViewV2 }
  | { readonly kind: 'opponent'; readonly card: PublicCardViewV2 };

/** Render card theo visual prototype mà không suy diễn hidden role. */
export function PrototypeGameCard(props: PrototypeGameCardProps) {
  const { card } = props;
  const dead = card.state.life === 'DEAD';
  const revealed = card.state.visibility === 'REVEALED';
  const role =
    props.kind === 'self' ? props.card.role.id : props.card.role;
  const protectedCard = card.effects.some((effect) => effect.kind === 'PROTECTION');
  const abilityResources =
    props.kind === 'self'
      ? props.card.role.abilities
          .filter((ability) => 'remainingUses' in ability)
          .map((ability) => `${ability.abilityId}: ${ability.remainingUses}`)
      : [];

  return (
    <article
      data-card-id={card.id}
      aria-label={`${card.id}${role ? ` ${role}` : ' role ẩn'}`}
      className={`group relative flex min-h-32 flex-col overflow-hidden rounded-lg border p-2 shadow-lg shadow-black/30 transition-[transform,box-shadow,opacity] hover:-translate-y-1 ${
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

      <div className="my-2 flex flex-1 flex-col items-center justify-center gap-1 rounded border border-black/40 bg-black/25 px-1 text-center">
        <strong className={role ? 'text-[11px] leading-tight text-amber-50' : 'font-serif text-2xl text-slate-400'}>
          {role ?? '?'}
        </strong>
        <span className="font-mono text-[9px] text-slate-500">{card.instanceId}</span>
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
        {abilityResources.length > 0 ? (
          <p className="truncate" title={abilityResources.join(' · ')}>
            {abilityResources.join(' · ')}
          </p>
        ) : null}
      </div>
    </article>
  );
}
