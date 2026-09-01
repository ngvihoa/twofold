# Case study — Từ nhịp Day/Night đến Thanh trừng

- Ngày: 29/08/2026
- Trạng thái: **Design decision đã chốt cho prototype; chưa implement và chưa playtest**
- Nguồn: [CONV-005](conversation-index.md#conv-005), [Implementation 2026-08-29-002](implementations/2026-08-29-002-specify-vote-roles-and-purge.md)

## Câu hỏi trung tâm

Làm thế nào để vòng đấu có nhịp thời gian dễ hiểu hơn, Vote có giá trị thông tin rõ hơn, và các vòng cuối không bị hụt áp lực?

## Điểm xuất phát

Prototype đang có chuỗi `day-A → day-B → night-plan → dusk-defense → night-resolution`. Vote/Hội đồng mở từ Vòng 3. Bảo vệ còn dùng charge tổng, Tiên tri chủ yếu chỉ cung cấp thông tin, còn các luật ép nhịp late game đang nằm dưới khái niệm Tai họa/Huyết Nguyệt chưa đồng bộ với Game Flow.

Vấn đề không chỉ là tên phase. Cấu trúc hiện tại trộn lẫn:

- thời điểm trong ngày;
- sub-step kỹ thuật như đặt khiên;
- action công khai và action bí mật;
- pressure event của late game.

## Các hướng đã thảo luận

### Gộp Chạng vạng vào Ban đêm

Giữ việc khóa Main Order trước rồi đặt Bảo vệ như sub-step nội bộ của Ban đêm, nhưng không trình bày Chạng vạng như một thời điểm thứ tư. Kết quả được giữ vì làm nhịp người chơi dễ đọc hơn mà không buộc engine bỏ staging hiện có.

### Đổi tên pressure phase

“Biến cố” bị loại vì quá trung tính. **Thanh trừng** được chọn vì truyền đạt sự chuyển sang giai đoạn tàn khốc từ Vòng 6 và phù hợp với visual đỏ. `PURGE` là tên state/implementation dự kiến; “Thanh trừng” là nhãn người chơi nhìn thấy.

### Đưa Vote về Vòng 2

Mở từ Vòng 2 thay vì Vòng 3 để áp lực xã hội xuất hiện sớm hơn, nhưng vẫn dành Vòng 1 cho việc học bàn và lấy thông tin. Vote không còn là popup: bảng nằm giữa bàn, chọn/bỏ chọn bằng click, đủ đúng 3 voter mới bật Xác nhận.

## Quyết định

### Nhịp vòng mới

```text
Đêm vòng trước
  → Resolve
  → Bình minh / reveal
  → Thanh trừng (từ Vòng 6)
  → Action Ban ngày
  → Vote từ Vòng 2
  → Ban đêm
```

Thanh trừng diễn ra sau Đêm 5 đã resolve và sau Bình minh của Vòng 6, trước action Ban ngày Vòng 6. Hai bên chọn bí mật và resolve đồng thời. Đây là pha bắt buộc, không có Bỏ qua, dùng tông màu đỏ.

### Chu kỳ Thanh trừng prototype

| Vòng | Tên | Tác động |
|---:|---|---|
| 6 | Cắt bỏ | Mỗi bên loại một lá phe mình còn sống |
| 7 | Đảo chiến tuyến | Mỗi bên chọn một lá để hoán đổi vị trí với một lá đối thủ; ownership và role giữ nguyên |
| 8 | Ép lộ diện | Mỗi bên chọn một lá phe mình chưa lộ để công khai role |
| 9 | Khóa mạch | Mỗi bên chọn một lá còn sống để khóa skill và Vote trong vòng hiện tại |

### Vote

- Chọn đúng ba lá phe dân còn sống, đủ điều kiện, của mình làm voter.
- Click lần đầu chọn, click lần hai bỏ chọn.
- Chọn đủ `3/3` thì Xác nhận active; chưa đủ thì disabled.
- Bỏ qua là lựa chọn hợp lệ.
- Sau khi đủ 3 voter mới chọn mục tiêu đối thủ.
- Voter phe dân được chọn lộ role khi xác nhận.
- Dân làng có trọng số 2; role khác có trọng số 1.
- Vote vào lá Dân làng đối thủ vẫn là Treo cổ bình thường.

## Vì sao quyết định này quan trọng

Đây là thay đổi từ một flow thiên về “hành động nối tiếp” sang flow có ba loại cam kết:

1. **Ban ngày:** cam kết công khai bằng skill hoặc Vote và trả giá bằng reveal.
2. **Ban đêm:** cam kết bí mật bằng một main order duy nhất.
3. **Thanh trừng:** cam kết bắt buộc làm phá vỡ thế cân bằng khi trận kéo dài.

Nó cũng chuyển late game từ một card/event riêng lẻ sang một giai đoạn có nhịp và visual identity riêng. Đây là ứng viên tốt cho case study về cách một prototype game thay đổi khi team nhận ra vấn đề pacing không thể giải quyết chỉ bằng thêm skill.

## Tác động lên role

- **Bảo vệ:** không tự bảo vệ; tính theo card ID; cùng một lá không được bảo vệ ở hai đêm liên tiếp; chặn kill/skill tấn công trực tiếp nhưng không chặn soi, debuff hoặc Vote.
- **Tiên tri:** không countdown; mỗi đêm cạnh tranh main order với action giết; lần soi đầu làm lộ role; chỉ lá phe bóng tối đã soi mới có thể soi lần hai để kết liễu; phe sáng đã soi bị disable khỏi mục tiêu soi lại.
- **Dân làng:** trở thành nguồn vote weight 2, nhưng phải lộ role khi được chọn làm voter.
- **Role ban ngày:** dùng skill thành công thì lộ role ngay khi xác nhận.
- **Role ban đêm:** action và source giữ kín tới Bình minh, trừ thông tin được quy định riêng.

## Bằng chứng và giới hạn

- Bằng chứng hiện tại là design review dựa trên prototype và tài liệu; chưa phải browser interaction sau implementation.
- Chưa có dữ liệu người chơi chứng minh Vote từ Vòng 2 hoặc Thanh trừng từ Vòng 6 là cân bằng.
- Chu kỳ V7 Đảo chiến tuyến mới chốt ở mức đổi vị trí, chưa đổi ownership; chi tiết target conflict và priority vẫn cần engine design.
- Cần theo dõi liệu Thanh trừng làm game có quyết định hơn hay chỉ khiến trận snowball nhanh.

## Bài học lưu giữ

- Tên phase nên mô tả trải nghiệm người chơi, còn sub-step kỹ thuật nên nằm trong state machine.
- Một role mạnh hơn cần trả giá bằng thông tin hoặc cơ hội hành động, không nhất thiết bằng countdown.
- Reveal role có thể là currency của Vote: quyền lực lớn hơn đi kèm cam kết công khai.
- Pressure late game hiệu quả hơn khi là nhịp bắt buộc có chu kỳ, thay vì một card đặc biệt không gắn với flow.

## Liên kết

- [Core Gameplay v0.1](../game-design/core-gameplay-v0.1.md)
- [Game Flow v0.1](../game-design/game-flow-v0.1.md)
- [Roles Draft](../game-design/roles-draft.md)
- [ADR-0001](../decisions/0001-core-rules-v0.1.md)
- [Implementation record](implementations/2026-08-29-002-specify-vote-roles-and-purge.md)
- [Prototype experiment log](prototype-experiment-log.md)

## Trạng thái case study

`Đã đánh dấu để tham chiếu sau này.` Khi code được implement và có playtest, cập nhật entry này bằng before/after thực tế, failure signal, screenshot/browser evidence và quyết định giữ hoặc điều chỉnh chu kỳ Thanh trừng.
