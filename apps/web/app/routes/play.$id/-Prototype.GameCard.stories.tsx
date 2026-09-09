import { CardRole } from '@twofold/shared-types';
import type { Meta, StoryObj } from '@storybook/react';
import { PrototypeGameCard } from './-Prototype.GameCard';
import {
  mockEffects,
  mockEliminatedCard,
  mockIntents,
  mockOpponentCard,
  mockRevealedOpponentCard,
  mockSelfCard,
} from './-stories-fixtures';

const meta = {
  title: 'Play/PrototypeGameCard',
  component: PrototypeGameCard,
  parameters: {
    layout: 'centered',
  },
  args: {
    kind: 'self',
    card: mockSelfCard,
    selectable: false,
    selected: false,
    onSelect: () => {},
  },
} satisfies Meta<typeof PrototypeGameCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelfDefault: Story = {};

export const SelfSelectable: Story = {
  args: {
    selectable: true,
  },
};

export const SelfSelected: Story = {
  args: {
    selectable: true,
    selected: true,
  },
};

export const SelfWithIntents: Story = {
  args: {
    intentIndicators: [mockIntents.PENDING_ATTACK],
  },
};

export const SelfWithProtectionEffect: Story = {
  args: {
    card: { ...mockSelfCard, effects: [mockEffects.PROTECTION] },
  },
};

export const OpponentHidden: Story = {
  args: {
    kind: 'opponent',
    card: mockOpponentCard,
  },
};

export const OpponentInspected: Story = {
  args: {
    kind: 'opponent',
    card: mockOpponentCard,
    inspectedRole: CardRole.WEREWOLF,
  },
};

export const OpponentRevealed: Story = {
  args: {
    kind: 'opponent',
    card: mockRevealedOpponentCard,
    animateReveal: true,
  },
};

export const DeadCard: Story = {
  args: {
    card: mockEliminatedCard,
  },
};

export const EliminatedAnimated: Story = {
  args: {
    card: mockEliminatedCard,
    animateElimination: true,
    suppressEffects: true,
  },
};