# 2026-08-29 — Implement Thanh trừng và role loop

- Trạng thái: Hoàn thành implementation prototype; browser smoke test PASS.
- Base: `3cac131`.

## Thay đổi

- Engine thêm phase `purge` từ Vòng 6, resolve đồng thời bốn luật chu kỳ: Cắt bỏ, Đảo chiến tuyến, Ép lộ diện, Khóa mạch.
- Hội đồng chuyển sang mở từ Vòng 2.
- Vote weight Dân làng được tính là 2 trong engine.
- Tiên tri có trạng thái soi phe sáng/phe bóng tối; mục tiêu phe sáng bị khóa soi lại, mục tiêu bóng tối có thể bị kết liễu lần hai.
- Bảo vệ không giới hạn charge, không tự bảo vệ, không được lặp cùng lá ở hai đêm liên tiếp.
- UI thêm presentation **Bình minh đầu tiên / Vòng 1 bắt đầu** sau khi hai bên khóa đội hình, trước `day-A`, để giải thích A đi trước và Vòng 1 chưa có Vote.

## Kiểm tra

- `node --check` cho `engine.mjs` và `ui.mjs`: PASS.
- Engine smoke test khởi tạo/setup: PASS.
- Engine smoke test Vòng 6 Cắt bỏ: PASS.
- Browser preview trang `ui.html`: UI render và console không có lỗi: PASS.

## Giới hạn

- Bảng Vote trung tâm và toàn bộ transition tới Vòng 6 chưa được browser end-to-end test trong lượt này.
- Tooltip disabled cần tiếp tục tinh chỉnh theo từng ngữ cảnh card.
- Chưa có human playtest và chưa xác minh cân bằng.
