import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  ChevronLeft,
  Copy,
  DoorOpen,
  ShieldQuestion,
  Swords,
} from 'lucide-react';
import * as React from 'react';
import {
  createMockRoomCode,
  normalizeRoomCode,
  type EntryIntent,
  validatePlayerName,
  validateRoomCode,
} from '../features/entry/entry-flow';

export const Route = createFileRoute('/')({ component: HomeComponent });

const ROLE_ART = [
  { src: '/characters/tien-tri.png', className: 'entry-role-card entry-role-card-seer' },
  { src: '/characters/ma-soi-thuong.png', className: 'entry-role-card entry-role-card-wolf' },
  { src: '/characters/bao-ve.png', className: 'entry-role-card entry-role-card-guard' },
] as const;

function HomeComponent() {
  const navigate = useNavigate();
  const [intent, setIntent] = React.useState<EntryIntent>('create');
  const [playerName, setPlayerName] = React.useState('');
  const [roomCode, setRoomCode] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [roomError, setRoomError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const submitTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const formHeadingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => () => {
    if (submitTimer.current) clearTimeout(submitTimer.current);
  }, []);

  const chooseIntent = (nextIntent: EntryIntent) => {
    setIntent(nextIntent);
    setNameError(null);
    setRoomError(null);
    window.setTimeout(() => formHeadingRef.current?.focus(), 0);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nameResult = validatePlayerName(playerName);
    const roomResult = intent === 'join' ? validateRoomCode(roomCode) : null;
    setPlayerName(nameResult.value);
    setNameError(nameResult.error);
    setRoomCode(roomResult?.value ?? roomCode);
    setRoomError(roomResult?.error ?? null);
    if (nameResult.error || roomResult?.error) return;

    setIsSubmitting(true);
    const nextRoomCode = intent === 'create' ? createMockRoomCode() : roomResult!.value;
    submitTimer.current = setTimeout(() => {
      navigate({
        to: '/room/$id',
        params: { id: nextRoomCode },
        search: {
          role: intent === 'create' ? 'HOST' : 'GUEST',
          name: nameResult.value,
          preview: undefined,
        },
      });
    }, 650);
  };

  return (
    <div className="entry-page relative isolate flex min-h-[calc(100dvh-3.5rem)] overflow-hidden">
      <div className="entry-atmosphere" aria-hidden="true" />

      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(25rem,0.72fr)]">
        <section className="flex min-h-[42rem] flex-col justify-center px-5 py-12 sm:px-10 lg:min-h-0 lg:px-16 lg:py-16 xl:px-24">
          <div className="max-w-[43rem]">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
              Suy luận chiến thuật 1v1
            </p>
            <h1 className="max-w-[12ch] break-words text-[2.65rem] font-black leading-[0.98] tracking-[-0.045em] text-slate-50 sm:text-6xl sm:leading-[0.94] sm:tracking-[-0.055em] lg:text-7xl">
              Mười lá bài. Không ai nói thật.
            </h1>
            <p className="mt-6 max-w-[31rem] text-base leading-7 text-slate-300 sm:text-lg">
              Giấu vai trò, đọc ý đồ và buộc đối thủ lộ diện trước khi bàn chơi khép lại.
            </p>

            <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => chooseIntent('create')}
                className="entry-primary-button inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 text-sm font-extrabold text-slate-950 transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:ring-offset-4 focus-visible:ring-offset-[#080b12] active:scale-[0.98]"
              >
                Tạo phòng
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => chooseIntent('join')}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/35 px-6 text-sm font-bold text-slate-100 transition hover:border-slate-400 hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 active:scale-[0.98]"
              >
                <DoorOpen className="h-4 w-4 text-rose-300" aria-hidden="true" />
                Vào bằng mã
              </button>
            </div>
          </div>

          <div className="mt-12 grid max-w-[37rem] grid-cols-2 gap-4 border-t border-slate-700/60 pt-5 text-sm text-slate-400 sm:grid-cols-3">
            <p><strong className="block text-slate-100">10 vai trò</strong> Mỗi bên</p>
            <p><strong className="block text-slate-100">Ngày và đêm</strong> Hai nhịp đấu</p>
            <p className="col-span-2 sm:col-span-1"><strong className="block text-slate-100">8-15 phút</strong> Một ván dự kiến</p>
          </div>
        </section>

        <aside className="relative flex min-h-[44rem] items-center border-t border-slate-700/60 bg-slate-950/55 px-5 py-10 sm:px-10 lg:min-h-0 lg:border-l lg:border-t-0 lg:px-12">
          <div className="entry-artwork" aria-hidden="true">
            {ROLE_ART.map((art) => (
              <img key={art.src} src={art.src} alt="" className={art.className} />
            ))}
          </div>

          <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0d121d]/[0.92] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.48)] backdrop-blur-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  {intent === 'create' ? 'Phòng đấu mới' : 'Lời mời của bạn'}
                </p>
                <h2 ref={formHeadingRef} tabIndex={-1} className="mt-1 text-2xl font-black tracking-tight text-slate-50 focus:outline-none">
                  {intent === 'create' ? 'Tạo bàn chơi' : 'Vào phòng đấu'}
                </h2>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-rose-300/20 bg-rose-400/10 text-rose-200">
                {intent === 'create'
                  ? <Swords className="h-5 w-5" aria-hidden="true" />
                  : <ShieldQuestion className="h-5 w-5" aria-hidden="true" />}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {intent === 'create'
                ? 'Bạn nhận mã mời và giữ vị trí A. Đối thủ chỉ thấy đội hình sau khi vai trò được lộ.'
                : 'Nhập đúng mã gồm 6 ký tự. Bạn vào vị trí B khi phòng còn chỗ.'}
            </p>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
              <Field id="player-name" label="Tên hiển thị" helper="2-20 ký tự, chỉ dùng trong phòng đấu này." error={nameError}>
                <input
                  id="player-name"
                  name="playerName"
                  value={playerName}
                  onChange={(event) => {
                    setPlayerName(event.target.value);
                    if (nameError) setNameError(null);
                  }}
                  autoComplete="nickname"
                  maxLength={20}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'player-name-error' : 'player-name-helper'}
                  className="entry-input"
                  placeholder="Ví dụ: Minh Anh"
                />
              </Field>

              {intent === 'join' ? (
                <Field id="room-code" label="Mã phòng" helper="Mã mời gồm 6 chữ cái hoặc chữ số." error={roomError}>
                  <div className="relative">
                    <input
                      id="room-code"
                      name="roomCode"
                      value={roomCode}
                      onChange={(event) => {
                        setRoomCode(normalizeRoomCode(event.target.value));
                        if (roomError) setRoomError(null);
                      }}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      inputMode="text"
                      maxLength={6}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(roomError)}
                      aria-describedby={roomError ? 'room-code-error' : 'room-code-helper'}
                      className="entry-input pr-11 font-mono text-lg font-bold tracking-[0.22em]"
                      placeholder="ABCD12"
                    />
                    <Copy className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  </div>
                </Field>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="entry-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 text-sm font-extrabold text-slate-950 transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-wait disabled:bg-rose-300 disabled:text-slate-700 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <><span className="entry-loading-mark" aria-hidden="true" />{intent === 'create' ? 'Đang tạo phòng' : 'Đang vào phòng'}</>
                ) : (
                  <>{intent === 'create' ? 'Nhận mã phòng' : 'Vào phòng'}<ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </button>

              <p className="sr-only" role="status" aria-live="polite">
                {isSubmitting ? 'Yêu cầu đang được xử lý.' : ''}
              </p>
            </form>

            <button
              type="button"
              onClick={() => chooseIntent(intent === 'create' ? 'join' : 'create')}
              disabled={isSubmitting}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {intent === 'create' ? 'Tôi đã có mã phòng' : 'Tôi muốn tạo phòng'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ id, label, helper, error, children }: {
  readonly id: string;
  readonly label: string;
  readonly helper: string;
  readonly error: string | null;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-slate-200">{label}</label>
      {children}
      <p id={`${id}-helper`} className="text-xs leading-5 text-slate-400">{helper}</p>
      {error ? <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-rose-300">{error}</p> : null}
    </div>
  );
}
