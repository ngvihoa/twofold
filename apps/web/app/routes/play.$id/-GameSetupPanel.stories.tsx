import { PlayerId } from '@twofold/shared-types';
import type { Meta, StoryObj } from '@storybook/react';
import { GameSetupPanel } from './-GameSetupPanel';
import { createTestPlayer } from './-stories-fixtures';

const meta = {
  title: 'Play/GameSetupPanel',
  component: GameSetupPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
        <Story />
      </div>
    ),
  ],
  args: {
    player: createTestPlayer(),
    pendingAction: null,
    error: null,
    canSubmit: true,
    onSubmit: () => {},
  },
} satisfies Meta<typeof GameSetupPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultGrid: Story = {};

export const LockedSquad: Story = {
  args: {
    player: createTestPlayer({ setup: { status: 'LOCKED' } }),
  },
};

export const PendingReorder: Story = {
  args: {
    pendingAction: {
      type: 'SETUP_REORDER',
      playerId: PlayerId.PLAYER_A,
      order: [
        'A:1', 'A:2', 'A:3', 'A:4', 'A:5',
        'A:6', 'A:7', 'A:8', 'A:9', 'A:10',
      ],
    },
  },
};

export const ActionError: Story = {
  args: {
    error: { kind: 'ACTION', message: 'Thứ tự bài không hợp lệ' },
  },
};