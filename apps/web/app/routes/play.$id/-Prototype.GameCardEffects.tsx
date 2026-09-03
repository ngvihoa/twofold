import type { VisibleCardEffectV2 } from '@twofold/shared-types';
import {
  BadgeX,
  Ban,
  Crosshair,
  Eye,
  FlaskConical,
  Lock,
  Moon,
  ShieldCheck,
  Skull,
  Swords,
  type LucideIcon,
} from 'lucide-react';

interface EffectPresentation {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly className: string;
}

export type CardIntentIndicator =
  | 'PENDING_PROTECTION'
  | 'PENDING_INSPECTION'
  | 'PENDING_ATTACK'
  | 'PENDING_POISON'
  | 'PENDING_BLOOD_MOON'
  | 'PENDING_HANGING';

const EFFECT_PRESENTATION = {
  PROTECTION: {
    label: 'Được bảo vệ',
    icon: ShieldCheck,
    className: 'border-sky-300/50 bg-sky-950/80 text-sky-200',
  },
  REVENGE_MARK: {
    label: 'Bị đánh dấu báo thù',
    icon: Crosshair,
    className: 'border-rose-300/50 bg-rose-950/80 text-rose-200',
  },
  COUNCIL_LOCK: {
    label: 'Cấm bỏ phiếu Hội đồng kế tiếp',
    icon: BadgeX,
    className: 'border-amber-300/50 bg-amber-950/80 text-amber-200',
  },
  PURGE_LOCK: {
    label: 'Bị khóa bởi Thanh Trừng',
    icon: Lock,
    className: 'border-violet-300/50 bg-violet-950/80 text-violet-200',
  },
  ROUND_EXHAUSTED: {
    label: 'Đã hành động trong vòng',
    icon: Ban,
    className: 'border-slate-300/40 bg-slate-950/80 text-slate-300',
  },
} as const satisfies Record<
  VisibleCardEffectV2['kind'],
  EffectPresentation
>;

const OPPONENT_EFFECT_VISIBILITY = {
  PROTECTION: false,
  REVENGE_MARK: true,
  COUNCIL_LOCK: true,
  PURGE_LOCK: true,
  ROUND_EXHAUSTED: true,
} as const satisfies Record<VisibleCardEffectV2['kind'], boolean>;

const INTENT_PRESENTATION = {
  PENDING_PROTECTION: {
    label: 'Mục tiêu đang được bảo vệ',
    icon: ShieldCheck,
    className: 'border-sky-200/70 bg-sky-900 text-sky-100',
  },
  PENDING_INSPECTION: {
    label: 'Mục tiêu đang được Tiên tri soi',
    icon: Eye,
    className: 'border-cyan-200/70 bg-cyan-900 text-cyan-100',
  },
  PENDING_ATTACK: {
    label: 'Mục tiêu đang bị Ma sói tấn công',
    icon: Swords,
    className: 'border-red-200/70 bg-red-900 text-red-100',
  },
  PENDING_POISON: {
    label: 'Mục tiêu đang bị Phù thủy đầu độc',
    icon: FlaskConical,
    className: 'border-lime-200/70 bg-lime-900 text-lime-100',
  },
  PENDING_BLOOD_MOON: {
    label: 'Mục tiêu của Huyết Nguyệt',
    icon: Moon,
    className: 'border-rose-200/70 bg-rose-900 text-rose-100',
  },
  PENDING_HANGING: {
    label: 'Mục tiêu đang chờ treo cổ',
    icon: Skull,
    className: 'border-orange-200/70 bg-orange-900 text-orange-100',
  },
} as const satisfies Record<CardIntentIndicator, EffectPresentation>;

export function PrototypeGameCardEffects({
  effects,
  intents,
  view,
}: {
  readonly effects: readonly VisibleCardEffectV2[];
  readonly intents: readonly CardIntentIndicator[];
  readonly view: 'self' | 'opponent';
}) {
  const visibleEffects =
    view === 'self'
      ? effects
      : effects.filter((effect) => OPPONENT_EFFECT_VISIBILITY[effect.kind]);

  return (
    <div
      className="absolute bottom-2 left-2 right-2 z-10 flex flex-wrap items-center gap-1"
      aria-label={
        visibleEffects.length > 0 || intents.length > 0
          ? 'Hiệu ứng và lựa chọn đang áp dụng'
          : undefined
      }
    >
      {visibleEffects.map((effect, index) => {
        const presentation = EFFECT_PRESENTATION[effect.kind];
        const Icon = presentation.icon;
        return (
          <span
            key={`${effect.kind}:${effect.appliedRound}:${index}`}
            data-card-effect={effect.kind}
            role="img"
            aria-label={presentation.label}
            title={presentation.label}
            className={`grid h-4 w-4 place-items-center rounded-full border ${presentation.className}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
          </span>
        );
      })}
      {intents.map((intent) => {
        const presentation = INTENT_PRESENTATION[intent];
        const Icon = presentation.icon;
        return (
          <span
            key={intent}
            data-card-intent={intent}
            role="img"
            aria-label={presentation.label}
            title={presentation.label}
            className={`grid h-4 w-4 place-items-center rounded-full border ${presentation.className}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}
