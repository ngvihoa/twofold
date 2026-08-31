import { createActorContext } from '@xstate/react';
import { gamePresentationMachine } from './game-presentation-machine';

/** React boundary cho presentation actor; UI nên subscribe qua selector hẹp. */
export const GamePresentationActorContext = createActorContext(
  gamePresentationMachine
);
