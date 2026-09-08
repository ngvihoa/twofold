import {
  AbilityId,
  type GamePresentationEventV2,
  type PlayerId,
} from '@twofold/shared-types';
import * as React from 'react';

export type GameResolutionEffectKind =
  | 'attack'
  | 'bloodmoon'
  | 'council'
  | 'defend'
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
  event: GamePresentationEventV2,
  viewerId?: PlayerId
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
  if (event.type === 'CARD_REVEALED' && event.owner === viewerId) {
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
  viewerId,
}: {
  readonly event: GamePresentationEventV2;
  readonly viewerId: PlayerId;
}) {
  const effect = getGameResolutionEffect(event, viewerId);
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

export function ResolutionEffectMarkup({ effect }: { readonly effect: ResolutionEffect }) {
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
  if (effect.kind === 'revealed') {
    return (
      <div className="game-fx-self-reveal">
        <span>◉</span>
        <strong>LÁ CỦA BẠN ĐÃ LỘ DIỆN</strong>
        <small>{effect.targetCardId}</small>
      </div>
    );
  }
  if (effect.kind === 'revived') {
    return (
      <div className="game-fx-healing-aura">
        <i />
        <strong>HỒI SINH</strong>
        <small>{effect.targetCardId}</small>
        <span className="game-fx-heal-particles">
          {HEAL_PARTICLES.map((particle, index) => (
            <b
              key={index}
              style={{
                '--game-heal-delay': `${particle.delay}ms`,
                '--game-heal-x': `${particle.x}px`,
                '--game-heal-y': `${particle.y}px`,
              } as React.CSSProperties}
            >
              +
            </b>
          ))}
        </span>
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

const HEAL_PARTICLES = [
  { x: -58, y: 35, delay: 0 },
  { x: -34, y: 62, delay: 180 },
  { x: -12, y: 42, delay: 420 },
  { x: 14, y: 68, delay: 90 },
  { x: 38, y: 46, delay: 330 },
  { x: 60, y: 70, delay: 520 },
  { x: -48, y: 82, delay: 610 },
  { x: -22, y: 94, delay: 760 },
  { x: 5, y: 86, delay: 680 },
  { x: 30, y: 104, delay: 850 },
  { x: 52, y: 92, delay: 940 },
  { x: 0, y: 116, delay: 1_020 },
] as const;
