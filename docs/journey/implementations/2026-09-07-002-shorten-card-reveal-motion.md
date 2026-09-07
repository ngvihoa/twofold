# Rút ngắn motion lộ bài

- Ngày: 07/09/2026. Phạm vi: Spec Reviewer.
- Yêu cầu PO: bài di chuyển nhanh lên ô, sau đó lật ngửa; bỏ line.
- Thay đổi: travel/arrival từ 4200ms xuống 800ms. Nửa đầu di chuyển tới đích, nửa sau xoay Y để chuyển từ ghost sang card công khai. Bỏ DOM/CSS đường nối. Rút thời gian chờ source và outcome tương ứng để không còn khoảng chờ theo motion cũ.
- Giữ nhánh CSS reduced motion và luật/reveal state hiện có.
- Kiểm tra: `node --check apps/spec-reviewer/game-flow-demo/ui.mjs`, `pnpm tf check -sr` (51/51), `git diff --check` pass.
- Giới hạn: chưa xác minh trực quan từng frame trên browser; PO review nhịp tại local port 4173.
- Chưa commit.
