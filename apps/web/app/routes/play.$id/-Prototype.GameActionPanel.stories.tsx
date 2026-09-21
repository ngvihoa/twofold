import {
  AbilityId,
  PlayerId,
  type GamePlayerViewV2,
  type PlayerGameAction,
} from '@twofold/shared-types';
import type { Meta, StoryObj } from '@storybook/react';
import type { GameSessionError } from '../../features/game/session/game-session-machine';
import {
  PrototypeGameActionPanel,
  PrototypeGameInteractionProvider,
} from './-Prototype.GameActionPanel';
import { createTestView } from './-stories-fixtures';

/** Args cung cấp cho provider, không phải props của panel (panel không có props). */
interface GameActionPanelStoryArgs {
  readonly view: GamePlayerViewV2;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
  readonly canSubmit: boolean;
  readonly onSubmit: (action: PlayerGameAction) => void;
}

const baseView = createTestView();
const dayView = createTestView({
  phase: { type: 'DAY_A' },
  activePlayer: PlayerId.PLAYER_A,
});
const bloodMoonView = createTestView({
  round: 4,
  phase: { type: 'NIGHT_PLAN' },
  self: {
    ...baseView.self,
    specialAbilities: [
      {
        abilityId: 'BLOOD_MOON',
        unlockRound: 4,
        cooldownRounds: 2,
        readyRound: 4,
      },
    ],
  },
});
const councilPlanView = createTestView({
  round: 2,
  phase: { type: 'COUNCIL_PLAN' },
});

const meta = {
  title: 'Play/PrototypeGameActionPanel',
  component: PrototypeGameActionPanel,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => (
      <PrototypeGameInteractionProvider
        view={context.args.view}
        pendingAction={context.args.pendingAction}
        error={context.args.error}
        canSubmit={context.args.canSubmit}
        onSubmit={context.args.onSubmit}
      >
        <Story />
      </PrototypeGameInteractionProvider>
    ),
  ],
  args: {
    view: dayView,
    pendingAction: null,
    error: null,
    canSubmit: true,
    onSubmit: () => {},
  },
} satisfies Meta<GameActionPanelStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DayActive: Story = {};

export const NightBloodMoon: Story = {
  args: {
    view: bloodMoonView,
  },
};

export const CouncilPlanIdle: Story = {
  args: {
    view: councilPlanView,
  },
};

export const PendingAction: Story = {
  args: {
    view: dayView,
    pendingAction: {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'PASS' },
    },
    canSubmit: false,
  },
};

export const ActionError: Story = {
  args: {
    view: dayView,
    error: { kind: 'ACTION', message: 'Không đủ phiếu biểu quyết' },
  },
};