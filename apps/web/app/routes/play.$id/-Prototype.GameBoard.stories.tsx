import { AbilityId, PlayerId } from '@twofold/shared-types';
import type { Meta, StoryObj } from '@storybook/react';
import { PrototypeGameBoard } from './-Prototype.GameBoard';
import { createTestView } from './-stories-fixtures';

const baseView = createTestView();
const dayView = createTestView({
  phase: { type: 'DAY_A' },
  activePlayer: PlayerId.PLAYER_A,
});
const councilPlanView = createTestView({
  round: 2,
  phase: { type: 'COUNCIL_PLAN' },
});
const nightInspectionView = createTestView({
  phase: { type: 'NIGHT_PLAN' },
  self: {
    ...baseView.self,
    submissions: {
      ...baseView.self.submissions,
      night: {
        type: 'USE_ABILITY',
        abilityId: AbilityId.SEER_INSPECT,
        sourceId: 'A4',
        targetId: 'B1',
      },
    },
  },
});

const meta = {
  title: 'Play/PrototypeGameBoard',
  component: PrototypeGameBoard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col">
        <Story />
      </div>
    ),
  ],
  args: {
    view: baseView,
    pendingAction: null,
    error: null,
    canSubmit: false,
    onSubmit: () => {},
  },
} satisfies Meta<typeof PrototypeGameBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DayActive: Story = {
  args: {
    view: dayView,
    canSubmit: true,
  },
};

export const NightPlanInspection: Story = {
  args: {
    view: nightInspectionView,
  },
};

export const CouncilPlan: Story = {
  args: {
    view: councilPlanView,
  },
};

export const WithNoticeGuide: Story = {
  args: {
    view: dayView,
    notice: {
      tone: 'guide',
      title: 'Chọn mục tiêu',
      detail: 'Chọn một lá bài để soi vai trò',
    },
  },
};

export const WithNoticeSuccess: Story = {
  args: {
    view: dayView,
    notice: {
      tone: 'success',
      title: 'Thành công',
      detail: 'Hành động đã được ghi nhận',
      actionLabel: 'Tiếp tục',
      onAction: () => {},
    },
  },
};

export const WithActionError: Story = {
  args: {
    view: dayView,
    error: { kind: 'ACTION', message: 'Hành động không hợp lệ trong giai đoạn này' },
  },
};