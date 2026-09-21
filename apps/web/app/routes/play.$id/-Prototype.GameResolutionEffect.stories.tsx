import type { Meta, StoryObj } from '@storybook/react';
import { ResolutionEffectMarkup } from './-Prototype.GameResolutionEffect';

const meta = {
  title: 'Play/PrototypeGameResolutionEffect',
  component: ResolutionEffectMarkup,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="relative w-80 h-80 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResolutionEffectMarkup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InspectEffect: Story = {
  args: {
    effect: { kind: 'inspect', sourceCardId: 'A4', targetCardId: 'B1' },
  },
};

export const DefendSavedEffect: Story = {
  args: {
    effect: { kind: 'defend', sourceCardId: 'A3', targetCardId: 'A1', succeeded: true },
  },
};

export const CouncilSuccessGallows: Story = {
  args: {
    effect: { kind: 'council', sourceCardId: null, targetCardId: 'B2', succeeded: true },
  },
};

export const CouncilFailed: Story = {
  args: {
    effect: { kind: 'council', sourceCardId: null, targetCardId: 'B2', succeeded: false },
  },
};

export const AttackProjectile: Story = {
  args: {
    effect: { kind: 'attack', sourceCardId: 'A1', targetCardId: 'B1' },
  },
};

export const RevivedHealing: Story = {
  args: {
    effect: { kind: 'revived', sourceCardId: null, targetCardId: 'A2' },
  },
};