import type { GameTransport } from '../../features/game/session/game-transport';
import { GamePresentationActorContext } from '../../features/game/presentation/game-presentation-context';
import { GamePresentationSync } from '../../features/game/presentation/game-presentation-sync';
import { GameSessionActorContext } from '../../features/game/session/game-session-context';
import {
  selectCanSubmit,
  selectConnection,
  selectPendingAction,
  selectSessionError,
  selectView,
} from '../../features/game/session/game-session-machine';
import { PrototypeGameBoard } from './-Prototype.GameBoard';
import { PrototypeGameEventPresentation } from './-Prototype.GameEventPresentation';
import { GameSetupPanel } from './-GameSetupPanel';

export interface GameSessionRuntimeProps {
  readonly roomId: string;
  readonly playerName: string;
  readonly reconnectSessionId?: string;
  readonly onSessionIdChange?: (sessionId: string | null) => void;
  readonly transport: GameTransport;
}

/** Mount stable session/presentation actors for one gameplay route instance. */
export function GameSessionRuntime(props: GameSessionRuntimeProps) {
  return (
    <GameSessionActorContext.Provider
      options={{
        input: {
          roomId: props.roomId,
          playerName: props.playerName,
          transport: props.transport,
          ...(props.reconnectSessionId
            ? { reconnectSessionId: props.reconnectSessionId }
            : {}),
          ...(props.onSessionIdChange
            ? { onSessionIdChange: props.onSessionIdChange }
            : {}),
        },
      }}
    >
      <GamePresentationActorContext.Provider>
        <GameSessionContent />
      </GamePresentationActorContext.Provider>
    </GameSessionActorContext.Provider>
  );
}

function GameSessionContent() {
  const actor = GameSessionActorContext.useActorRef();
  const connection = GameSessionActorContext.useSelector(selectConnection);
  const view = GameSessionActorContext.useSelector(selectView);
  const pendingAction = GameSessionActorContext.useSelector(selectPendingAction);
  const error = GameSessionActorContext.useSelector(selectSessionError);
  const canSubmit = GameSessionActorContext.useSelector(selectCanSubmit);

  const retryConnection = () => {
    actor.send({
      type: connection === 'reconnecting' ? 'RECONNECT' : 'CONNECT',
    });
  };

  const presentation = view ? (
    <>
      <GamePresentationSync gameId={view.gameId} events={view.events} />
      <PrototypeGameEventPresentation />
    </>
  ) : null;

  if (view === null) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center p-6 text-center">
        <div className="w-full rounded-2xl border border-slate-800 bg-surface/70 p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Game session · {String(connection)}
          </p>
          <h1 className="mt-2 text-xl font-bold text-slate-100">
            Đang chờ authoritative snapshot
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Client sẽ render Setup sau khi server gửi `GAME_STATE_UPDATE` v0.2.
          </p>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-rose-300">
              {error.code ?? error.kind}: {error.message}
            </p>
          ) : null}
          {connection === 'reconnecting' || connection === 'closed' ? (
            <button
              type="button"
              onClick={retryConnection}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
            >
              Kết nối lại
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  if (view.phase.type === 'SETUP') {
    return (
      <>
        {presentation}
        <GameSetupPanel
          player={view.self}
          pendingAction={pendingAction}
          error={error}
          canSubmit={canSubmit}
          onSubmit={(action) => actor.send({ type: 'SUBMIT_ACTION', action })}
        />
      </>
    );
  }

  return (
    <>
      {presentation}
      <PrototypeGameBoard
        view={view}
        pendingAction={pendingAction}
        error={error}
        canSubmit={canSubmit}
        onSubmit={(action) => actor.send({ type: 'SUBMIT_ACTION', action })}
      />
    </>
  );
}
