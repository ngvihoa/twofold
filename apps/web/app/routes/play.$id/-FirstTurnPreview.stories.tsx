import type { Meta, StoryObj } from '@storybook/react';
import { FirstTurnPreview } from './-FirstTurnPreview';

const meta = {
  title: 'Play/FirstTurnPreview',
  component: FirstTurnPreview,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FirstTurnPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlayerAStarts: Story = {
  args: {
    roomId: 'story-demo-room',
    playerName: 'Alice',
    seat: 'A',
  },
};

export const PlayerBViews: Story = {
  args: {
    roomId: 'story-demo-room',
    playerName: 'Bob',
    seat: 'B',
  },
};