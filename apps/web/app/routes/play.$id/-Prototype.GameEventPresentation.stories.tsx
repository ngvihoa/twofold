import {
  AbilityId,
  CardRole,
  Faction,
  PlayerId,
  type GamePresentationEventV2,
} from '@twofold/shared-types';
import type { Meta, StoryObj } from '@storybook/react';
import { PrototypeGameEventPresentationCard } from './-Prototype.GameEventPresentation';

const nightRevealEvent: GamePresentationEventV2 = {
  id: 'night-reveal-1',
  sequence: 4,
  round: 2,
  phase: 'NIGHT_RESOLUTION',
  type: 'CARD_REVEALED',
  cardId: 'B4',
  instanceId: 'B:4',
  owner: PlayerId.PLAYER_B,
  role: CardRole.WEREWOLF,
  faction: Faction.WEREWOLF,
};

const councilPassedEvent: GamePresentationEventV2 = {
  id: 'council-passed-1',
  sequence: 5,
  round: 2,
  phase: 'COUNCIL_RESOLUTION',
  type: 'COUNCIL_PASSED',
  playerId: PlayerId.PLAYER_A,
};

const purgeEliminatedEvent: GamePresentationEventV2 = {
  id: 'purge-elim-1',
  sequence: 7,
  round: 6,
  phase: 'PURGE_RESOLUTION',
  type: 'CARD_ELIMINATED',
  cardId: 'B2',
  instanceId: 'B:2',
  owner: PlayerId.PLAYER_B,
  role: null,
  faction: null,
};

const nightInspectEvent: GamePresentationEventV2 = {
  id: 'night-inspect-1',
  sequence: 3,
  round: 2,
  phase: 'NIGHT_PLAN',
  type: 'ABILITY_RESOLVED',
  abilityId: AbilityId.SEER_INSPECT,
  sourceCardId: 'A4',
  targetCardId: 'B4',
};

const selfRevealViewedByOpponent: GamePresentationEventV2 = {
  id: 'reveal-opponent-1',
  sequence: 4,
  round: 2,
  phase: 'NIGHT_RESOLUTION',
  type: 'CARD_REVEALED',
  cardId: 'A2',
  instanceId: 'A:2',
  owner: PlayerId.PLAYER_A,
  role: CardRole.PRIEST,
  faction: Faction.VILLAGE,
};

const meta = {
  title: 'Play/PrototypeGameEventPresentationCard',
  component: PrototypeGameEventPresentationCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    current: nightRevealEvent,
    kind: 'NIGHT',
    queuedCount: 0,
    onSkipCurrent: () => {},
    onSkipAll: () => {},
  },
} satisfies Meta<typeof PrototypeGameEventPresentationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NightReveal: Story = {};

export const DayCouncil: Story = {
  args: {
    current: councilPassedEvent,
    kind: 'COUNCIL',
  },
};

export const PurgeElimination: Story = {
  args: {
    current: purgeEliminatedEvent,
    kind: 'PURGE',
  },
};

export const MultipleInQueue: Story = {
  args: {
    current: nightInspectEvent,
    kind: 'NIGHT',
    queuedCount: 2,
  },
};

export const SilentOpponentOutcome: Story = {
  args: {
    current: selfRevealViewedByOpponent,
    kind: 'NIGHT',
    viewerId: PlayerId.PLAYER_B,
  },
};