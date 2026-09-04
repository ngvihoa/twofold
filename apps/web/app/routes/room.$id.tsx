import { STANDARD_DECK } from '@twofold/game-core';
import { CardRole } from '@twofold/shared-types';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Check,
  Copy,
  DoorOpen,
  EyeOff,
  Grip,
  Hourglass,
  RefreshCcw,
  Shield,
  Swords,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import * as React from 'react';
import {
  advanceMockCountdown,
  createMockSetupCards,
  swapMockSetupCards,
  type MockRoomStage,
  type MockSetupCard,
} from '../features/entry/room-flow';
import { formatGameRoleName } from '../features/game/presentation/game-display-labels';

const PREVIEW_STAGES = new Set<MockRoomStage>(['WAITING', 'SETUP', 'COUNTDOWN', 'INTRO']);

const ROLE_ART: Partial<Record<CardRole, string>> = {
  [CardRole.VILLAGER]: '/characters/dan-lang.png',
  [CardRole.WEREWOLF]: '/characters/ma-soi-thuong.png',
  [CardRole.SEER]: '/characters/tien-tri.png',
  [CardRole.GUARD]: '/characters/bao-ve.png',
  [CardRole.WITCH]: '/characters/phu-thuy.webp',
  [CardRole.SHOOTER]: '/characters/xa-thu.webp',
  [CardRole.AVENGER]: '/characters/ke-bao-thu.png',
  [CardRole.PRIEST]: '/characters/muc-su.png',
};

export const Route = createFileRoute('/room/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === 'HOST' ? ('HOST' as const) : ('GUEST' as const),
    name: typeof search.name === 'string' ? search.name : 'Người chơi',
    preview: typeof search.preview === 'string' && PREVIEW_STAGES.has(search.preview as MockRoomStage)
      ? search.preview as MockRoomStage
      : undefined,
  }),
  component: RoomLobbyComponent,
});

