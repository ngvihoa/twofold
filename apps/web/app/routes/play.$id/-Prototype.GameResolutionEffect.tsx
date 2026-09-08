import { AbilityId, type GamePresentationEventV2 } from '@twofold/shared-types';
import * as React from 'react';

export type GameResolutionEffectKind =
  | 'attack'
  | 'bloodmoon'
  | 'council'
  | 'defend'
  | 'eliminated'
  | 'inspect'
  | 'poison'
  | 'purify'
  | 'revealed'
  | 'revive'
  | 'revived'
  | 'saved'
  | 'shoot';

export interface ResolutionEffect {
  readonly kind: GameResolutionEffectKind;
  readonly sourceCardId: string | null;
  readonly targetCardId: string;
  readonly succeeded?: boolean;
}

interface EffectGeometry {
  readonly angle: number;
  readonly distance: number;
  readonly endX: number;
  readonly endY: number;
  readonly startX: number;
  readonly startY: number;
  readonly travelX: number;
  readonly travelY: number;
}

const ABILITY_EFFECT = {
  [AbilityId.WEREWOLF_ATTACK]: 'attack',
  [AbilityId.SEER_INSPECT]: 'inspect',
  [AbilityId.GUARD_PROTECT]: 'defend',
  [AbilityId.WITCH_REVIVE]: 'revive',
  [AbilityId.WITCH_POISON]: 'poison',
  [AbilityId.SHOOTER_SHOOT]: 'shoot',
  [AbilityId.AVENGER_MARK]: 'attack',
  [AbilityId.PRIEST_PURIFY]: 'purify',
  [AbilityId.SUBSTITUTE_SACRIFICE]: 'revive',
  [AbilityId.WOLF_GUARD_RESCUE]: 'defend',
  BLOOD_MOON: 'bloodmoon',
} as const satisfies Record<
  Extract<GamePresentationEventV2, { type: 'ABILITY_RESOLVED' }>['abilityId'],
  GameResolutionEffectKind
>;

/** Chỉ dùng target/source đã có trong recipient event; không đoán thông tin ẩn. */
export function getGameResolutionEffect(
  event: GamePresentationEventV2
): ResolutionEffect | null {
  if (event.type === 'ABILITY_RESOLVED' && event.targetCardId) {
    if (event.abilityId === AbilityId.GUARD_PROTECT) return null;
    return {
      kind: ABILITY_EFFECT[event.abilityId],
      sourceCardId: event.sourceCardId,
      targetCardId: event.targetCardId,
    };
  }
  if (event.type === 'CARD_SAVED') {
    return { kind: 'saved', sourceCardId: null, targetCardId: event.cardId };
  }
  if (event.type === 'CARD_ELIMINATED') {
    return { kind: 'eliminated', sourceCardId: null, targetCardId: event.cardId };
  }
  if (event.type === 'CARD_REVEALED') {
    return { kind: 'revealed', sourceCardId: null, targetCardId: event.cardId };
  }
  if (event.type === 'CARD_REVIVED') {
    return { kind: 'revived', sourceCardId: null, targetCardId: event.cardId };
  }
  if (event.type === 'COUNCIL_RESOLVED') {
    return {
      kind: 'council',
      sourceCardId: null,
      targetCardId: event.targetCardId,
      succeeded: event.succeeded,
    };
  }
  return null;
}

/** Card tham gia motion chưa được phép hiện status icon mới cho tới khi cue xong. */
export function isCardInGameResolution(
  event: GamePresentationEventV2 | null,
  cardId: string
): boolean {
  if (!event) return false;
  const effect = getGameResolutionEffect(event);
  return Boolean(
    effect &&
      (effect.sourceCardId === cardId || effect.targetCardId === cardId)
  );
}

function findCard(cardId: string): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>('[data-card-id]')].find(
      (element) => element.dataset.cardId === cardId
    ) ?? null
  );
}

function measureEffect(effect: ResolutionEffect): EffectGeometry | null {
  const target = findCard(effect.targetCardId);
  if (!target) return null;
  const source = effect.sourceCardId ? findCard(effect.sourceCardId) : null;
  const targetRect = target.getBoundingClientRect();
  const sourceRect = source?.getBoundingClientRect();
  const startX = sourceRect
    ? sourceRect.left + sourceRect.width / 2
    : targetRect.left + targetRect.width / 2;
  const startY = sourceRect
    ? sourceRect.top + sourceRect.height / 2
    : Math.max(72, targetRect.top - 120);
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;
  const travelX = endX - startX;
  const travelY = endY - startY;
  return {
    angle: Math.atan2(travelY, travelX) * 180 / Math.PI,
    distance: Math.hypot(travelX, travelY),
    endX,
    endY,
    startX,
    startY,
    travelX,
    travelY,
  };
}

