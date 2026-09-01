import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { CardRole } from '@twofold/shared-types';
import { STANDARD_DECK } from '@twofold/game-core';
import { Copy, Check, UserCheck, Shield, Sparkles, Swords } from 'lucide-react';

export const Route = createFileRoute('/room/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search.role === 'HOST' ? ('HOST' as const) : ('GUEST' as const),
    name: typeof search.name === 'string' ? search.name : 'Người chơi',
  }),
  component: RoomLobbyComponent,
});

function RoomLobbyComponent() {
  const { id: roomId } = Route.useParams();
  const { name } = Route.useSearch();
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const [myDeck] = React.useState<CardRole[]>(() => [...STANDARD_DECK]);
  const [isReady, setIsReady] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    const nextReady = !isReady;
    setIsReady(nextReady);

    if (nextReady) {
      // Mock countdown 3s trước khi vào trận
      setCountdown(3);
    } else {
      setCountdown(null);
    }
  };

  React.useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate({
        to: '/play/$id',
        params: { id: roomId },
        search: { name, reconnectSessionId: undefined },
      });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, name, navigate, roomId]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-8 flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/80 border border-slate-800 p-4 sm:p-6 rounded-2xl backdrop-blur-sm">
        <div>
          <div className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-1">
            Phòng Đấu 1v1
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-100 tracking-wider">
              {roomId}
            </span>
            <button
              onClick={copyRoomCode}
              className="p-2 rounded-lg bg-surface-highlight/70 hover:bg-surface-highlight text-slate-300 hover:text-white transition-colors border border-slate-700/50"
              title="Sao chép mã phòng"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Player Ready Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-highlight/40 px-3 py-2 rounded-xl border border-slate-700/50">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">Bạn (Người chơi A)</span>
          </div>

          <div className="flex items-center gap-2 bg-surface-highlight/20 px-3 py-2 rounded-xl border border-slate-800 text-slate-400">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs font-medium">Đối thủ (Đang kết nối...)</span>
          </div>
        </div>
      </div>

      {/* Main Setup Grid: 10 Slots Allocation */}
      <div className="bg-surface/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Bố trí 10 Lá Bài Ban Đầu</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Đối thủ sẽ chỉ nhìn thấy các vị trí úp bài. Hãy sắp xếp vị trí để tối ưu chiến thuật đánh lừa.
            </p>
          </div>

          <div className="text-xs font-medium bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            Bộ bài Alpha Skeleton (10 lá chuẩn)
          </div>
        </div>

        {/* 10 Card Slots Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {myDeck.map((role, index) => (
            <div
              key={index}
              className="bg-surface-highlight/40 border border-slate-700/60 hover:border-indigo-500/50 transition-all rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 min-h-[140px] text-center group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="font-bold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors">
                {role}
              </div>
              <span className="text-[10px] text-slate-400 bg-surface/80 px-2 py-0.5 rounded border border-slate-800">
                Vị trí {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ready Action Button / Countdown Overlay */}
      <div className="flex justify-end items-center gap-4">
        {countdown !== null && (
          <div className="text-amber-400 font-bold text-sm animate-bounce flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Trận đấu bắt đầu sau {countdown}s...</span>
          </div>
        )}

        <button
          onClick={handleToggleReady}
          className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all active:scale-[0.99] ${
            isReady
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
          }`}
        >
          {isReady ? (
            <>
              <span>Hủy Sẵn Sàng</span>
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" />
              <span>Sẵn Sàng Vào Trận</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