function RoomLobbyComponent() {
  const { id: roomId } = Route.useParams();
  const { name, role, preview } = Route.useSearch();
  const navigate = useNavigate();
  const isHost = role === 'HOST';
  const selfSeat = isHost ? 'A' : 'B';
  const opponentSeat = isHost ? 'B' : 'A';
  const initialStage = preview ?? (isHost ? 'WAITING' : 'SETUP');
  const [stage, setStage] = React.useState<MockRoomStage>(initialStage);
  const [opponentPresent, setOpponentPresent] = React.useState(initialStage !== 'WAITING');
  const [opponentReady, setOpponentReady] = React.useState(!isHost || initialStage === 'COUNTDOWN' || initialStage === 'INTRO');
  const [isReady, setIsReady] = React.useState(initialStage === 'COUNTDOWN' || initialStage === 'INTRO');
  const [countdown, setCountdown] = React.useState(3);
  const [cards, setCards] = React.useState<readonly MockSetupCard[]>(() => createMockSetupCards(selfSeat, STANDARD_DECK));
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  React.useEffect(() => {
    if (!isHost || preview || stage !== 'WAITING') return;
    const timer = setTimeout(() => {
      setOpponentPresent(true);
      setStage('SETUP');
    }, 1800);
    return () => clearTimeout(timer);
  }, [isHost, preview, stage]);

  React.useEffect(() => {
    if (!opponentPresent || opponentReady || preview || stage !== 'SETUP') return;
    const timer = setTimeout(() => setOpponentReady(true), 1400);
    return () => clearTimeout(timer);
  }, [opponentPresent, opponentReady, preview, stage]);

  React.useEffect(() => {
    if (stage !== 'COUNTDOWN' || preview === 'COUNTDOWN') return;
    const timer = setTimeout(() => {
      const next = advanceMockCountdown(countdown);
      if (next === null) {
        setStage('INTRO');
        return;
      }
      setCountdown(next);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, preview, stage]);

  React.useEffect(() => {
    if (stage !== 'INTRO' || preview === 'INTRO') return;
    const timer = setTimeout(() => {
      navigate({
        to: '/play/$id',
        params: { id: roomId },
        search: {
          name,
          reconnectSessionId: undefined,
          preview: 'FIRST_TURN',
          seat: selfSeat,
        },
      });
    }, 1800);
    return () => clearTimeout(timer);
  }, [name, navigate, preview, roomId, stage]);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 2200);
  };

  const handleCardSelect = (index: number) => {
    if (isReady || stage !== 'SETUP') return;
    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }
    setCards((current) => swapMockSetupCards(current, selectedIndex, index));
    setSelectedIndex(null);
  };

  const resetCards = () => {
    setCards(createMockSetupCards(selfSeat, STANDARD_DECK));
    setSelectedIndex(null);
  };

  const handleToggleReady = () => {
    if (isReady) {
      setIsReady(false);
      setStage('SETUP');
      setCountdown(3);
      return;
    }
    setSelectedIndex(null);
    setIsReady(true);
    if (opponentReady) setStage('COUNTDOWN');
  };

  const cancelCountdown = () => {
    setIsReady(false);
    setCountdown(3);
    setStage('SETUP');
  };

  const opponentName = opponentPresent ? (isHost ? 'Người chơi B' : 'Chủ phòng') : 'Chưa có đối thủ';
  const roomContent = stage === 'WAITING'
    ? <WaitingState roomId={roomId} onCopy={copyRoomCode} copyState={copyState} />
    : stage === 'SETUP'
      ? (
          <SetupState
            cards={cards}
            seat={selfSeat}
            isReady={isReady}
            opponentReady={opponentReady}
            selectedIndex={selectedIndex}
            onCardSelect={handleCardSelect}
            onReset={resetCards}
            onToggleReady={handleToggleReady}
          />
        )
      : stage === 'COUNTDOWN'
        ? <CountdownState countdown={countdown} onCancel={cancelCountdown} />
        : <MatchIntroState seat={selfSeat} />;

  return (
    <div className="entry-page relative isolate flex min-h-[calc(100dvh-3.5rem)] min-w-0 w-full max-w-full flex-1 overflow-hidden">
      <div className="entry-atmosphere" aria-hidden="true" />
      <div
        className="relative mx-auto flex min-w-0 max-w-[1360px] flex-col py-6 sm:py-8"
        style={{ width: 'calc(100% - 2.5rem)' }}
      >
        <RoomHeader
          roomId={roomId}
          name={name}
          selfSeat={selfSeat}
          opponentSeat={opponentSeat}
          opponentName={opponentName}
          opponentPresent={opponentPresent}
          opponentReady={opponentReady}
          isReady={isReady}
          copyState={copyState}
          onCopy={copyRoomCode}
          onLeave={() => navigate({ to: '/' })}
        />
        <div key={stage} className="room-state-enter flex flex-1 flex-col">{roomContent}</div>
      </div>
    </div>
  );
}

function RoomHeader(props: {
  readonly roomId: string;
  readonly name: string;
  readonly selfSeat: 'A' | 'B';
  readonly opponentSeat: 'A' | 'B';
  readonly opponentName: string;
  readonly opponentPresent: boolean;
  readonly opponentReady: boolean;
  readonly isReady: boolean;
  readonly copyState: 'idle' | 'copied' | 'failed';
  readonly onCopy: () => void;
  readonly onLeave: () => void;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-5 border-b border-slate-700/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <button type="button" onClick={props.onLeave} aria-label="Rời phòng và về trang chính" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-950/50 text-slate-300 transition hover:border-slate-500 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-300">Phòng đấu 1v1</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-2xl font-black tracking-[0.16em] text-slate-50 sm:text-3xl">{props.roomId}</span>
            <button type="button" onClick={props.onCopy} aria-label="Sao chép mã phòng" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:border-rose-300/60 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98]">
              {props.copyState === 'copied' ? <Check className="h-4 w-4 text-rose-200" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 min-h-5 text-xs text-slate-400" role="status" aria-live="polite">
            {props.copyState === 'copied' ? 'Đã sao chép mã phòng.' : props.copyState === 'failed' ? 'Không thể sao chép. Hãy sao chép mã thủ công.' : 'Gửi mã này cho đối thủ của bạn.'}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 w-full grid-cols-1 gap-2 sm:w-auto sm:min-w-[25rem] sm:grid-cols-2">
        <SeatCard seat={props.selfSeat} name={props.name} state={props.isReady ? 'ready' : 'present'} label="Bạn" />
        <SeatCard seat={props.opponentSeat} name={props.opponentName} state={!props.opponentPresent ? 'empty' : props.opponentReady ? 'ready' : 'present'} label="Đối thủ" />
      </div>
    </header>
  );
}