/** Motion layer port từ prototype: beam/lens, dome/ripple và projectile/impact. */
export function PrototypeGameResolutionEffect({
  event,
}: {
  readonly event: GamePresentationEventV2;
}) {
  const effect = getGameResolutionEffect(event);
  if (!effect) return null;
  return <PrototypeGameResolutionMotion effect={effect} effectKey={event.id} />;
}

export function PrototypeGameResolutionMotion({
  effect,
  effectKey,
}: {
  readonly effect: ResolutionEffect;
  readonly effectKey: string;
}) {
  const [geometry, setGeometry] = React.useState<EffectGeometry | null>(null);

  React.useLayoutEffect(() => {
    const source = effect.sourceCardId ? findCard(effect.sourceCardId) : null;
    const target = findCard(effect.targetCardId);
    source?.classList.add(`game-fx-${effect.kind}-source`);
    target?.classList.add(`game-fx-${effect.kind}-target`);
    setGeometry(measureEffect(effect));

    return () => {
      source?.classList.remove(`game-fx-${effect.kind}-source`);
      target?.classList.remove(`game-fx-${effect.kind}-target`);
    };
  }, [effect?.kind, effect?.sourceCardId, effect?.targetCardId]);

  if (!geometry) return null;
  const style = {
    '--game-fx-angle': `${geometry.angle}deg`,
    '--game-fx-distance': `${geometry.distance}px`,
    '--game-fx-end-x': `${geometry.endX}px`,
    '--game-fx-end-y': `${geometry.endY}px`,
    '--game-fx-start-x': `${geometry.startX}px`,
    '--game-fx-start-y': `${geometry.startY}px`,
    '--game-fx-travel-x': `${geometry.travelX}px`,
    '--game-fx-travel-y': `${geometry.travelY}px`,
  } as React.CSSProperties;

  return (
    <div
      key={effectKey}
      className="game-resolution-fx-layer"
      data-resolution-effect={effect.kind}
      style={style}
      aria-hidden="true"
    >
      <ResolutionEffectMarkup effect={effect} />
    </div>
  );
}

function ResolutionEffectMarkup({ effect }: { readonly effect: ResolutionEffect }) {
  if (effect.kind === 'inspect') {
    return (
      <>
        <div className="game-fx-seer-beam" />
        <div className="game-fx-seer-lens">
          <span>◉</span>
          <strong>TIÊN TRI ĐANG SOI</strong>
          <small>{effect.targetCardId}</small>
        </div>
        <div className="game-fx-seer-scanline" />
      </>
    );
  }
  if (effect.kind === 'defend' || effect.kind === 'saved') {
    const placed = effect.kind === 'defend';
    return (
      <>
        <div className="game-fx-shield-dome">
          <i />
          <span>◈</span>
          <strong>{placed ? 'KHIÊN ĐÃ ĐẶT' : 'KHIÊN ĐÃ CHẶN ĐÒN'}</strong>
          <small>{effect.targetCardId}</small>
        </div>
        <div className="game-fx-shield-ripple" />
      </>
    );
  }
  if (effect.kind === 'council') {
    return effect.succeeded ? (
      <div className="game-fx-gallows">
        <i />
        <span>⚖</span>
        <strong>PHÁN QUYẾT TREO CỔ</strong>
        <small>{effect.targetCardId}</small>
      </div>
    ) : (
      <div className="game-fx-council-failed">
        <span>⚖</span>
        <strong>BUỘC TỘI KHÔNG THÀNH</strong>
        <small>{effect.targetCardId} sống sót</small>
      </div>
    );
  }
  if (
    effect.kind === 'eliminated' ||
    effect.kind === 'revealed' ||
    effect.kind === 'revived'
  ) {
    const outcome = {
      eliminated: ['BỊ LOẠI', '☠'],
      revealed: ['ĐÃ LỘ DIỆN', '◉'],
      revived: ['ĐÃ HỒI SINH', '✦'],
    } as const;
    const [label, symbol] = outcome[effect.kind];
    return (
      <div className={`game-fx-card-outcome game-fx-card-${effect.kind}`}>
        <span>{symbol}</span>
        <strong>{label}</strong>
        <small>{effect.targetCardId}</small>
      </div>
    );
  }
  return (
    <>
      <div className={`game-fx-combat-trail game-fx-${effect.kind}`} />
      <div className={`game-fx-projectile game-fx-${effect.kind}`} />
      <div className="game-fx-impact">
        <i />
        <strong>ĐANG PHÂN GIẢI</strong>
      </div>
    </>
  );
}
