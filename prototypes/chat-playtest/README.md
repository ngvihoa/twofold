# PROTOTYPE - Twofold chat playtest

Prototype này trả lời một câu hỏi: vòng chơi `Hội đồng -> Ban ngày -> Phòng thủ -> Ban đêm -> Bình minh` có tạo ra quyết định thú vị và có tự kết thúc khi hai bên điều khiển các bộ bài đối xứng hay không?

Hai vòng mở màn bắt đầu thẳng ở Ban ngày, chưa có Hội đồng/treo cổ. Hội đồng đầu tiên xuất hiện tại bình minh Vòng 3 và là hành động phụ trước Ban ngày, không tiêu lượt chính.

Trước Vòng 1, mỗi bên bí mật sắp xếp thứ tự 10 lá rồi khóa đội hình. Vị trí đã khóa trở thành mã A1–A10 hoặc B1–B10 trong suốt ván.

Bản web hiện là chế độ một người: người chơi điều khiển bên A, còn B là bot local. Bot tự xếp đội hình và chỉ ra quyết định từ thông tin công khai cùng kết quả Tiên tri riêng của chính nó.

Đây là code throwaway. State chỉ nằm trong bộ nhớ và biến mất khi thoát.

## Chạy

```bash
npm run prototype:chat -- --seat=A --seed=twofold-01
```

### Bản web trực quan

Khi local server đang chạy, mở:

```text
http://127.0.0.1:4173/prototypes/chat-playtest/ui.html
```

Ba bố cục thử nghiệm A/B/C nằm trên cùng route và đổi bằng thanh nổi phía dưới hoặc phím mũi tên. Toàn bộ state vẫn chỉ nằm trong bộ nhớ của tab và mất khi tải lại.

`--seat=A` chỉ định tay riêng được hiển thị. Dùng `view B` nếu hai người đang thử chung một máy. Chế độ chat hiện dùng honor mode, chưa chống nhìn trộm tay đối phương.

## Bộ bài mỗi bên

- 1 Dân làng — có thể tham gia Hội đồng sau khi đã lộ diện
- 2 Ma sói
- 1 Tiên tri
- 1 Bảo vệ
- 1 Phù thủy
- 1 Xạ thủ
- 1 Kẻ báo thù
- 1 Mục sư
- 1 Sói Hộ Vệ

## Lệnh chính

```text
council A pass
council A B3 guard A1 A2 A3
day A pass
day A shoot A9 B3
day A revive A8 A2
defend A pass
defend A A4
night A pass
night A attack A5 B4
night A inspect A7 B4
night A poison A8 B4
final A guard
view A
chat
public
quit
```

Hội đồng chỉ mở từ Vòng 3 và cần đúng ba role phe Dân còn sống, đã công khai từ trước. Treo cổ không tiêu quyền loại bỏ, không làm mất lượt chính và ba người tham gia vẫn được dùng kỹ năng Ban ngày. Đoán sai khóa ba người đó khỏi Hội đồng kế tiếp. Sói Hộ Vệ có thể bí mật bảo kê trước một lá và lộ diện nếu chặn đúng án treo cổ.

Kẻ báo thù công khai đánh dấu một mục tiêu Ban ngày; nếu chết trước bình minh kế tiếp, mục tiêu chết theo. Mục sư có một lần thanh tẩy: giết đúng phe Sói, nhưng tự chết nếu chọn nhầm phe Dân.

Bảo vệ chỉ công khai vị trí có khiên. Role của mục tiêu và vị trí Bảo vệ vẫn giữ kín; không được bảo vệ cùng vị trí hai vòng liên tiếp. Khi một lá chết, role thật của nó được công khai.

Lệnh `chat` tạo snapshot công khai ngắn để gửi nguyên văn vào cuộc trò chuyện. Mỗi người chỉ cần giữ bí mật tay riêng của mình và gửi action; một người chạy CLI làm trọng tài/state keeper.