function SeatCard({ seat, name, state, label }: {
  readonly seat: 'A' | 'B';
  readonly name: string;
  readonly state: 'empty' | 'present' | 'ready';
  readonly label: string;
}) {
  const Icon = state === 'empty' ? UsersRound : UserRoundCheck;
  return (
    <div className={`min-w-0 overflow-hidden rounded-xl border p-3 ${state === 'empty' ? 'border-dashed border-slate-700 bg-slate-950/30' : 'border-slate-700 bg-slate-900/60'}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${state === 'ready' ? 'bg-rose-400/10 text-rose-200' : 'bg-slate-800 text-slate-400'}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">{label} · Vị trí {seat}</p>
          <p className="truncate text-sm font-bold text-slate-100">{name}</p>
          <p className="text-[11px] text-slate-500">{state === 'ready' ? 'Đã sẵn sàng' : state === 'present' ? 'Đang chuẩn bị' : 'Đang chờ'}</p>
        </div>
      </div>
    </div>
  );
}

function WaitingState({ roomId, onCopy, copyState }: {
  readonly roomId: string;
  readonly onCopy: () => void;
  readonly copyState: 'idle' | 'copied' | 'failed';
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-12 sm:py-20">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-200"><Hourglass className="h-7 w-7" aria-hidden="true" /></div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">Đang chờ đối thủ</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400 sm:text-base">Phòng đã sẵn sàng. Gửi mã mời cho người bạn muốn đối đầu.</p>
        <button type="button" onClick={onCopy} className="mx-auto mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-rose-500 px-6 text-sm font-extrabold text-slate-950 transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98]">
          {copyState === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copyState === 'copied' ? 'Đã sao chép' : `Sao chép ${roomId}`}
        </button>
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
          <InfoBlock icon={<DoorOpen className="h-5 w-5" />} title="Đối thủ vào bằng mã">Bạn không cần tải lại trang khi họ xuất hiện.</InfoBlock>
          <InfoBlock icon={<Shield className="h-5 w-5" />} title="Đội hình vẫn kín">Chỉ bạn thấy cách bố trí vai trò của mình.</InfoBlock>
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ icon, title, children }: { readonly icon: React.ReactNode; readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
      <div className="text-rose-300">{icon}</div>
      <p className="mt-3 text-sm font-bold text-slate-100">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{children}</p>
    </div>
  );
}

function SetupState(props: {
  readonly cards: readonly MockSetupCard[];
  readonly seat: 'A' | 'B';
  readonly isReady: boolean;
  readonly opponentReady: boolean;
  readonly selectedIndex: number | null;
  readonly onCardSelect: (index: number) => void;
  readonly onReset: () => void;
  readonly onToggleReady: () => void;
}) {
  const dirty = props.cards.some((card, index) => card.id !== `${props.seat}${index + 1}`);
  return (
    <section className="flex flex-1 flex-col py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-300">Hai người chơi đã có mặt</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-50">Sắp xếp đội hình</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Chọn một lá, rồi chọn vị trí thứ hai để đổi chỗ. Đối thủ không thấy cách bạn sắp xếp.</p>
        </div>
        <button type="button" onClick={props.onReset} disabled={!dirty || props.isReady} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/45 px-4 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-35">
          <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Dùng thứ tự gốc
        </button>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {props.cards.map((card, index) => {
          const selected = props.selectedIndex === index;
          const artwork = ROLE_ART[card.role];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => props.onCardSelect(index)}
              disabled={props.isReady}
              aria-pressed={selected}
              aria-label={`${formatGameRoleName(card.role)}, vị trí ${props.seat}${index + 1}${selected ? ', đang chọn' : ''}`}
              className={`group relative flex min-h-44 flex-col overflow-hidden rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-default ${selected ? '-translate-y-1 border-rose-300 bg-rose-400/10' : 'border-slate-700/80 bg-slate-900/60 hover:-translate-y-1 hover:border-rose-300/50'}`}
            >
              <div className="relative h-24 overflow-hidden bg-slate-950/80">
                {artwork ? <img src={artwork} alt="" className="h-full w-full object-cover object-top opacity-65 transition group-hover:opacity-80" /> : <div className="grid h-full place-items-center text-slate-600"><EyeOff className="h-7 w-7" /></div>}
                <span className="absolute left-2 top-2 rounded-lg bg-slate-950/85 px-2 py-1 font-mono text-[11px] font-bold text-slate-200">{props.seat}{index + 1}</span>
              </div>
              <div className="flex flex-1 flex-col justify-between p-3">
                <p className="text-sm font-black text-slate-100">{formatGameRoleName(card.role)}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500"><span>Lá {card.id}</span><Grip className="h-3.5 w-3.5" aria-hidden="true" /></div>
              </div>
            </button>
          );
        })}
      </div>

      <footer className="mt-auto flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          <p className="text-sm font-bold text-slate-200">
            {props.isReady ? 'Đội hình đã khóa' : props.selectedIndex !== null ? `Đã chọn vị trí ${props.seat}${props.selectedIndex + 1}` : dirty ? 'Thứ tự đã thay đổi' : 'Đội hình cơ bản đã sẵn sàng'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {props.isReady ? (props.opponentReady ? 'Cả hai đã sẵn sàng.' : 'Đang chờ đối thủ xác nhận.') : 'Bạn vẫn có thể đổi vị trí trước khi xác nhận.'}
          </p>
        </div>
        <button type="button" onClick={props.onToggleReady} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98] ${props.isReady ? 'border border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400' : 'bg-rose-500 text-slate-950 hover:bg-rose-400'}`}>
          {props.isReady ? <Hourglass className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
          {props.isReady ? 'Hủy sẵn sàng' : 'Khóa đội hình'}
        </button>
      </footer>
    </section>
  );
}

function CountdownState({ countdown, onCancel }: { readonly countdown: number; readonly onCancel: () => void }) {
  return (
    <section className="flex flex-1 items-center justify-center py-12 text-center" aria-live="assertive">
      <div className="min-w-0 w-full px-1">
        <p className="text-sm font-bold text-rose-300">Cả hai đã sẵn sàng</p>
        <div key={countdown} className="countdown-number mt-3 font-mono text-[8rem] font-black leading-none tracking-[-0.08em] text-slate-50 sm:text-[11rem]">{countdown}</div>
        <h1 className="mt-4 text-2xl font-black text-slate-100">Trận đấu sắp bắt đầu</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">Sau thời điểm này, đội hình sẽ được giữ nguyên cho cả trận.</p>
        <button type="button" onClick={onCancel} className="mt-7 rounded-xl border border-slate-600 bg-slate-950/50 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-slate-400 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 active:scale-[0.98]">Hủy sẵn sàng</button>
      </div>
    </section>
  );
}

function MatchIntroState({ seat }: { readonly seat: 'A' | 'B' }) {
  return (
    <section className="flex flex-1 items-center justify-center py-12 text-center">
      <div className="max-w-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-rose-300/25 bg-rose-400/10 text-rose-200"><Swords className="h-7 w-7" aria-hidden="true" /></div>
        <p className="mt-6 text-sm font-bold text-rose-300">Vai trò của bạn trong trận</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight text-slate-50 sm:text-7xl">Người chơi {seat}</h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-300">{seat === 'A' ? 'Bạn đi trước. Ban ngày Vòng 1 bắt đầu với lượt của bạn.' : 'Người chơi A đi trước. Hãy quan sát nước đi đầu tiên của đối thủ.'}</p>
        <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/55 px-4 py-3 text-sm font-semibold text-slate-300"><EyeOff className="h-4 w-4 text-rose-300" aria-hidden="true" /> Vai trò đối thủ vẫn được giữ kín</div>
      </div>
    </section>
  );
}
