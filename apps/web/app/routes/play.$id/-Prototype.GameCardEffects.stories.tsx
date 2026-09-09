import type { Meta, StoryObj } from '@storybook/react';
import { PrototypeGameCardEffects } from './-Prototype.GameCardEffects';
import { mockEffects, mockIntents } from './-stories-fixtures';

const meta = {
  title: 'Play/PrototypeGameCardEffects',
  component: PrototypeGameCardEffects,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="relative w-48 h-64 border border-zinc-700 bg-zinc-900 rounded-lg">
        <Story />
      </div>
    ),
  ],
  args: {
    effects: Object.values(mockEffects),
    intents: [],
    view: 'self',
  },
} satisfies Meta<typeof PrototypeGameCardEffects>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelfEffects: Story = {};

export const OpponentEffects: Story = {
  args: {
    view: 'opponent',
  },
};

export const IntentIndicators: Story = {
  args: {
    effects: [],
    intents: Object.values(mockIntents),
  },
};

export const SuppressedEffects: Story = {
  args: {
    intents: [mockIntents.PENDING_PROTECTION, mockIntents.PENDING_HANGING],
    suppressEffects: true,
  },
};