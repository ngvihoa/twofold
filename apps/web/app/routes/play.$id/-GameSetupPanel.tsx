import type {
  PlayerGameAction,
  PrivatePlayerViewV2,
} from '@twofold/shared-types';
import type { GameSessionError } from '../../features/game/session/game-session-machine';
import { formatGameRoleName } from '../../features/game/presentation/game-display-labels';
import { getGameRoleArt } from '../../features/game/presentation/game-role-art';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  LoaderCircle,
  Lock,
  Save,
  ShieldCheck,
} from 'lucide-react';
import * as React from 'react';
import {
  createSetupDraft,
  createSetupLockAction,
  createSetupReorderAction,
  moveSetupCard,
  reconcileSetupDraft,
  setupOrderKey,
  toSetupOrder,
} from '../../features/game/setup/setup-draft';

export interface GameSetupPanelProps {
  readonly player: PrivatePlayerViewV2;
  readonly pendingAction: PlayerGameAction | null;
  readonly error: GameSessionError | null;
  readonly canSubmit: boolean;
  readonly onSubmit: (action: PlayerGameAction) => void;
}

/** Authoritative Setup UI với local reorder draft tách khỏi server snapshot. */
export function GameSetupPanel({
  player,
  pendingAction,
  error,
  canSubmit,
  onSubmit,
}: GameSetupPanelProps) {
  const authoritativeKey = setupOrderKey(
    player.board.map((card) => card.instanceId)
  );
  const authoritativeOrder = React.useMemo(
    () => toSetupOrder(player.board.map((card) => card.instanceId)),
    [authoritativeKey]
  );
  const [draft, setDraft] = React.useState(() => createSetupDraft(player.board));

  React.useEffect(() => {
    setDraft((current) => reconcileSetupDraft(current, authoritativeOrder));
  }, [authoritativeOrder]);

  const cardByInstanceId = React.useMemo(
    () => new Map(player.board.map((card) => [card.instanceId, card])),
    [player.board]
  );
  const locked = player.setup.status === 'LOCKED';
  const pendingSetup =
    pendingAction?.type === 'SETUP_REORDER' || pendingAction?.type === 'SETUP_LOCK';
  const editable = !locked && !pendingSetup;
  const dirty = setupOrderKey(draft.order) !== draft.authoritativeKey;

  const moveCard = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!editable) return;
      setDraft((current) => ({
        ...current,
        order: moveSetupCard(current.order, fromIndex, toIndex),
      }));
    },
    [editable]
  );

  const saveOrder = () => {
    if (!canSubmit || !dirty || locked) return;
    onSubmit(createSetupReorderAction(player.id, draft.order));
  };

  const lockSetup = () => {
    if (!canSubmit || dirty || locked) return;
    onSubmit(createSetupLockAction(player.id));
  };

  if (locked) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h1 className="text-xl font-bold text-slate-100">Đội hình đã khóa</h1>
          <p className="mt-2 text-sm text-slate-400">
            Đang chờ đối thủ khóa đội hình. Phase tiếp theo sẽ do server cập nhật.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-8">
      <header className="rounded-2xl border border-slate-800 bg-surface/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
          Setup · Player {player.id}
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-100">Sắp xếp đội hình</h1>
        <p className="mt-1 text-sm text-slate-400">
          Kéo thả hoặc dùng nút mũi tên. Lưu thứ tự trước khi khóa đội hình.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong>{error.code ?? error.kind}</strong>
            <p className="mt-1 text-rose-300/80">{error.message}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {draft.order.map((instanceId, index) => {
          const card = cardByInstanceId.get(instanceId);
          if (!card) return null;
          const roleName = formatGameRoleName(card.role.id);
          return (
            <article
              key={instanceId}
              data-setup-card={instanceId}
              draggable={editable}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/twofold-card-index', String(index));
              }}
              onDragOver={(event) => {
                if (editable) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromIndex = Number(
                  event.dataTransfer.getData('text/twofold-card-index')
                );
                if (Number.isInteger(fromIndex)) moveCard(fromIndex, index);
              }}
              className="group flex h-64 flex-col rounded-xl border border-slate-700/70 bg-surface-highlight/40 p-3 transition-colors hover:border-indigo-500/60"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono font-bold">Vị trí {index + 1}</span>
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="my-2 h-28 shrink-0 overflow-hidden rounded-lg border border-black/35 bg-black/20">
                <img
                  src={getGameRoleArt(card.role.id)}
                  alt={`Minh họa ${roleName}`}
                  loading="lazy"
                  decoding="async"
                  className="h-28 w-full object-cover object-top"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 text-center">
                <span className="text-sm font-bold text-indigo-200">{roleName}</span>
                <span className="font-mono text-xs text-slate-500">{instanceId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-label={`Đưa ${roleName} sang trái`}
                  onClick={() => moveCard(index, index - 1)}
                  disabled={!editable || index === 0}
                  className="flex justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Đưa ${roleName} sang phải`}
                  onClick={() => moveCard(index, index + 1)}
                  disabled={!editable || index === draft.order.length - 1}
                  className="flex justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-800 bg-surface/70 p-4 sm:flex-row sm:items-center">
        <p className="text-xs text-slate-400">
          {pendingSetup
            ? 'Đang chờ server xác nhận…'
            : dirty
              ? 'Thứ tự hiện tại chưa được lưu.'
              : 'Thứ tự đã khớp snapshot server.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={saveOrder}
            disabled={!canSubmit || !dirty || pendingSetup}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-5 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-900/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pendingAction?.type === 'SETUP_REORDER' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu thứ tự
          </button>
          <button
            type="button"
            onClick={lockSetup}
            disabled={!canSubmit || dirty || pendingSetup}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pendingAction?.type === 'SETUP_LOCK' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Khóa đội hình
          </button>
        </div>
      </footer>
    </section>
  );
}
