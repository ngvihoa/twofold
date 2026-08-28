# PROTOTYPE - Twofold chat playtest

Prototype này trả lời một câu hỏi: vòng chơi `Hội đồng -> Ban ngày -> Phòng thủ -> Ban đêm -> Bình minh` có tạo ra quyết định thú vị và có tự kết thúc khi hai bên điều khiển các bộ bài đối xứng hay không?

Ngoại lệ mở màn: Vòng 1 bắt đầu thẳng ở Ban ngày, chưa có Hội đồng/treo cổ. Hội đồng đầu tiên xuất hiện tại bình minh Vòng 2.

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

- 4 Dân làng
- 2 Ma sói
- 1 Tiên tri
- 1 Bảo vệ
- 1 Phù thủy
- 1 Xạ thủ

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

Hội đồng cần ba lá phe Dân còn sống. Lá đang ẩn sẽ tự lộ khi đứng ra bỏ phiếu. Đoán sai vẫn tiêu hao quyền loại bỏ của vòng và ba lá bỏ phiếu không được dùng kỹ năng Ban ngày trong vòng đó.

Bảo vệ chỉ công khai vị trí có khiên. Role của mục tiêu và vị trí Bảo vệ vẫn giữ kín; không được bảo vệ cùng vị trí hai vòng liên tiếp. Khi một lá chết, role thật của nó được công khai.

Lệnh `chat` tạo snapshot công khai ngắn để gửi nguyên văn vào cuộc trò chuyện. Mỗi người chỉ cần giữ bí mật tay riêng của mình và gửi action; một người chạy CLI làm trọng tài/state keeper.
