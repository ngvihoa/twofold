import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import {
  CardRole,
  CardStatus,
  TurnPhase,
  PlayerId,
  EventLogEntry,
  PublicCard,
  Card,
} from '@twofold/shared-types';
import {
  Sun,
  Moon,
  Shield,
  Skull,
  Crosshair,
  Sparkles,
  Swords,
  History,
  AlertTriangle,
} from 'lucide-react';

export const Route = createFileRoute('/play/$id')({
  component: GameBoardComponent,
});

function GameBoardComponent() {
  const { id: roomId } = Route.useParams();

  // Mock State khởi tạo bàn đấu
  const [roundNumber, setRoundNumber] = React.useState(1);
  const [currentPhase, setCurrentPhase] = React.useState<TurnPhase>(TurnPhase.DAY);
  const [activeTurnPlayer, setActiveTurnPlayer] = React.useState<PlayerId>(PlayerId.PLAYER_A);
  const [selectedCardForHang, setSelectedCardForHang] = React.useState<number | null>(null);
  const [guessedRole, setGuessedRole] = React.useState<CardRole>(CardRole.WEREWOLF);
  const [showHangModal, setShowHangModal] = React.useState(false);

  // 10 lá của đối thủ (ẩn vai trò)
  const [opponentCards, setOpponentCards] = React.useState<PublicCard[]>(
    Array.from({ length: 10 }).map((_, idx) => ({
      id: `B_${idx}`,
      index: idx,
      owner: PlayerId.PLAYER_B,
      status: CardStatus.HIDDEN,
      role: null,
    }))
  );

  // 10 lá của người chơi A (thấy rõ vai trò)
  const [myCards, setMyCards] = React.useState<Card[]>([
    { id: 'A_0', index: 0, owner: PlayerId.PLAYER_A, role: CardRole.VILLAGER, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_1', index: 1, owner: PlayerId.PLAYER_A, role: CardRole.VILLAGER, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_2', index: 2, owner: PlayerId.PLAYER_A, role: CardRole.WEREWOLF, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_3', index: 3, owner: PlayerId.PLAYER_A, role: CardRole.WEREWOLF, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_4', index: 4, owner: PlayerId.PLAYER_A, role: CardRole.SEER, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_5', index: 5, owner: PlayerId.PLAYER_A, role: CardRole.BODYGUARD, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_6', index: 6, owner: PlayerId.PLAYER_A, role: CardRole.WITCH, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_7', index: 7, owner: PlayerId.PLAYER_A, role: CardRole.HUNTER, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_8', index: 8, owner: PlayerId.PLAYER_A, role: CardRole.MAYOR, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
    { id: 'A_9', index: 9, owner: PlayerId.PLAYER_A, role: CardRole.DISGUISER, status: CardStatus.HIDDEN, skillUsedDay: false, skillUsedNight: false, skillUsedTotal: 0 },
  ]);

  const [logs, setLogs] = React.useState<EventLogEntry[]>([
    {
      id: 'log_1',
      round: 1,
      phase: TurnPhase.DAY,
      timestamp: Date.now(),
      actor: null,
      message: 'Vòng 1 - Ban ngày bắt đầu! Lượt của Người chơi A (Bạn).',
      isPublic: true,
    },
  ]);

  const isMyTurn = currentPhase === TurnPhase.DAY && activeTurnPlayer === PlayerId.PLAYER_A;

  // Thực hiện Treo cổ
  const handleConfirmHang = () => {
    if (selectedCardForHang === null) return;

    // Giả lập đoán: Nếu đoán đúng thì loại
    const isMockCorrect = Math.random() > 0.5;

    if (isMockCorrect) {
      setOpponentCards((prev) =>
        prev.map((c, i) =>
          i === selectedCardForHang
            ? { ...c, status: CardStatus.DEAD, role: guessedRole }
            : c
        )
      );
      setLogs((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          round: roundNumber,
          phase: currentPhase,
          timestamp: Date.now(),
          actor: PlayerId.PLAYER_A,
          message: `Bạn đã Treo cổ chính xác lá số ${selectedCardForHang + 1} (${guessedRole}) của đối thủ! Lá bài bị loại.`,
          isPublic: true,
        },
      ]);
    } else {
      setLogs((prev) => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          round: roundNumber,
          phase: currentPhase,
          timestamp: Date.now(),
          actor: PlayerId.PLAYER_A,
          message: `Bạn đoán sai vai trò lá số ${selectedCardForHang + 1}! Không lá nào bị loại.`,
          isPublic: true,
        },
      ]);
    }

    setShowHangModal(false);
    setSelectedCardForHang(null);
    // Chuyển lượt sang B
    setActiveTurnPlayer(PlayerId.PLAYER_B);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Main Board Area */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        {/* Opponent Area (Top) */}
        <div className="bg-surface/50 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Skull className="w-4 h-4" />
              <span>Đối thủ (Người chơi B)</span>
            </div>
            <div className="text-slate-400">
              Còn sống: {opponentCards.filter((c) => c.status !== CardStatus.DEAD).length}/10 lá
            </div>
          </div>

          {/* Opponent 10 Cards Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {opponentCards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => {
                  if (card.status !== CardStatus.DEAD && isMyTurn) {
                    setSelectedCardForHang(idx);
                    setShowHangModal(true);
                  }
                }}
                className={`aspect-[3/4] rounded-xl border p-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                  card.status === CardStatus.DEAD
                    ? 'bg-rose-950/20 border-rose-900/40 opacity-40 grayscale cursor-not-allowed'
                    : selectedCardForHang === idx
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-surface-highlight'
                    : 'bg-surface-highlight/40 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-400 font-bold">{idx + 1}</span>
                <div className="text-xs font-bold text-slate-300">
                  {card.status === CardStatus.DEAD ? (
                    <Skull className="w-5 h-5 text-rose-500 mx-auto" />
                  ) : card.status === CardStatus.REVEALED ? (
                    <span className="text-[10px] text-amber-400">{card.role}</span>
                  ) : (
                    <span className="text-lg">❓</span>
                  )}
                </div>
                <span className="text-[9px] uppercase font-semibold text-slate-400">
                  {card.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Board: Phase Indicator & Round Info */}
        <div className="bg-surface/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                currentPhase === TurnPhase.DAY
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
              }`}
            >
              {currentPhase === TurnPhase.DAY ? (
                <Sun className="w-6 h-6 animate-spin-slow" />
              ) : (
                <Moon className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Vòng {roundNumber} — {currentPhase === TurnPhase.DAY ? 'Ban Ngày' : 'Ban Đêm'}
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {isMyTurn ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Lượt của bạn (Hãy chọn 1 hành động)
                  </span>
                ) : (
                  <span className="text-slate-400">Chờ đối thủ hành động...</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLogs((prev) => [
                  ...prev,
                  {
                    id: `log_${Date.now()}`,
                    round: roundNumber,
                    phase: currentPhase,
                    timestamp: Date.now(),
                    actor: PlayerId.PLAYER_A,
                    message: 'Bạn đã chọn Bỏ lượt Ban ngày.',
                    isPublic: true,
                  },
                ]);
                setActiveTurnPlayer(PlayerId.PLAYER_B);
              }}
              disabled={!isMyTurn}
              className="px-4 py-2 rounded-lg bg-surface-highlight/70 hover:bg-surface-highlight text-xs font-semibold text-slate-300 border border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Bỏ Lượt
            </button>
          </div>
        </div>

        {/* Player A Area (Bottom) */}
        <div className="bg-surface/50 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Shield className="w-4 h-4" />
              <span>Bàn Đấu Của Bạn (Người chơi A)</span>
            </div>
            <div className="text-slate-400">
              Còn sống: {myCards.filter((c) => c.status !== CardStatus.DEAD).length}/10 lá
            </div>
          </div>

          {/* My 10 Cards Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {myCards.map((card, idx) => (
              <div
                key={card.id}
                className={`aspect-[3/4] rounded-xl border p-2 flex flex-col items-center justify-between text-center transition-all ${
                  card.status === CardStatus.DEAD
                    ? 'bg-rose-950/20 border-rose-900/40 opacity-40 grayscale cursor-not-allowed'
                    : 'bg-surface-highlight/60 border-indigo-500/30 hover:border-indigo-500 shadow-md'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-400 font-bold">{idx + 1}</span>
                <div className="font-bold text-[11px] text-indigo-200">{card.role}</div>
                <span className="text-[9px] uppercase font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {card.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar: Event History Log */}
      <div className="w-full lg:w-80 bg-surface/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between max-h-[600px] lg:max-h-none">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3 text-xs font-bold text-slate-300">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Nhật Ký Trận Đấu (Event Log)</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-highlight/30 border border-slate-800/60 p-2.5 rounded-lg space-y-1 text-slate-300"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-semibold">Vòng {log.round}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="leading-relaxed">{log.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hanging Modal */}
      {showHangModal && selectedCardForHang !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <Crosshair className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-100">
                Treo Cổ Lá Số {selectedCardForHang + 1}
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Hãy đoán vai trò thật của lá bài này. Nếu bạn đoán <span className="text-emerald-400 font-semibold">ĐÚNG</span>, lá bài sẽ bị loại ngay. Nếu bạn đoán <span className="text-rose-400 font-semibold">SAI</span>, bạn sẽ mất hành động Ban ngày.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Chọn vai trò dự đoán:
              </label>
              <select
                value={guessedRole}
                onChange={(e) => setGuessedRole(e.target.value as CardRole)}
                className="w-full bg-surface-highlight border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {Object.values(CardRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowHangModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmHang}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
              >
                Xác nhận Treo cổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

