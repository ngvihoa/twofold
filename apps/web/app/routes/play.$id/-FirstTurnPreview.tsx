import { PlayerId, type PlayerGameAction } from '@twofold/shared-types';
import * as React from 'react';
import {
  completeFirstTurnPreview,
  createFirstTurnPreviewView,
  describeFirstTurnAction,
  type FirstTurnActionSummary,
} from '../../features/game/preview/first-turn-preview';
import { PrototypeGameBoard, type PrototypeGameBoardNotice } from './-Prototype.GameBoard';

export interface FirstTurnPreviewProps {
  readonly roomId: string;
  readonly playerName: string;
  readonly seat: 'A' | 'B';
}

/** Clickable Day A journey fixture; không thay thế authoritative session runtime. */
export function FirstTurnPreview({ roomId, playerName, seat }: FirstTurnPreviewProps) {
  const viewerId = seat === 'A' ? PlayerId.PLAYER_A : PlayerId.PLAYER_B;
  const createView = React.useCallback(
    () => createFirstTurnPreviewView(roomId, viewerId),
    [roomId, viewerId]
  );
  const [view, setView] = React.useState(createView);
  const [pendingAction, setPendingAction] = React.useState<PlayerGameAction | null>(null);
  const [summary, setSummary] = React.useState<FirstTurnActionSummary | null>(null);
  const [guideVisible, setGuideVisible] = React.useState(true);
  const submitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (submitTimer.current) clearTimeout(submitTimer.current);
  }, []);

  const submit = React.useCallback((action: PlayerGameAction) => {
    if (pendingAction) return;
    setGuideVisible(false);
    setPendingAction(action);
    submitTimer.current = setTimeout(() => {
      setSummary(describeFirstTurnAction(action));
      setView((current) => completeFirstTurnPreview(current));
      setPendingAction(null);
    }, 650);
  }, [pendingAction]);

  const reset = React.useCallback(() => {
    if (submitTimer.current) clearTimeout(submitTimer.current);
    setView(createView());
    setPendingAction(null);
    setSummary(null);
    setGuideVisible(true);
  }, [createView]);

  let notice: PrototypeGameBoardNotice | undefined;
  if (summary) {
    notice = {
      tone: 'success',
      title: summary.title,
      detail: summary.detail,
      actionLabel: 'Thử lại lượt đầu',
      onAction: reset,
    };
  } else if (pendingAction) {
    notice = {
      tone: 'guide',
      title: 'Đang khóa lựa chọn',
      detail: 'Bản mô phỏng đang chuyển lượt. Bạn không cần thao tác thêm.',
    };
  } else if (guideVisible && seat === 'A') {
    notice = {
      tone: 'guide',
      title: `${playerName}, bạn đi trước`,
      detail: 'Chọn một kỹ năng khả dụng, chọn lá nguồn đang sáng, rồi chọn mục tiêu. Bạn cũng có thể bỏ lượt.',
      actionLabel: 'Đã hiểu',
      onAction: () => setGuideVisible(false),
    };
  } else if (seat === 'B') {
    notice = {
      tone: 'guide',
      title: 'Người chơi A đi trước',
      detail: 'Quan sát lượt mở màn. Khu hành động sẽ mở khi đến lượt của bạn.',
    };
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-1 bg-[#080b12]">
      <span className="sr-only">Bản mô phỏng luồng gameplay đầu trận</span>
      <PrototypeGameBoard
        view={view}
        pendingAction={pendingAction}
        error={null}
        canSubmit={!pendingAction && view.activePlayer === view.self.id}
        onSubmit={submit}
        notice={notice}
      />
    </div>
  );
}
