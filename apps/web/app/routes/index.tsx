import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Swords, ShieldAlert, Sparkles, LogIn, Plus } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  const navigate = useNavigate();
  const [hostName, setHostName] = React.useState('Chủ phòng');
  const [joinName, setJoinName] = React.useState('Người chơi');
  const [roomCode, setRoomCode] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    // Sinh mã phòng ngẫu nhiên 6 ký tự
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTimeout(() => {
      navigate({
        to: '/room/$id',
        params: { id: generatedCode },
        search: { role: 'HOST', name: hostName },
      });
    }, 400);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    navigate({
      to: '/room/$id',
      params: { id: roomCode.trim().toUpperCase() },
      search: { role: 'GUEST', name: joinName },
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Hero Banner */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chiến thuật 1v1 • Vai trò ẩn • Ma Sói cải tiến</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-100">
          Đọc vị & Đánh lừa <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-rose-400">
            Trong Từng Nước Đi
          </span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Mỗi người chơi sở hữu 10 lá bài ẩn. Kích hoạt kỹ năng mang lại sức mạnh nhưng sẽ làm lộ vai trò thật. Bạn sẽ chọn ẩn mình hay tấn công quyết định?
        </p>
      </div>

      {/* Main Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Create Room Box */}
        <div className="bg-surface/80 border border-indigo-500/20 hover:border-indigo-500/40 transition-all rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div className="space-y-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Swords className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Tạo Phòng Mới</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Khởi tạo phòng đấu 1v1, nhận mã phòng để gửi cho bạn bè và trở thành Người chơi A (đi trước).
            </p>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={20}
                required
                className="w-full bg-surface-highlight/50 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nhập tên..."
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng ngay'}</span>
            </button>
          </form>
        </div>

        {/* Join Room Box */}
        <div className="bg-surface/80 border border-rose-500/20 hover:border-rose-500/40 transition-all rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div className="space-y-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Vào Phòng Đấu</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Nhập mã phòng 6 ký tự do đối thủ gửi để tham gia trận đấu với vai trò Người chơi B.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Tên của bạn
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={20}
                  required
                  className="w-full bg-surface-highlight/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
                  placeholder="Tên bạn..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Mã phòng
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                  className="w-full bg-surface-highlight/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 font-mono tracking-widest uppercase focus:outline-none focus:border-rose-500 transition-colors text-center"
                  placeholder="ABCD12"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <LogIn className="w-4 h-4" />
              <span>Tham gia phòng</span>
            </button>
          </form>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-3xl text-left">
        <div className="bg-surface/40 border border-slate-800 p-4 rounded-xl">
          <div className="text-indigo-400 font-semibold text-xs mb-1">10 Vị Trí Ẩn</div>
          <p className="text-slate-400 text-xs">
            Tự do bố trí vị trí các vai trò trước khi vào trận để tạo thế trận đánh lừa.
          </p>
        </div>
        <div className="bg-surface/40 border border-slate-800 p-4 rounded-xl">
          <div className="text-rose-400 font-semibold text-xs mb-1">Cơ chế Treo Cổ</div>
          <p className="text-slate-400 text-xs">
            Đoán chính xác vai trò đối thủ vào Ban ngày để loại bỏ lá đó ngay lập tức.
          </p>
        </div>
        <div className="bg-surface/40 border border-slate-800 p-4 rounded-xl">
          <div className="text-amber-400 font-semibold text-xs mb-1">Tai Họa Vòng 7</div>
          <p className="text-slate-400 text-xs">
            Từ sau Vòng 6, bàn chơi thu hẹp nhanh hơn để quyết định thắng bại dứt khoát.
          </p>
        </div>
      </div>
    </div>
  );
}
