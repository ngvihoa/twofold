# Twofold Game Core (`@twofold/game-core`)

Gói thư viện chứa các quy tắc trò chơi (ruleset), state machine trận đấu 1v1, định nghĩa vòng chơi và logic phân giải kỹ năng ngày/đêm theo quy tắc v0.1.

## Quy tắc v0.1 đã thống nhất

- Mỗi người bắt đầu với **10 lá trên sân**.
- Host là Người chơi A và **đi trước** ở các pha theo luật v0.1.
- Vòng 1 bắt đầu vào **Ban ngày**: A hành động, rồi B.
- Sau đó là **Ban đêm**: A chọn hành động, rồi B; hành động đêm được giữ kín và giải quyết đồng thời sau khi cả hai đã xác nhận.
- Chi tiết tham khảo: `docs/decisions/0001-core-rules-v0.1.md` và `docs/game-design/game-flow-v0.1.md`.

