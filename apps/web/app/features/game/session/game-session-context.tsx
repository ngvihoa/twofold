import { createActorContext } from '@xstate/react';
import { gameSessionMachine } from './game-session-machine';

/** Stable React actor boundary; consumers should subscribe with narrow selectors. */
export const GameSessionActorContext = createActorContext(gameSessionMachine);
